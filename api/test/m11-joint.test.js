const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
if (!/^user1_a3_test_[a-z0-9_]+$/.test(process.env.DB_NAME || '')) {
  throw new Error('Use an isolated user1_a3_test_* database.');
}
const app = require('../server');
const { pool } = require('../event_db');

test('M11 joint admin and public registration acceptance', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const ids = [];
  let browser, eventId, savedRegistration;
  const payload = { organisation_id: 1, category_id: 1, name: 'M11 joint ' + Date.now(),
    event_datetime: '2035-10-11T14:00:00', location: 'Brisbane', purpose: 'Community support',
    short_description: 'Joint acceptance', full_description: 'Admin and registration integration',
    ticket_price: '12.50', fundraising_goal: '2000', current_progress: '0', status: 'active',
    latitude: null, longitude: null };
  const attendee = { name: 'M11 Joint Attendee', email: 'm11-joint@example.com', tickets: 2 };
  const send = (url, method, body) => fetch(base + url, { method,
    headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const read = async (url) => {
    const response = await fetch(base + url); assert.equal(response.status, 200);
    return response.json();
  };
  const create = async () => {
    const response = await send('/api/admin/events', 'POST', payload);
    assert.equal(response.status, 201);
    const id = (await response.json()).event_id; ids.push(id); return id;
  };
  const checkTime = async (id, dateTime) => {
    const admin = await read('/api/admin/events/' + id);
    const detail = await read('/api/events/' + id);
    const list = await read('/api/admin/events');
    const upcoming = await read('/api/events/upcoming');
    const search = await read('/api/events/search?date=' + dateTime.slice(0, 10));
    for (const event of [admin, detail, list.find(e => e.event_id === id),
      upcoming.find(e => e.event_id === id), search.find(e => e.event_id === id)]) {
      assert.ok(event); assert.equal(event.event_datetime, dateTime + '+10:00');
    }
  };
  try {
    await t.test('admin-created activity has identical times in every public and admin API', async () => {
      eventId = await create();
      await checkTime(eventId, payload.event_datetime);
      const [[row]] = await pool.execute('SELECT DATE_FORMAT(event_datetime, "%Y-%m-%dT%H:%i:%s") AS time FROM events WHERE event_id = ?', [eventId]);
      assert.equal(row.time, payload.event_datetime);
    });
    await t.test('browser registers for admin-created activity and admin sees the same persisted record', async () => {
      browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
      const context = await browser.newContext({ timezoneId: 'America/New_York' });
      const page = await context.newPage();
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + '/detail.html?id=' + eventId);
      await expect(page.locator('#registration-summary')).toContainText('2:00 pm');
      await page.locator('#register-button').click();
      await expect(page.locator('#selected-event')).toContainText('2:00 pm');
      await page.getByLabel('Full name', { exact: true }).fill(attendee.name);
      await page.getByLabel('Email address', { exact: true }).fill(attendee.email);
      await page.getByLabel('Number of tickets', { exact: true }).fill('2');
      const dialog = page.waitForEvent('dialog').then(async d => {
        assert.match(d.message(), /Registration successful/); await d.accept();
      });
      await page.locator('#submit-registration').click(); await dialog;
      await expect(page).toHaveURL(base + '/detail.html?id=' + eventId);
      await expect(page.locator('#attendee-list li strong').first()).toHaveText(attendee.name);
      await page.goto(base + '/admin-event.html?id=' + eventId);
      await expect(page.locator('#event_datetime')).toHaveValue(payload.event_datetime.slice(0, 16));
      await expect(page.locator('#registration-list')).toContainText(attendee.name);
      await expect(page.locator('#registration-list')).toContainText('2 tickets');
      const admin = await read('/api/admin/events/' + eventId);
      const detail = await read('/api/events/' + eventId);
      assert.deepEqual(admin.registrations, detail.registrations);
      savedRegistration = admin.registrations[0];
      assert.equal(Object.hasOwn(savedRegistration, 'email'), false);
      const [[row]] = await pool.execute('SELECT name, email, tickets FROM registrations WHERE registration_id = ?', [savedRegistration.registration_id]);
      assert.deepEqual(row, attendee);
      assert.deepEqual(errors, []); await context.close();
    });
    await t.test('duplicate and invalid submissions fail without altering registration count', async () => {
      for (const [body, status, code] of [
        [{ ...attendee, email: '  M11-JOINT@EXAMPLE.COM  ' }, 409, 'DUPLICATE_REGISTRATION'],
        ...[0, -1, 1.5, '2', 2147483648].map(tickets => [{ ...attendee, tickets }, 400, 'INVALID_TICKETS'])
      ]) {
        const response = await send('/api/events/' + eventId + '/registrations', 'POST', body);
        assert.equal(response.status, status); assert.equal((await response.json()).code, code);
      }
      assert.equal((await read('/api/admin/events/' + eventId)).registrations.length, 1);
      const response = await send('/api/admin/events/' + eventId, 'DELETE');
      assert.equal(response.status, 409); assert.equal((await response.json()).code, 'EVENT_HAS_REGISTRATIONS');
    });
    await t.test('admin update and suspension preserve registrations and synchronized times', async () => {
      const updated = { ...payload, name: payload.name + ' updated', event_datetime: '2035-10-12T09:30:00' };
      assert.equal((await send('/api/admin/events/' + eventId, 'PUT', updated)).status, 200);
      await checkTime(eventId, updated.event_datetime);
      assert.deepEqual((await read('/api/events/' + eventId)).registrations, [savedRegistration]);
      const page = await browser.newPage({ timezoneId: 'Asia/Shanghai' });
      await page.goto(base + '/admin-event.html?id=' + eventId);
      await expect(page.locator('#event_datetime')).toHaveValue('2035-10-12T09:30');
      await page.goto(base + '/detail.html?id=' + eventId);
      await expect(page.locator('#registration-summary')).toContainText('9:30 am');
      assert.equal((await send('/api/admin/events/' + eventId, 'PUT', { ...updated, status: 'suspended' })).status, 200);
      assert.equal((await fetch(base + '/api/events/' + eventId)).status, 404);
      assert.equal((await send('/api/events/' + eventId + '/registrations', 'POST', { ...attendee, email: 'other@example.com' })).status, 404);
      const admin = await read('/api/admin/events/' + eventId);
      assert.deepEqual(admin.registrations, [savedRegistration]);
      assert.equal(admin.event_datetime, updated.event_datetime + '+10:00');
      assert.equal((await send('/api/admin/events/' + eventId, 'DELETE')).status, 409);
      await page.close();
    });
    await t.test('unregistered activity deletes and subsequent public registration returns 404', async () => {
      const id = await create();
      assert.equal((await send('/api/admin/events/' + id, 'DELETE')).status, 200);
      assert.equal((await fetch(base + '/api/admin/events/' + id)).status, 404);
      assert.equal((await send('/api/events/' + id + '/registrations', 'POST', attendee)).status, 404);
    });
  } finally {
    if (browser) await browser.close();
    for (const id of ids) {
      await pool.execute('DELETE FROM registrations WHERE event_id = ?', [id]);
      await pool.execute('DELETE FROM events WHERE event_id = ?', [id]);
    }
    await new Promise(resolve => server.close(resolve)); await pool.end();
  }
});
