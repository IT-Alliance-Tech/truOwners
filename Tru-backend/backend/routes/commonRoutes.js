const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/health', (req, res) => {
  const mongoStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStatus = mongoStatusMap[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    message: 'Health check OK',
    uptime: process.uptime(),
    timestamp: new Date(),
    services: {
      database: {
        status: dbStatus,
        uri: process.env.MONGO_URI ? 'configured' : 'missing'
      }
    }
  });
});

module.exports = router;
