const { pool } = require('./event_db');
const { fields } = require('../clientside/assets/js/admin-validation');
async function createEvent(event) {
  const [result] = await pool.execute(
    'INSERT INTO events (' + fields.join(', ') + ') VALUES (' + fields.map(() => '?').join(', ') + ')',
    fields.map((field) => event[field])
  );
  return result.insertId;
}
module.exports = { createEvent };
