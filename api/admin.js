const express = require('express');
const { pool, getEventRegistrations } = require('./event_db');
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
const { createEvent, getEvent, updateEvent, deleteEvent } = require('./admin_db');
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
router.param('id', (req,res,next,id) => {
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1 || Number(id) > 2147483647)
    return res.status(400).json({code:'INVALID_EVENT_ID',message:'Invalid event ID.'});
  next();
});
router.get('/events/:id', async (req,res,next) => {
  try {
    const event = await getEvent(Number(req.params.id));
    if (!event) return res.status(404).json({code:'EVENT_NOT_FOUND',message:'Event not found.'});
    const registrations = await getEventRegistrations(event.event_id);
    res.json({...event, registrations});
  } catch(error) { next(error); }
});
router.put('/events/:id', async (req,res,next) => {
  const event = validatedBody(req,res); if (!event) return;
  try {
    const found = await updateEvent(Number(req.params.id), event);
    if (!found) return res.status(404).json({code:'EVENT_NOT_FOUND',message:'Event not found.'});
    res.json({message:'Event updated.',event_id:Number(req.params.id)});
  } catch(error) { next(error); }
});

router.delete('/events/:id', async (req,res,next) => {
  try {
    if (!await deleteEvent(Number(req.params.id))) return res.status(404).json({code:'EVENT_NOT_FOUND',message:'Event not found.'});
    res.json({message:'Event deleted.',event_id:Number(req.params.id)});
  } catch(error) { next(error); }
});

router.use((error,req,res,next) => {
  if (['EVENT_HAS_REGISTRATIONS','ER_ROW_IS_REFERENCED_2'].includes(error.code)) return res.status(409).json({code:'EVENT_HAS_REGISTRATIONS',message:'This event has registrations and cannot be deleted. Suspend it instead.'});
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({code:'INVALID_REFERENCE',message:'Choose an existing category and organisation.'});
  next(error);
});
module.exports = router;
