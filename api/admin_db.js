const { pool } = require('./event_db');
const { fields } = require('../clientside/assets/js/admin-validation');
async function createEvent(event) {
  const [result] = await pool.execute(
    'INSERT INTO events (' + fields.join(', ') + ') VALUES (' + fields.map(() => '?').join(', ') + ')',
    fields.map((field) => event[field])
  );
  return result.insertId;
}
async function getEvent(id) {
  const columns = fields.filter((field) => field !== 'event_datetime').map((field) => 'e.' + field).join(', ');
  const [rows] = await pool.execute('SELECT e.event_id, ' + columns +
    ", DATE_FORMAT(e.event_datetime, '%Y-%m-%dT%H:%i:%s+10:00') AS event_datetime FROM events e WHERE e.event_id = ?", [id]);
  return rows[0] || null;
}
async function updateEvent(id, event) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT event_id FROM events WHERE event_id = ? FOR UPDATE', [id]);
    if (!rows.length) { await connection.rollback(); return false; }
    await connection.execute('UPDATE events SET ' + fields.map((field) => field + ' = ?').join(', ') +
      ' WHERE event_id = ?', [...fields.map((field) => event[field]), id]);
    await connection.commit();
    return true;
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
async function deleteEvent(id) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Same parent-first lock order as createRegistration, preventing a check/delete race.
    const [events] = await connection.execute('SELECT event_id FROM events WHERE event_id = ? FOR UPDATE', [id]);
    if (!events.length) { await connection.rollback(); return false; }
    const [registrations] = await connection.execute('SELECT registration_id FROM registrations WHERE event_id = ? LIMIT 1 FOR UPDATE', [id]);
    if (registrations.length) {
      const error = new Error('This event has registrations and cannot be deleted. Suspend it instead.');
      error.code = 'EVENT_HAS_REGISTRATIONS'; throw error;
    }
    await connection.execute('DELETE FROM events WHERE event_id = ?', [id]);
    await connection.commit(); return true;
  } catch(error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
module.exports = { createEvent, getEvent, updateEvent, deleteEvent };
