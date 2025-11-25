const express = require('express');
const router = express.Router();
const metricsService = require('../services/metricsService');
const logger = require('../utils/logger');

/**
 * GET /metrics
 * Prometheus metrics endpoint
 */
router.get('/', async (req, res) => {
  try {
    const metrics = metricsService.getPrometheusMetrics();

    logger.debug('Metrics requested');

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.status(200).send(metrics);
  } catch (error) {
    logger.error('Failed to retrieve metrics', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics'
    });
  }
});

module.exports = router;


