const express = require('express');
const { pool } = require('./event_db');
const router = express.Router();
router.get('/events', async (req, res, next) => {
  try {
    const [events] = await pool.query(`
      SELECT e.event_id, e.name, e.location, e.status, e.ticket_price,
        DATE_FORMAT(e.event_datetime, '%Y-%m-%dT%H:%i:%s+10:00') AS event_datetime,
        c.name AS category_name,
        CASE WHEN e.status = 'suspended' THEN 'Suspended'
          WHEN DATE(e.event_datetime) < DATE(UTC_TIMESTAMP() + INTERVAL 10 HOUR) THEN 'Past'
          ELSE 'Active' END AS display_status,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.event_id) AS registration_count
      FROM events e JOIN categories c ON c.category_id = e.category_id
      ORDER BY e.event_datetime DESC, e.event_id DESC
    `);
    res.json(events);
  } catch (error) { next(error); }
});
module.exports = router;
