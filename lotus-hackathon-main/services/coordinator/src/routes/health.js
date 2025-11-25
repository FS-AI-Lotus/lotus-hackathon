const express = require('express');
const router = express.Router();
const registryService = require('../services/registryService');
const metricsService = require('../services/metricsService');
const logger = require('../utils/logger');

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  const uptime = metricsService.getUptime();
  const registeredServices = await registryService.getTotalServices();

  logger.info('Health check requested', {
    uptime,
    registeredServices
  });

  res.status(200).json({
    status: 'healthy',
    uptime,
    registeredServices
  });
});

module.exports = router;

