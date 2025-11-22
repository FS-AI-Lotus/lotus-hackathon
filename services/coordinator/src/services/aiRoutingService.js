const OpenAI = require('openai');
const logger = require('../utils/logger');
const registryService = require('./registryService');

/**
 * AI-Powered Routing Service
 * Uses OpenAI to intelligently route requests to appropriate microservices
 */
class AIRoutingService {
  constructor() {
    this.openai = null;
    this.aiEnabled = process.env.AI_ROUTING_ENABLED === 'true';
    this.fallbackEnabled = process.env.AI_FALLBACK_ENABLED !== 'false';
    
    if (this.aiEnabled && process.env.OPENAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        logger.info('AI Routing Service initialized with OpenAI');
      } catch (error) {
        logger.error('Failed to initialize OpenAI client', { error: error.message });
        this.aiEnabled = false;
      }
    } else {
      logger.info('AI Routing Service initialized without OpenAI (disabled or no API key)');
    }
  }

  /**
   * Route a request to appropriate microservice(s)
   * @param {Object} data - Request data
   * @param {Object} routing - Routing configuration
   * @returns {Promise<Object>} - Routing result
   */
  async routeRequest(data, routing = {}) {
    const startTime = Date.now();
    
    try {
      // Get all active services
      const services = await registryService.getAllServicesFull();
      const activeServices = services.filter(service => service.status === 'active');

      if (activeServices.length === 0) {
        throw new Error('No active services available for routing');
      }

      let routingResult;

      // Try AI routing first if enabled
      if (this.aiEnabled && this.openai) {
        try {
          routingResult = await this._aiRoute(data, activeServices, routing);
          logger.info('AI routing successful', {
            targetServices: routingResult.targetServices.map(s => s.serviceName),
            confidence: routingResult.targetServices[0]?.confidence,
            aiModel: process.env.AI_MODEL || 'gpt-4o-mini'
          });
        } catch (aiError) {
          logger.warn('AI routing failed, falling back to keyword matching', {
            error: aiError.message
          });
          
          if (this.fallbackEnabled) {
            routingResult = await this._fallbackRoute(data, activeServices, routing);
          } else {
            throw aiError;
          }
        }
      } else {
        // Use fallback routing
        routingResult = await this._fallbackRoute(data, activeServices, routing);
      }

      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        routing: {
          targetServices: routingResult.targetServices,
          strategy: routing.strategy || 'single',
          processingTime: `${processingTime}ms`,
          method: routingResult.method || 'fallback'
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Routing failed', {
        error: error.message,
        data: data.type,
        processingTime: `${processingTime}ms`
      });
      
      throw error;
    }
  }

  /**
   * AI-powered routing using OpenAI
   * @param {Object} data - Request data
   * @param {Array} services - Available services
   * @param {Object} routing - Routing configuration
   * @returns {Promise<Object>} - Routing result
   * @private
   */
  async _aiRoute(data, services, routing) {
    const prompt = this._buildRoutingPrompt(data, services, routing);
    
    const response = await this.openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a microservices router. Analyze requests and determine the best service(s) to handle them. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    const aiResponse = response.choices[0].message.content;
    return this._parseAIResponse(aiResponse, services);
  }

  /**
   * Build routing prompt for AI
   * @param {Object} data - Request data
   * @param {Array} services - Available services
   * @param {Object} routing - Routing configuration
   * @returns {string} - Formatted prompt
   * @private
   */
  _buildRoutingPrompt(data, services, routing) {
    logger.info('Building AI prompt', {
      servicesCount: services.length,
      dataType: typeof data,
      query: data
    });
    
    const serviceDescriptions = services.map(service => {
      const capabilities = service.metadata?.capabilities || [];
      const endpoints = service.migrationFile?.api?.endpoints || [];
      const events = service.migrationFile?.events || {};
      
      logger.info('Processing service for AI', {
        serviceName: service.serviceName,
        hasMetadata: !!service.metadata,
        hasMigrationFile: !!service.migrationFile,
        capabilitiesCount: capabilities.length,
        endpointsCount: endpoints.length
      });
      
      return `- ${service.serviceName} (v${service.version}):
  Endpoint: ${service.endpoint}
  Capabilities: ${capabilities.join(', ') || 'none specified'}
  API Endpoints: ${endpoints.map(ep => `${ep.method} ${ep.path}`).join(', ') || 'none'}
  Publishes Events: ${events.publishes?.join(', ') || 'none'}
  Subscribes to Events: ${events.subscribes?.join(', ') || 'none'}
  Description: ${service.description || 'No description'}`;
    }).join('\n');

    return `You are a microservices router. Analyze the following request and determine which service(s) should handle it.

Request Details:
- Type: ${data.type}
- Payload: ${JSON.stringify(data.payload, null, 2)}
- Context: ${JSON.stringify(data.context || {}, null, 2)}

Routing Strategy: ${routing.strategy || 'single'}
Priority: ${routing.priority || 'accuracy'}

Available Services:
${serviceDescriptions}

Instructions:
1. Analyze the request type, payload, and context
2. Match against service capabilities, endpoints, and events
3. Consider the routing strategy (single = one service, multiple = several services, broadcast = all relevant)
4. Provide confidence scores (0-1) based on how well each service matches
5. Include reasoning for your decisions

Respond with JSON in this exact format:
{
  "targetServices": [
    {
      "serviceName": "service-name",
      "endpoint": "full-endpoint-url",
      "confidence": 0.95,
      "reasoning": "Why this service was selected"
    }
  ],
  "strategy": "single|multiple|broadcast"
}

If no services match well, return an empty targetServices array with reasoning.`;
  }

  /**
   * Parse AI response into structured routing decision
   * @param {string} aiResponse - Raw AI response
   * @param {Array} services - Available services for validation
   * @returns {Object} - Parsed routing result
   * @private
   */
  _parseAIResponse(aiResponse, services) {
    try {
      logger.info('Parsing AI response', {
        responseLength: aiResponse.length,
        responsePreview: aiResponse.substring(0, 200)
      });
      
      // Clean the response (remove markdown code blocks if present)
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      logger.info('Cleaned AI response', {
        cleanedLength: cleanResponse.length,
        cleanedPreview: cleanResponse.substring(0, 200)
      });

      const parsed = JSON.parse(cleanResponse);
      
      // Validate response structure
      if (!parsed.targetServices || !Array.isArray(parsed.targetServices)) {
        throw new Error('Invalid AI response: targetServices must be an array');
      }

      // Validate and enrich target services
      const validatedServices = parsed.targetServices
        .map(target => {
          const service = services.find(s => s.serviceName === target.serviceName);
          if (!service) {
            logger.warn('AI suggested non-existent service', { serviceName: target.serviceName });
            return null;
          }

          return {
            serviceName: service.serviceName,
            endpoint: service.endpoint,
            confidence: Math.max(0, Math.min(1, target.confidence || 0.5)),
            reasoning: target.reasoning || 'AI recommendation'
          };
        })
        .filter(Boolean);

      return {
        targetServices: validatedServices,
        method: 'ai'
      };

    } catch (error) {
      logger.error('Failed to parse AI response', {
        error: error.message,
        response: aiResponse
      });
      throw new Error(`Invalid AI response format: ${error.message}`);
    }
  }

  /**
   * Fallback routing using keyword matching
   * @param {Object} data - Request data
   * @param {Array} services - Available services
   * @param {Object} routing - Routing configuration
   * @returns {Promise<Object>} - Routing result
   * @private
   */
  async _fallbackRoute(data, services, routing) {
    logger.info('Using fallback keyword-based routing');

    const matches = [];
    const requestText = JSON.stringify(data).toLowerCase();
    
    for (const service of services) {
      let score = 0;
      const reasons = [];

      // Check service name match
      if (requestText.includes(service.serviceName.toLowerCase())) {
        score += 0.8;
        reasons.push('service name match');
      }

      // Check capabilities match
      const capabilities = service.metadata?.capabilities || [];
      for (const capability of capabilities) {
        if (requestText.includes(capability.toLowerCase())) {
          score += 0.6;
          reasons.push(`capability match: ${capability}`);
        }
      }

      // Check API endpoints match
      const endpoints = service.migrationFile?.api?.endpoints || [];
      for (const endpoint of endpoints) {
        const pathParts = endpoint.path?.toLowerCase().split('/') || [];
        for (const part of pathParts) {
          if (part && requestText.includes(part)) {
            score += 0.4;
            reasons.push(`endpoint match: ${part}`);
          }
        }
      }

      // Check events match
      const events = service.migrationFile?.events || {};
      const allEvents = [...(events.publishes || []), ...(events.subscribes || [])];
      for (const event of allEvents) {
        if (requestText.includes(event.toLowerCase())) {
          score += 0.5;
          reasons.push(`event match: ${event}`);
        }
      }

      // Check data type match
      if (data.type && service.serviceName.toLowerCase().includes(data.type.toLowerCase())) {
        score += 0.7;
        reasons.push('data type match');
      }

      if (score > 0) {
        matches.push({
          serviceName: service.serviceName,
          endpoint: service.endpoint,
          confidence: Math.min(score, 1.0),
          reasoning: `Keyword matching: ${reasons.join(', ')}`
        });
      }
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    // Apply routing strategy
    let targetServices = [];
    const strategy = routing.strategy || 'single';

    switch (strategy) {
      case 'single':
        targetServices = matches.slice(0, 1);
        break;
      case 'multiple':
        targetServices = matches.slice(0, 3); // Top 3 matches
        break;
      case 'broadcast':
        targetServices = matches.filter(m => m.confidence > 0.3); // All decent matches
        break;
      default:
        targetServices = matches.slice(0, 1);
    }

    // If no matches found, return the first available service as last resort
    if (targetServices.length === 0 && services.length > 0) {
      targetServices = [{
        serviceName: services[0].serviceName,
        endpoint: services[0].endpoint,
        confidence: 0.1,
        reasoning: 'Default fallback - no specific matches found'
      }];
    }

    return {
      targetServices,
      method: 'fallback'
    };
  }

  /**
   * Get routing context for debugging
   * @returns {Promise<Object>} - Current routing context
   */
  async getRoutingContext() {
    const services = await registryService.getAllServicesFull();
    const activeServices = services.filter(service => service.status === 'active');

    return {
      aiEnabled: this.aiEnabled,
      fallbackEnabled: this.fallbackEnabled,
      totalServices: services.length,
      activeServices: activeServices.length,
      services: activeServices.map(service => ({
        serviceName: service.serviceName,
        capabilities: service.metadata?.capabilities || [],
        endpoints: service.migrationFile?.api?.endpoints?.length || 0,
        events: {
          publishes: service.migrationFile?.events?.publishes?.length || 0,
          subscribes: service.migrationFile?.events?.subscribes?.length || 0
        }
      }))
    };
  }
}

// Singleton instance
const aiRoutingService = new AIRoutingService();

module.exports = aiRoutingService;
