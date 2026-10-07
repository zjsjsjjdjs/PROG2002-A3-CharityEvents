const { test } = require('node:test');
const assert = require('node:assert/strict');
if (!/^user1_a3_test_[a-z0-9_]+$/.test(process.env.DB_NAME || '')) {
  throw new Error('Use an isolated user1_a3_test_* database.');
}
const app = require('../server');
const { pool } = require('../event_db');

test('M03 event detail API acceptance', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    await t.test('retains A2 fields and returns the selected event attendees, newest first', async () => {
      const response = await fetch(base + '/api/events/3');
      assert.equal(response.status, 200);
      const event = await response.json();
      assert.equal(event.event_id, 3);
      for (const field of ['name', 'full_description', 'ticket_price', 'organisation_name', 'contact_email']) {
        assert.ok(Object.hasOwn(event, field));
      }
      assert.deepEqual(event.registrations.map((r) => r.name), ['Alex Chen', 'Riley Brown', 'Morgan Wu']);
      assert.ok(event.registrations.every((r) => r.event_id === 3 && !Object.hasOwn(r, 'email')));
    });
    await t.test('another event has only its own registrations', async () => {
      const event = await (await fetch(base + '/api/events/5')).json();
      assert.deepEqual(event.registrations.map((r) => r.name), ['Drew Wilson', 'Robin Green', 'Avery Liu']);
      assert.ok(event.registrations.every((r) => r.event_id === 5));
    });
    await t.test('event with no attendees returns an empty array', async () => {
      const event = await (await fetch(base + '/api/events/6')).json();
      assert.deepEqual(event.registrations, []);
    });
    await t.test('invalid, absent and suspended events return explicit errors', async () => {
      for (const [id, status, code] of [['abc', 400, 'INVALID_EVENT_ID'], ['0', 400, 'INVALID_EVENT_ID'],
        ['2147483647', 404, 'EVENT_NOT_FOUND'], ['8', 404, 'EVENT_NOT_FOUND']]) {
        const response = await fetch(base + '/api/events/' + id);
        assert.equal(response.status, status);
        const body = await response.json();
        assert.equal(body.code, code);
        assert.equal(typeof body.message, 'string');
      }
    });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await pool.end();
  }
});

