const { test } = require('node:test');
const assert = require('node:assert/strict');

if (!/^user1_a3_test_[a-z0-9_]+$/.test(process.env.DB_NAME || '')) {
  throw new Error('Set DB_NAME to an isolated user1_a3_test_* database with A2 and M02 SQL imported.');
}
const { pool, getEventRegistrations } = require('../event_db');

test('M02 registration database acceptance', async (t) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await t.test('at least ten fictional samples and same person in different events', async () => {
      const [[row]] = await connection.query('SELECT COUNT(*) AS total FROM registrations');
      assert.ok(row.total >= 10);
      const [[person]] = await connection.execute(
        'SELECT COUNT(DISTINCT event_id) AS events FROM registrations WHERE email = ?',
        ['alex.chen@example.com']);
      assert.equal(person.events, 3);
    });
    await t.test('case-insensitive duplicate email for one event is rejected', async () => {
      await assert.rejects(connection.execute(
        'INSERT INTO registrations (event_id,name,email,tickets) VALUES (1,?,?,1)',
        ['Duplicate', 'ALEX.CHEN@example.com']), { code: 'ER_DUP_ENTRY' });
    });
    await t.test('same email can register for another event and gets a server timestamp', async () => {
      const [result] = await connection.execute(
        'INSERT INTO registrations (event_id,name,email,tickets) VALUES (4,?,?,1)',
        ['Alex Chen', 'alex.chen@example.com']);
      const [[row]] = await connection.execute(
        'SELECT registered_at FROM registrations WHERE registration_id = ?', [result.insertId]);
      assert.ok(row.registered_at instanceof Date);
    });
    await t.test('nonexistent event is rejected by foreign key', async () => {
      await assert.rejects(connection.execute(
        'INSERT INTO registrations (event_id,name,email,tickets) VALUES (2147483647,?,?,1)',
        ['Invalid', 'invalid@example.com']), { code: 'ER_NO_REFERENCED_ROW_2' });
    });
    await t.test('event with registrations cannot be deleted', async () => {
      await assert.rejects(connection.execute('DELETE FROM events WHERE event_id = 1'),
        { code: 'ER_ROW_IS_REFERENCED_2' });
    });
    await t.test('zero and negative tickets are rejected by database checks', async () => {
      for (const tickets of [0, -1]) {
        await assert.rejects(connection.execute(
          'INSERT INTO registrations (event_id,name,email,tickets) VALUES (1,?,?,?)',
          ['Invalid', 'invalid@example.com', tickets]),
          (error) => [3819, 4025].includes(error.errno));
      }
    });
    await t.test('required fields and blank name are rejected', async () => {
      await assert.rejects(connection.execute(
        'INSERT INTO registrations (event_id,name,email,tickets) VALUES (1,NULL,?,1)',
        ['invalid@example.com']), { code: 'ER_BAD_NULL_ERROR' });
      await assert.rejects(connection.execute(
        'INSERT INTO registrations (event_id,name,email,tickets) VALUES (1,?,?,1)',
        ['   ', 'invalid@example.com']), (error) => [3819, 4025].includes(error.errno));
    });
    await t.test('public lists are event-specific, newest first, stable for ties and omit emails', async () => {
      const rows = await getEventRegistrations(3);
      assert.equal(rows.length, 3);
      for (const row of rows) {
        assert.equal(row.event_id, 3);
        assert.equal(Object.hasOwn(row, 'email'), false);
        assert.match(row.registered_at, /Z$/);
      }
      assert.deepEqual(rows.map((row) => row.name), ['Alex Chen', 'Riley Brown', 'Morgan Wu']);
    });
  } finally {
    await connection.rollback();
    connection.release();
    await pool.end();
  }
});
