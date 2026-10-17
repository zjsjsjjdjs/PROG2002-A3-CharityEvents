const mysql = require('mysql2/promise');
const { config } = require('./config');

const pool = mysql.createPool({
  ...config.database,
  waitForConnections: true,
  queueLimit: 0
});

/**
 * Ping a pooled database connection and release it even when ping fails.
 * @returns {Promise<void>} Resolves when MariaDB responds.
 * @throws {Error} When the connection or ping fails.
 */
async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

// Public attendee lists intentionally omit contact email addresses.
/**
 * Read the public attendee list, newest registration first; email is deliberately omitted.
 * @param {number} eventId - Validated positive event identifier.
 * @returns {Promise<Array<object>>} Attendees with UTC ISO registration timestamps.
 */
async function getEventRegistrations(eventId) {
  const [rows] = await pool.execute(`
    SELECT registration_id, event_id, name, tickets,
      UNIX_TIMESTAMP(registered_at) * 1000 AS registered_at_ms
    FROM registrations
    WHERE event_id = ?
    ORDER BY registered_at DESC, registration_id DESC
  `, [eventId]);

  return rows.map(({ registered_at_ms, ...registration }) => ({
    ...registration,
    registered_at: new Date(Number(registered_at_ms)).toISOString()
  }));
}

// Lock the event so registration cannot race an admin delete or suspension.
/**
 * Create one registration in a transaction, locking the event before writing.
 * The parent lock serializes registration with event suspension and deletion.
 * @param {number} eventId - Validated positive identifier of an active event.
 * @param {{name: string, email: string, tickets: number}} input - Validated, normalized registration data.
 * @returns {Promise<object>} Persisted receipt, including its identifier and UTC timestamp.
 * @throws {Error} EVENT_NOT_FOUND for missing/inactive events, ER_DUP_ENTRY for repeated event/email pairs, or a database error.
 */
async function createRegistration(eventId, { name, email, tickets }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [events] = await connection.execute(
      "SELECT event_id FROM events WHERE event_id = ? AND status = 'active' FOR UPDATE",
      [eventId]
    );
    if (events.length === 0) {
      const error = new Error('Event not found.');
      error.code = 'EVENT_NOT_FOUND';
      throw error;
    }
    const [result] = await connection.execute(
      'INSERT INTO registrations (event_id, name, email, tickets) VALUES (?, ?, ?, ?)',
      [eventId, name, email, tickets]
    );
    const [[row]] = await connection.execute(
      'SELECT UNIX_TIMESTAMP(registered_at) * 1000 AS time_ms FROM registrations WHERE registration_id = ?',
      [result.insertId]
    );
    await connection.commit();
    return {
      registration_id: result.insertId, event_id: eventId, name, email, tickets,
      registered_at: new Date(Number(row.time_ms)).toISOString()
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection, getEventRegistrations, createRegistration };
