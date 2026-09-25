const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./event_db');

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
