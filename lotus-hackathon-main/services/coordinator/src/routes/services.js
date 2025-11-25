const express = require('express');
const router = express.Router();
const registryService = require('../services/registryService');
const logger = require('../utils/logger');

/**
 * GET /services
 * GET /registry
 * Service discovery endpoint - Get all registered services
 */
router.get('/', async (req, res, next) => {
  try {
    const services = await registryService.getAllServices();

    logger.info('Service discovery request', {
      serviceCount: services.length
    });

    res.status(200).json({
      success: true,
      services,
      total: services.length
    });
  } catch (error) {
    logger.error('Failed to retrieve services', {
      error: error.message
    });

    next(error);
  }
});

module.exports = router;

