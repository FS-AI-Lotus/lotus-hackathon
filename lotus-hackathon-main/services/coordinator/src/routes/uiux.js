const express = require('express');
const router = express.Router();
const uiuxService = require('../services/uiuxService');
const metricsService = require('../services/metricsService');
const logger = require('../utils/logger');
const { validateUIUXConfig, sanitizeInput } = require('../middleware/validation');

/**
 * POST /uiux
 * Upload/Update UI/UX configuration
 */
router.post('/', sanitizeInput, validateUIUXConfig, async (req, res, next) => {
  try {
    const { config } = req.body;

    const result = uiuxService.updateConfig(config);

    logger.info('UI/UX configuration updated', {
      version: result.version,
      updatedAt: result.updatedAt
    });

    res.status(200).json({
      success: true,
      message: 'UI/UX configuration updated successfully',
      version: result.version,
      lastUpdated: result.updatedAt
    });
  } catch (error) {
    logger.error('Failed to update UI/UX configuration', {
      error: error.message
    });

    next(error);
  }
});

/**
 * GET /uiux
 * Retrieve UI/UX configuration
 */
router.get('/', async (req, res, next) => {
  try {
    const result = uiuxService.getConfig();

    // Increment metrics
    metricsService.incrementUIUXFetches();

    if (!result.success) {
      return res.status(404).json(result);
    }

    logger.info('UI/UX configuration retrieved');

    res.status(200).json(result);
  } catch (error) {
    logger.error('Failed to retrieve UI/UX configuration', {
      error: error.message
    });

    next(error);
  }
});

module.exports = router;


