const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { pool, testConnection } = require('./event_db');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
