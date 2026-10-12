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
const { createEvent } = require('./admin_db');
const { validate } = require('../clientside/assets/js/admin-validation');
function validatedBody(req, res) {
  if (!req.is('application/json')) { res.status(415).json({code:'UNSUPPORTED_MEDIA_TYPE',message:'Use application/json.'}); return null; }
  const result = validate(req.body);
  if (Object.keys(result.errors).length) { res.status(400).json({code:'INVALID_EVENT',message:Object.values(result.errors).join(' '),fields:result.errors}); return null; }
  return result.value;
}
router.get('/organisations', async (req,res,next) => {
  try { const [rows] = await pool.query('SELECT organisation_id, name FROM organisations ORDER BY name'); res.json(rows); }
  catch(error) { next(error); }
});
router.post('/events', async (req,res,next) => {
  const event = validatedBody(req,res); if (!event) return;
  try { const eventId = await createEvent(event); res.status(201).json({message:'Event created.',event_id:eventId}); }
  catch(error) { next(error); }
});
router.use((error,req,res,next) => {
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({code:'INVALID_REFERENCE',message:'Choose an existing category and organisation.'});
  next(error);
});
module.exports = router;
