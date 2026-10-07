const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium, expect } = require('@playwright/test');
if (!/^user1_a3_test_[a-z0-9_]+$/.test(process.env.DB_NAME || '')) {
  throw new Error('Use an isolated user1_a3_test_* database.');
}
const app = require('../server');
const { pool } = require('../event_db');

test('M05 complete registration browser acceptance', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const prefix = 'm05-' + Date.now() + '-';
  const email = prefix + 'browser@example.com';
  const attendee = 'A3 Browser Attendee';
  let browser;
  try {
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const output = path.resolve(__dirname, '../../submission');
    fs.mkdirSync(output, { recursive: true });
    const submitWithDialog = async () => {
      const dialogResult = page.waitForEvent('dialog', { timeout: 10000 }).then(async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        return message;
      });
      await page.locator('#submit-registration').click();
      return dialogResult;
    };
    const fill = async (address = email, name = attendee, tickets = '2') => {
      await page.getByLabel('Full name', { exact: true }).fill(name);
      await page.getByLabel('Email address', { exact: true }).fill(address);
      await page.getByLabel('Number of tickets', { exact: true }).fill(tickets);
    };

    await t.test('detail navigates to the correct event and registration form loads it', async () => {
      await page.goto(base + '/detail.html?id=3');
      await expect(page.locator('#register-button')).toBeEnabled();
      await page.locator('#register-button').click();
      await expect(page).toHaveURL(base + '/register.html?id=3');
      await expect(page.locator('#submit-registration')).toBeEnabled();
      await expect(page.locator('#selected-event')).toContainText('Artists for Relief Silent Auction');
      await expect(page.locator('#back-to-event')).toHaveAttribute('href', 'detail.html?id=3');
      await page.screenshot({ path: path.join(output, 'm05-register-desktop.jpg'), fullPage: true, quality: 50 });
    });
    await t.test('missing name, invalid email and illegal tickets show alert dialogs', async () => {
      assert.match(await submitWithDialog(), /full name/);
      await fill('invalid-email');
      assert.match(await submitWithDialog(), /valid email/);
      for (const value of ['0', '-1', '1.5', '2147483648']) {
        await fill(email, attendee, value);
        assert.match(await submitWithDialog(), /whole number/);
      }
      await expect(page).toHaveURL(base + '/register.html?id=3');
    });
    await t.test('successful submission confirms and returns to detail with the new record first', async () => {
      await fill('  ' + email.toUpperCase() + '  ');
      assert.match(await submitWithDialog(), /Registration successful for Artists for Relief Silent Auction/);
      await expect(page).toHaveURL(base + '/detail.html?id=3');
      await expect(page.locator('#attendee-list li strong').first()).toHaveText(attendee);
      await expect(page.locator('#attendee-list li').first()).toContainText('2 tickets');
      const [[row]] = await pool.execute('SELECT COUNT(*) AS total FROM registrations WHERE event_id = 3 AND email = ?', [email]);
      assert.equal(row.total, 1);
    });
    await t.test('duplicate email displays API error and preserves entered data', async () => {
      await page.locator('#register-button').click();
      await expect(page.locator('#submit-registration')).toBeEnabled();
      await fill(email.toUpperCase());
      assert.match(await submitWithDialog(), /already registered/);
      await expect(page).toHaveURL(base + '/register.html?id=3');
      await expect(page.getByLabel('Full name', { exact: true })).toHaveValue(attendee);
      await expect(page.locator('#submit-registration')).toBeEnabled();
    });
    await t.test('mobile registration allows the same email for a different event without overflow', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(base + '/register.html?id=4');
      await expect(page.locator('#submit-registration')).toBeEnabled();
      await expect(page.locator('#selected-event')).toContainText('Voices of Hope Concert');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.screenshot({ path: path.join(output, 'm05-register-mobile.jpg'), fullPage: true, quality: 50 });
      await fill();
      assert.match(await submitWithDialog(), /Registration successful for Voices of Hope Concert/);
      await expect(page).toHaveURL(base + '/detail.html?id=4');
      await expect(page.locator('#attendee-list li strong').first()).toHaveText(attendee);
    });
    await t.test('invalid, absent and suspended events leave the form disabled', async () => {
      for (const id of ['abc', '2147483647', '8']) {
        await page.goto(base + '/register.html?id=' + id);
        await expect(page.locator('#registration-status')).toContainText(id === 'abc' ? 'No valid event' : 'Event not found');
        await expect(page.locator('#submit-registration')).toBeDisabled();
      }
    });
    await t.test('load failure and submission network failure show actionable feedback', async () => {
      await page.route('**/api/events/3', (route) => route.abort('failed'));
      await page.goto(base + '/register.html?id=3');
      await expect(page.locator('#registration-status')).toContainText('Check your connection');
      await expect(page.locator('#submit-registration')).toBeDisabled();
      await page.unroute('**/api/events/3');
      await page.goto(base + '/register.html?id=3');
      await expect(page.locator('#submit-registration')).toBeEnabled();
      await page.route('**/api/events/3/registrations', (route) => route.abort('failed'));
      await fill(prefix + 'offline@example.com');
      assert.match(await submitWithDialog(), /could not be confirmed/);
      await expect(page.locator('#submit-registration')).toBeEnabled();
      await page.unroute('**/api/events/3/registrations');
    });
    await t.test('double submission is disabled and markup in a name is rendered as text', async () => {
      await page.setViewportSize({ width: 1280, height: 900 });
      const literalName = '<img src=x onerror=alert(1)>';
      await fill(prefix + 'literal@example.com', literalName);
      let requests = 0;
      let releaseRequest;
      const requestGate = new Promise((resolve) => { releaseRequest = resolve; });
      await page.route('**/api/events/3/registrations', async (route) => {
        requests++;
        await requestGate;
        await route.continue();
      });
      const dialog = page.waitForEvent('dialog').then(async (dialog) => {
        assert.match(dialog.message(), /Registration successful/);
        await dialog.accept();
      });
      await page.locator('#submit-registration').click();
      await expect(page.locator('#submit-registration')).toBeDisabled();
      await page.locator('#registration-form').evaluate((form) => form.requestSubmit());
      releaseRequest();
      await dialog;
      await expect(page).toHaveURL(base + '/detail.html?id=3');
      await expect(page.locator('#attendee-list li strong').first()).toHaveText(literalName);
      assert.equal(await page.locator('#attendee-list img').count(), 0);
      assert.equal(requests, 1);
      await page.unroute('**/api/events/3/registrations');
    });
    assert.deepEqual(errors, []);
  } finally {
    if (browser) await browser.close();
    await pool.execute('DELETE FROM registrations WHERE email LIKE ?', [prefix + '%']);
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
});

