const express = require('express');
const router = express.Router();
const registryService = require('../services/registryService');
const metricsService = require('../services/metricsService');
const logger = require('../utils/logger');

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (req, res, next) => {
  try {
    // Quick response first
    const startTime = Date.now();
    
    // Try to get services with timeout
    let registeredServices = 0;
    try {
      registeredServices = await Promise.race([
        registryService.getTotalServices(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]);
    } catch (error) {
      logger.warn('Failed to get service count in health check', { error: error.message });
      registeredServices = -1; // Indicate error
    }
    
    const uptime = metricsService.getUptime();
    const responseTime = Date.now() - startTime;

    logger.info('Health check requested', {
      uptime,
      registeredServices,
      responseTime: `${responseTime}ms`
    });

    res.status(200).json({
      status: 'healthy',
      uptime,
      registeredServices: registeredServices >= 0 ? registeredServices : 'unavailable',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check failed', {
      error: error.message,
      stack: error.stack
    });
    // Still return a response even on error
    if (!res.headersSent) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      next(error);
    }
  }
});

module.exports = router;

