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
    // Note: routeRequest already handles fallback internally if AI routing fails
    let routingResult;
    try {
      routingResult = await aiRoutingService.routeRequest(routingData, routingConfig);
    } catch (error) {
      // If routing fails completely (e.g., no active services), return error
      logger.error('Routing failed completely', {
        error: error.message
      });
      return res.status(502).json({
        success: false,
        message: error.message || 'No active services available for routing',
        query: userQuery
      });
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
    // Note: routeRequest already handles fallback internally if AI routing fails
    let routingResult;
    try {
      // Create proper routing data structure for GET request
      const routingData = {
        type: 'query',
        payload: {
          query: userQuery,
          metadata: {},
          context: {
            method: 'GET',
            path: req.path
          }
        },
        context: {
          protocol: 'http',
          source: 'route',
          method: 'GET',
          path: req.path
        }
      };
      
      routingResult = await aiRoutingService.routeRequest(routingData, {
        method: 'GET',
        path: req.path
      });
    } catch (error) {
      // If routing fails completely (e.g., no active services), return error
      logger.error('Routing failed completely', {
        error: error.message
      });
      return res.status(502).json({
        success: false,
        message: error.message || 'No active services available for routing',
        query: userQuery
      });
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

