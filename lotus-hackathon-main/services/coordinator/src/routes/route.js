const express = require('express');
const router = express.Router();
const aiRoutingService = require('../services/aiRoutingService');
const logger = require('../utils/logger');
const { sanitizeInput } = require('../middleware/validation');

/**
 * POST /route
 * AI-based routing - Determine which microservice should handle a request
 */
router.post('/', sanitizeInput, async (req, res, next) => {
  try {
    const { query, intent, method, path, body } = req.body;

    // Validate input
    if (!query && !intent) {
      return res.status(400).json({
        success: false,
        message: 'Either "query" or "intent" is required'
      });
    }

    const userQuery = query || intent;
    const requestContext = {
      method: method || req.method,
      path: path || req.path,
      body: body || req.body
    };

    // Create structured data object (same format as gRPC)
    const routingData = {
      type: 'http_query',
      payload: {
        query: userQuery,
        metadata: req.body.metadata || {},
        context: requestContext
      },
      context: {
        protocol: 'http',
        source: 'rest',
        method: req.method,
        path: req.path
      }
    };

    const routingConfig = {
      strategy: req.body.routing?.strategy || 'single',
      priority: req.body.routing?.priority || 'accuracy'
    };

    logger.info('AI routing request', {
      query: userQuery,
      data: routingData,
      config: routingConfig
    });

    // Attempt AI routing
    let routingResult;
    try {
      routingResult = await aiRoutingService.routeRequest(routingData, routingConfig);
    } catch (error) {
      // Fallback to rule-based routing if OpenAI fails
      logger.warn('AI routing failed, using fallback', {
        error: error.message
      });
      routingResult = await aiRoutingService.fallbackRouting(userQuery);
    }

    if (!routingResult.success) {
      return res.status(404).json({
        success: false,
        message: 'No suitable service found for this request',
        ...routingResult
      });
    }

    res.status(200).json(routingResult);
  } catch (error) {
    logger.error('Routing endpoint error', {
      error: error.message,
      stack: error.stack
    });

    next(error);
  }
});

/**
 * GET /route
 * Get routing information (simple query)
 */
router.get('/', async (req, res, next) => {
  try {
    const { q, query, intent } = req.query;

    const userQuery = q || query || intent;

    if (!userQuery) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q", "query", or "intent" is required'
      });
    }

    logger.info('AI routing request (GET)', {
      query: userQuery
    });

    // Attempt AI routing
    let routingResult;
    try {
      routingResult = await aiRoutingService.routeRequest(userQuery, {
        method: 'GET',
        path: req.path
      });
    } catch (error) {
      // Fallback to rule-based routing
      logger.warn('AI routing failed, using fallback', {
        error: error.message
      });
      routingResult = aiRoutingService.fallbackRouting(userQuery);
    }

    if (!routingResult.success) {
      return res.status(404).json({
        success: false,
        message: 'No suitable service found for this request',
        ...routingResult
      });
    }

    res.status(200).json(routingResult);
  } catch (error) {
    logger.error('Routing endpoint error', {
      error: error.message
    });

    next(error);
  }
});

module.exports = router;

