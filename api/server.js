const express = require('express');
const path = require('path');
const cors = require('cors');
const { config } = require('./config');
const { adminAccess } = require('./admin-access');

const { pool, testConnection, getEventRegistrations } = require('./event_db');

const registrationRouter = require('./registration');

const app = express();
const protectAdmin = adminAccess(config);

app.use(cors({ origin: (origin, callback) => callback(null, Boolean(origin && config.allowedOrigins.includes(origin))) }));
app.use(express.json());

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1000 && year <= 9999
    && date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function isPositiveInteger(value) {
  return typeof value === 'string' && /^\d+$/.test(value)
    && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

app.get('/api/health', async (req, res) => {
  try {
    await testConnection();
    res.json({
      status: 'ok',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'unavailable',
      message: 'Unable to connect to the database.'
    });
  }
});

// Event DATETIME values represent Brisbane local time (UTC+10).
app.get('/api/events/upcoming', async (req, res, next) => {
  try {
    const [events] = await pool.query(`
      SELECT
        e.event_id,
        e.name,
        DATE_FORMAT(e.event_datetime, '%Y-%m-%dT%H:%i:%s+10:00') AS event_datetime,
        e.location,
        e.purpose,
        e.short_description,
        e.ticket_price,
        e.fundraising_goal,
        e.current_progress,
        e.status,
        c.category_id,
        c.name AS category_name
      FROM events e
      INNER JOIN categories c ON e.category_id = c.category_id
      WHERE e.status = 'active'
        AND e.event_datetime >= DATE(UTC_TIMESTAMP() + INTERVAL 10 HOUR)
      ORDER BY e.event_datetime ASC, e.event_id ASC
    `);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

app.get('/api/categories', async (req, res, next) => {
  try {
    const [categories] = await pool.query(`
      SELECT
        category_id,
        name,
        description
      FROM categories
      ORDER BY name
    `);

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

app.get('/api/events/search', async (req, res, next) => {
  try {
    const filters = {};
    for (const field of ['date', 'location', 'categoryId']) {
      const value = req.query[field];
      if (value !== undefined && typeof value !== 'string') {
        return res.status(400).json({
          message: `${field} must be a single text value.`
        });
      }
      filters[field] = (value || '').trim();
    }
    const { date, location, categoryId } = filters;

    if (date && !isValidDate(date)) {
      return res.status(400).json({
        message: 'Date must be a valid calendar date in YYYY-MM-DD format (years 1000-9999).'
      });
    }

    if (categoryId && !isPositiveInteger(categoryId)) {
      return res.status(400).json({
        message: 'Category ID must be a positive safe integer.'
      });
    }

    const conditions = ["e.status = 'active'"];
    const values = [];

    if (date) {
      conditions.push('DATE(e.event_datetime) = ?');
      values.push(date);
    }

    if (location) {
      conditions.push('e.location LIKE ?');
      values.push(`%${location}%`);
    }

    if (categoryId) {
      conditions.push('e.category_id = ?');
      values.push(Number(categoryId));
    }

    const [events] = await pool.query(`
      SELECT
        e.event_id,
        e.name,
        e.event_datetime,
        e.location,
        e.purpose,
        e.short_description,
        e.ticket_price,
        e.fundraising_goal,
        e.current_progress,
        e.status,
        c.category_id,
        c.name AS category_name
      FROM events e
      INNER JOIN categories c
        ON e.category_id = c.category_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY e.event_datetime ASC
    `, values);

    res.json(events);
  } catch (error) {
    next(error);
  }
});

app.get('/api/events/:id', async (req, res, next) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      code: 'INVALID_EVENT_ID',
      message: 'Event ID must be a positive number.'
    });
  }

  try {
    const [events] = await pool.query(`
      SELECT
        e.event_id,
        e.name,
        e.event_datetime,
        e.location,
        e.purpose,
        e.short_description,
        e.full_description,
        e.ticket_price,
        e.fundraising_goal,
        e.current_progress,
        e.status,
        e.latitude,
        e.longitude,
        c.category_id,
        c.name AS category_name,
        o.organisation_id,
        o.name AS organisation_name,
        o.mission AS organisation_mission,
        o.contact_email,
        o.contact_phone,
        o.website_url
      FROM events e
      INNER JOIN categories c
        ON e.category_id = c.category_id
      INNER JOIN organisations o
        ON e.organisation_id = o.organisation_id
      WHERE e.event_id = ?
        AND e.status = 'active'
      LIMIT 1
    `, [Number(id)]);

    if (events.length === 0) {
      return res.status(404).json({
        code: 'EVENT_NOT_FOUND',
        message: 'Event not found.'
      });
    }

    const registrations = await getEventRegistrations(Number(id));
    res.json({ ...events[0], registrations });
  } catch (error) {
    next(error);
  }
});

app.use('/api/events/:id/registrations', registrationRouter);

// Backend routes keep public filtering unchanged.
app.use('/api/admin', protectAdmin, require('./admin'));
app.get(['/admin.html', '/admin-event.html'], protectAdmin);

// Serve only public client files, keeping API credentials outside the web root.
app.use(express.static(path.join(__dirname, '..', 'clientside')));

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found.'
  });
});

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ code: 'INVALID_JSON', message: 'Request body must be valid JSON.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' });
  }
  console.error('Request failed:', error.code || error.name);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Internal server error.' });
});

if (require.main === module) require('./start')(app);

module.exports = app;
