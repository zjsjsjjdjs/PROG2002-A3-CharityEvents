const { test } = require('node:test');
const assert = require('node:assert/strict');
if (!/^user1_a3_test_[a-z0-9_]+$/.test(process.env.DB_NAME || '')) {
  throw new Error('Use an isolated user1_a3_test_* database.');
}
const app = require('../server');
const { pool } = require('../event_db');

test('M04 registration API acceptance', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const prefix = 'm04-' + Date.now() + '-';
  const email = prefix + 'person@example.com';
  const body = { name: 'New Attendee', email, tickets: 2 };
  const post = (id, data) => fetch(base + '/api/events/' + id + '/registrations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  const errorCheck = async (response, status, code) => {
    assert.equal(response.status, status);
    const json = await response.json();
    assert.equal(json.code, code);
    assert.equal(typeof json.message, 'string');
    assert.equal(Object.hasOwn(json, 'stack'), false);
  };
  try {
    await t.test('valid submission is normalized and persisted with server time', async () => {
      const response = await post(3, { ...body, name: '  New Attendee  ', email: '  ' + email.toUpperCase() + '  ' });
      assert.equal(response.status, 201);
      const { registration } = await response.json();
      assert.equal(registration.email, email);
      assert.equal(registration.name, body.name);
      assert.equal(registration.tickets, 2);
      assert.ok(Math.abs(Date.now() - Date.parse(registration.registered_at)) < 10000);
      const [[row]] = await pool.execute('SELECT * FROM registrations WHERE registration_id = ?',
        [registration.registration_id]);
      assert.equal(row.event_id, 3);
      assert.equal(row.email, email);
      assert.equal(row.tickets, 2);
    });
    await t.test('duplicate registration returns 409; another event accepts the same email', async () => {
      await errorCheck(await post(3, { ...body, email: email.toUpperCase() }), 409, 'DUPLICATE_REGISTRATION');
      assert.equal((await post(4, body)).status, 201);
    });
    await t.test('required and malformed names are rejected', async () => {
      for (const name of [undefined, null, '', '   ', [], 42, 'x'.repeat(121), 'bad\nname']) {
        await errorCheck(await post(3, { ...body, name }), 400, 'INVALID_NAME');
      }
    });
    await t.test('missing, malformed and excessive emails are rejected', async () => {
      for (const email of [undefined, null, '', [], 'plain', 'x@@example.com', '.x@example.com',
        'x..y@example.com', 'x@-example.com', 'x@example..com', 'x y@example.com',
        'x'.repeat(65) + '@example.com', 'x@' + 'a'.repeat(64) + '.com']) {
        await errorCheck(await post(3, { ...body, email }), 400, 'INVALID_EMAIL');
      }
    });
    await t.test('non-integer, missing, negative and overflow tickets are rejected', async () => {
      for (const tickets of [undefined, null, '1', 0, -1, 1.5, true, [], 2147483648]) {
        await errorCheck(await post(3, { ...body, tickets }), 400, 'INVALID_TICKETS');
      }
    });
    await t.test('missing or suspended events cannot receive registrations', async () => {
      await errorCheck(await post(2147483647, body), 404, 'EVENT_NOT_FOUND');
      await errorCheck(await post(8, body), 404, 'EVENT_NOT_FOUND');
      await errorCheck(await post('abc', body), 400, 'INVALID_EVENT_ID');
      await errorCheck(await post('0', body), 400, 'INVALID_EVENT_ID');
    });
    await t.test('invalid JSON and non-object bodies return explicit client errors', async () => {
      const response = await fetch(base + '/api/events/3/registrations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"name":'
      });
      await errorCheck(response, 400, 'INVALID_JSON');
      await errorCheck(await post(3, []), 400, 'INVALID_BODY');
      await errorCheck(await post(3, {}), 400, 'INVALID_NAME');
      await errorCheck(await fetch(base + '/api/events/3/registrations', {
        method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'hello'
      }), 415, 'UNSUPPORTED_MEDIA_TYPE');
    });
    await t.test('concurrent duplicate requests create exactly one registration', async () => {
      const concurrent = { ...body, email: prefix + 'concurrent@example.com' };
      const responses = await Promise.all([post(5, concurrent), post(5, concurrent)]);
      assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
      const [[row]] = await pool.execute(
        'SELECT COUNT(*) AS total FROM registrations WHERE event_id = 5 AND email = ?', [concurrent.email]);
      assert.equal(row.total, 1);
    });
    await t.test('SQL-like names are stored as text, without changing existing records', async () => {
      const maliciousName = "Robert'); DROP TABLE events;--";
      const response = await post(3, { ...body, name: maliciousName, email: prefix + 'text@example.com' });
      assert.equal(response.status, 201);
      const json = await response.json();
      assert.equal(json.registration.name, maliciousName);
      const [[row]] = await pool.query('SELECT COUNT(*) AS total FROM events');
      assert.equal(row.total, 8);
    });
  } finally {
    await pool.execute('DELETE FROM registrations WHERE email LIKE ?', [prefix + '%']);
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
});

