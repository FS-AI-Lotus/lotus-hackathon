const express = require('express');
const router = express.Router();
const registryService = require('../services/registryService');
const metricsService = require('../services/metricsService');
const logger = require('../utils/logger');

/**
 * GET /health
 * Health check endpoint - responds immediately for Railway health checks
 * MUST respond in < 100ms or Railway will kill the container
 */
router.get('/', (req, res) => {
  // Respond IMMEDIATELY - no dependencies, no async, no logging that could block
  // This is critical for Railway health checks
  res.status(200).json({
    status: 'healthy',
    service: 'coordinator',
    timestamp: new Date().toISOString()
  });
  
  // Everything else happens AFTER response is sent (non-blocking)
  setImmediate(() => {
    try {
      const uptime = metricsService.getUptime();
      logger.info('Health check', { uptime });
      
      // Optionally get service count in background
      Promise.race([
        registryService.getTotalServices(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]).then(registeredServices => {
        logger.debug('Health check - service count', { registeredServices });
      }).catch(() => {
        // Silently fail
      });
    } catch (error) {
      // Silently fail - health check already responded
    }
  });
});

module.exports = router;

