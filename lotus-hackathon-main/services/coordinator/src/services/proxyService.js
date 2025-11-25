const logger = require('../utils/logger');
const aiRoutingService = require('./aiRoutingService');
const registryService = require('./registryService');

/**
 * Proxy Service - Forwards requests to microservices using AI routing
 */
class ProxyService {
  constructor() {
    this.timeout = 30000; // 30 seconds timeout
  }

  /**
   * Build query from request for AI routing
   * @param {Object} req - Express request object
   * @returns {string} - Query string for AI routing
   */
  buildQueryFromRequest(req) {
    // Try to extract intent from path
    const path = req.path || req.url.split('?')[0];
    
    // Build descriptive query from method and path
    const method = req.method;
    const pathParts = path.split('/').filter(p => p);
    
    // Create natural language query
    let query = `${method} request to ${path}`;
    
    // Add context from body if available
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyKeys = Object.keys(req.body).join(', ');
      query += ` with data: ${bodyKeys}`;
    }
    
    // Add context from query params if available
    if (req.query && Object.keys(req.query).length > 0) {
      const queryKeys = Object.keys(req.query).join(', ');
      query += ` with params: ${queryKeys}`;
    }
    
    return query;
  }

  /**
   * Forward request to target microservice
   * @param {Object} req - Express request object
   * @param {Object} targetService - Target service information
   * @returns {Promise<Object>} - Response from microservice
   */
  async forwardRequest(req, targetService) {
    const targetUrl = `${targetService.endpoint}${req.path}`;
    
    logger.info('Forwarding request to microservice', {
      method: req.method,
      path: req.path,
      targetUrl,
      serviceName: targetService.serviceName
    });

    try {
      // Prepare headers (exclude host and connection)
      const headers = { ...req.headers };
      delete headers.host;
      delete headers.connection;
      delete headers['content-length'];
      
      // Add X-Forwarded-* headers
      headers['X-Forwarded-For'] = req.ip || req.connection.remoteAddress;
      headers['X-Forwarded-Proto'] = req.protocol;
      headers['X-Forwarded-Host'] = req.get('host');
      headers['X-Coordinator-Service'] = 'coordinator';
      headers['X-Target-Service'] = targetService.serviceName;

      // Prepare fetch options with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const fetchOptions = {
        method: req.method,
        headers: headers,
        signal: controller.signal
      };

      // Add body for POST, PUT, PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
        fetchOptions.headers['Content-Type'] = 'application/json';
      }

      // Add query string if exists
      let fullUrl = targetUrl;
      if (req.query && Object.keys(req.query).length > 0) {
        const queryString = new URLSearchParams(req.query).toString();
        fullUrl = `${targetUrl}?${queryString}`;
      }

      // Forward the request
      let response;
      try {
        response = await fetch(fullUrl, fetchOptions);
        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }

      // Get response body
      const contentType = response.headers.get('content-type');
      let body;
      
      if (contentType && contentType.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: body
      };
    } catch (error) {
      logger.error('Failed to forward request to microservice', {
        error: error.message,
        targetUrl,
        serviceName: targetService.serviceName
      });
      
      throw new Error(`Failed to forward request: ${error.message}`);
    }
  }

  /**
   * Proxy request using AI routing
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async proxyRequest(req, res) {
    try {
      // Build query from request
      const query = this.buildQueryFromRequest(req);
      
      // Get request context
      const requestContext = {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query
      };

      logger.info('Proxying request through AI routing', {
        query,
        method: req.method,
        path: req.path
      });

      // Create structured data object (same format as other paths)
      const routingData = {
        type: 'proxy_query',
        payload: {
          query: query,
          metadata: {},
          context: requestContext
        },
        context: {
          protocol: 'http',
          source: 'proxy',
          method: req.method,
          path: req.path
        }
      };

      const routingConfig = {
        strategy: 'single',
        priority: 'accuracy'
      };

      // Use AI routing to find target service
      let routingResult;
      try {
        routingResult = await aiRoutingService.routeRequest(routingData, routingConfig);
      } catch (error) {
        logger.warn('AI routing failed, using fallback', {
          error: error.message
        });
        routingResult = await aiRoutingService.fallbackRouting(query);
      }

      // Check if routing was successful
      if (!routingResult.success || !routingResult.routing?.targetServices?.length) {
        return res.status(404).json({
          success: false,
          message: 'No suitable microservice found for this request',
          query: query,
          availableServices: await registryService.getAllServices()
        });
      }

      const firstTargetService = routingResult.routing.targetServices[0];
      const serviceName = firstTargetService.serviceName;

      // Get full service details
      const fullService = await registryService.getServiceByName(serviceName);
      if (!fullService) {
        return res.status(404).json({
          success: false,
          message: `Service ${serviceName} not found in registry`
        });
      }

      // Forward request to target microservice
      const response = await this.forwardRequest(req, fullService);

      // Forward response to client
      // Set status code
      res.status(response.status);

      // Forward headers (exclude some that shouldn't be forwarded)
      const excludeHeaders = ['connection', 'transfer-encoding', 'content-encoding'];
      Object.entries(response.headers).forEach(([key, value]) => {
        if (!excludeHeaders.includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });

      // Send response body
      if (typeof response.body === 'object') {
        res.json(response.body);
      } else {
        res.send(response.body);
      }

      logger.info('Request proxied successfully', {
        method: req.method,
        path: req.path,
        targetService: serviceName,
        statusCode: response.status
      });

    } catch (error) {
      logger.error('Proxy request failed', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        path: req.path
      });

      res.status(502).json({
        success: false,
        message: 'Failed to proxy request to microservice',
        error: error.message
      });
    }
  }
}

// Singleton instance
const proxyService = new ProxyService();

module.exports = proxyService;

