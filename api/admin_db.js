const { pool } = require('./event_db');
const { fields } = require('../clientside/assets/js/admin-validation');
/**
 * Insert only the whitelisted event fields using bound SQL parameters.
 * @param {object} event - Event data already normalized and validated by the admin route.
 * @returns {Promise<number>} Generated event identifier.
 * @throws {Error} When database constraints or the insert fail.
 */
async function createEvent(event) {
  const [result] = await pool.execute(
    'INSERT INTO events (' + fields.join(', ') + ') VALUES (' + fields.map(() => '?').join(', ') + ')',
    fields.map((field) => event[field])
  );
  return result.insertId;
}
/**
 * Read an event and serialize its Brisbane-local DATETIME with an explicit +10:00 offset.
 * @param {number} id - Validated event identifier.
 * @returns {Promise<object|null>} Event record or null when absent.
 */
async function getEvent(id) {
  const columns = fields.filter((field) => field !== 'event_datetime').map((field) => 'e.' + field).join(', ');
  const [rows] = await pool.execute('SELECT e.event_id, ' + columns +
    ", DATE_FORMAT(e.event_datetime, '%Y-%m-%dT%H:%i:%s+10:00') AS event_datetime FROM events e WHERE e.event_id = ?", [id]);
  return rows[0] || null;
}
/**
 * Replace editable event fields inside a parent-row transaction; registrations are retained.
 * @param {number} id - Validated event identifier.
 * @param {object} event - Complete validated event input, not a partial patch.
 * @returns {Promise<boolean>} True when updated; false when the event no longer exists.
 */
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
/**
 * Delete only an event with no registrations, using the same parent-first lock order as registration.
 * @param {number} id - Validated event identifier.
 * @returns {Promise<boolean>} True when deleted; false when absent.
 * @throws {Error} EVENT_HAS_REGISTRATIONS when protected, or a database failure; the transaction rolls back.
 */
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
// Update only status; never replay stale form fields when pausing an event.
// The parent row lock is shared with registration creation and deletion.
/**
 * Update status alone while preserving event details and existing registrations.
 * @param {number} id - Validated event identifier.
 * @param {"active"|"suspended"} status - Desired state validated by the route.
 * @returns {Promise<boolean>} True when updated; false when absent.
 */
async function updateEventStatus(id, status) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT event_id FROM events WHERE event_id = ? FOR UPDATE', [id]);
    if (!rows.length) { await connection.rollback(); return false; }
    await connection.execute('UPDATE events SET status = ? WHERE event_id = ?', [status, id]);
    await connection.commit(); return true;
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
module.exports = { createEvent, getEvent, updateEvent, deleteEvent, updateEventStatus };
