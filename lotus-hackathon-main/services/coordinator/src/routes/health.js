const express = require('express');
const router = express.Router();
const registryService = require('../services/registryService');
const metricsService = require('../services/metricsService');
const logger = require('../utils/logger');

/**
 * GET /health
 * Health check endpoint - responds immediately for Railway health checks
 */
router.get('/', (req, res) => {
  // Respond immediately - no async operations
  // Railway health checks need fast responses (< 1 second)
  const uptime = metricsService.getUptime();
  
  res.status(200).json({
    status: 'healthy',
    uptime,
    timestamp: new Date().toISOString(),
    service: 'coordinator'
  });
  
  // Optionally get service count in background (non-blocking)
  setImmediate(async () => {
    try {
      const registeredServices = await Promise.race([
        registryService.getTotalServices(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]);
      logger.info('Health check - service count updated', { registeredServices });
    } catch (error) {
      // Silently fail - health check already responded
      logger.debug('Health check - service count unavailable', { error: error.message });
    }
  });
});

module.exports = router;

