const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'charityevents_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

// Public attendee lists intentionally omit contact email addresses.
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

module.exports = { pool, testConnection, getEventRegistrations };
