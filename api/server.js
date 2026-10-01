const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { pool, testConnection } = require('./event_db');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isPositiveInteger(value) {
  return /^\d+$/.test(value) && Number(value) > 0;
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
  const { date, location, categoryId } = req.query;

  if (date && !isValidDate(date)) {
    return res.status(400).json({
      message: 'Date must use YYYY-MM-DD format.'
    });
  }

  if (categoryId && !isPositiveInteger(categoryId)) {
    return res.status(400).json({
      message: 'Category ID must be a positive number.'
    });
  }

  const conditions = ["e.status = 'active'"];
  const values = [];

  if (date) {
    conditions.push('DATE(e.event_datetime) = ?');
    values.push(date);
  }

  if (location && location.trim()) {
    conditions.push('e.location LIKE ?');
    values.push(`%${location.trim()}%`);
  }

  if (categoryId) {
    conditions.push('e.category_id = ?');
    values.push(Number(categoryId));
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
        message: 'Event not found.'
      });
    }

    res.json(events[0]);
  } catch (error) {
    next(error);
  }
});

// Serve only public client files, keeping API credentials outside the web root.
app.use(express.static(path.join(__dirname, '..', 'clientside')));

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found.'
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    message: 'Internal server error.'
  });
});

app.listen(port, () => {
  console.log(`Charity events API is running on port ${port}`);
});
