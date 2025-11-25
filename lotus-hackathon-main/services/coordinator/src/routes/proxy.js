const express = require('express');
const router = express.Router();
const proxyService = require('../services/proxyService');
const logger = require('../utils/logger');

/**
 * Catch-all proxy route - All requests go through AI routing
 * This route should be registered LAST (after all specific routes)
 * 
 * Note: This route only catches requests that don't match any coordinator endpoints
 * because Express routes are matched in order, and coordinator routes are registered first
 */
router.all('*', async (req, res, next) => {
  try {
    // Skip if this is a coordinator internal endpoint
    // (This is a safety check, but these should already be handled by other routes)
    const coordinatorPaths = [
      '/register',
      '/uiux',
      '/services',
      '/registry',
      '/route',
      '/knowledge-graph',
      '/graph',
      '/health',
      '/metrics'
    ];

    const isCoordinatorPath = coordinatorPaths.some(path => 
      req.path === path || req.path.startsWith(path + '/')
    );

    if (isCoordinatorPath) {
      // This shouldn't happen if routes are registered correctly,
      // but if it does, let Express handle it (will go to 404)
      return next();
    }

    // Proxy all other requests through AI routing
    await proxyService.proxyRequest(req, res);
  } catch (error) {
    logger.error('Proxy route error', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    });
    
    // Don't call next() here - we've already sent a response or are about to
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal proxy error',
        error: error.message
      });
    }
  }
});

module.exports = router;

