const logger = require('../../utils/logger');
const aiRoutingService = require('../../services/aiRoutingService');
const registryService = require('../../services/registryService');
const envelopeService = require('../../services/envelopeService');
const communicationService = require('../../services/communicationService');
const metricsService = require('../../services/metricsService');

/**
 * Coordinator gRPC Service Handler
 * Handles Route RPC calls from RAG
 */
class CoordinatorServiceHandler {
  constructor() {
    this.serviceName = 'CoordinatorService';
  }

  /**
   * Handle Route RPC from RAG
   * @param {Object} call - gRPC call object with request
   * @param {Function} callback - gRPC callback function
   */
  async handleRoute(call, callback) {
    const startTime = Date.now();
    const request = call.request;

    try {
      logger.info('gRPC Route request received from RAG', {
        tenantId: request.tenant_id,
        userId: request.user_id,
        queryText: request.query_text,
        metadataKeys: Object.keys(request.metadata || {}),
        timestamp: new Date().toISOString()
      });

      // Step 1: Create Universal Envelope from gRPC request
      const envelope = envelopeService.createEnvelopeFromGrpcRequest(request);
      
      logger.debug('Created envelope for gRPC request', {
        requestId: envelope.request_id,
        tenantId: envelope.tenant_id,
        query: envelope.payload.query
      });

      // Step 2: Get active services from registry
      const services = await registryService.getAllServicesFull();
      const activeServices = services.filter(service => service.status === 'active');

      if (activeServices.length === 0) {
        const error = new Error('No active services available for routing');
        logger.error('gRPC routing failed - no active services', {
          requestId: envelope.request_id
        });
        
        return callback(error);
      }

      // Step 3: Use existing AI routing logic (same as HTTP path!)
      const routingData = {
        type: 'grpc_query',
        payload: envelope.payload,
        context: {
          protocol: 'grpc',
          source: 'rag',
          tenantId: request.tenant_id,
          userId: request.user_id
        }
      };

      const routingConfig = {
        strategy: 'single', // RAG typically wants single service
        priority: 'accuracy'
      };

      logger.debug('Performing AI routing for gRPC request', {
        requestId: envelope.request_id,
        activeServiceCount: activeServices.length,
        strategy: routingConfig.strategy
      });

      const routingResult = await aiRoutingService.routeRequest(routingData, routingConfig);
      
      if (!routingResult.success || !routingResult.routing.targetServices.length) {
        const error = new Error('AI routing failed to find suitable services');
        logger.error('gRPC AI routing failed', {
          requestId: envelope.request_id,
          error: error.message
        });
        
        return callback(error);
      }

      // Step 4: Get target service details
      const targetServices = routingResult.routing.targetServices;
      const serviceNames = targetServices.map(service => service.serviceName);
      
      logger.info('gRPC routing completed', {
        requestId: envelope.request_id,
        targetServices: serviceNames,
        confidence: targetServices[0]?.confidence,
        method: routingResult.routing.method
      });

      // Step 5: Call target services via gRPC using communicationService
      logger.debug('Calling microservices via gRPC', {
        requestId: envelope.request_id,
        serviceCount: targetServices.length,
        protocol: 'grpc'
      });

      const serviceCallResults = await communicationService.callMicroservices(
        targetServices,
        {
          tenant_id: request.tenant_id,
          user_id: request.user_id,
          query_text: request.query_text,
          metadata: request.metadata,
          context: { protocol: 'grpc', source: 'rag' },
          request_id: envelope.request_id
        },
        'grpc', // ← CRITICAL: Use gRPC protocol for RAG path
        {
          tenantId: request.tenant_id,
          userId: request.user_id,
          requestId: envelope.request_id,
          protocol: 'grpc'
        }
      );

      logger.info('Microservice calls completed via gRPC', {
        requestId: envelope.request_id,
        successfulCalls: serviceCallResults.filter(r => r.success).length,
        failedCalls: serviceCallResults.filter(r => !r.success).length
      });
      
      // Step 6: Build gRPC RouteResponse
      const response = {
        target_services: serviceNames,
        normalized_fields: envelopeService.extractNormalizedFields(envelope),
        envelope_json: envelopeService.envelopeToJson(envelope),
        routing_metadata: envelopeService.createRoutingMetadata(targetServices, {
          method: routingResult.routing.method,
          processingTime: routingResult.routing.processingTime,
          strategy: routingConfig.strategy
        })
      };

      const processingTime = Date.now() - startTime;

      // Step 7: Record metrics
      if (metricsService.recordGrpcRequest) {
        metricsService.recordGrpcRequest('Route', 'success', processingTime / 1000);
      }

      logger.info('gRPC Route response sent', {
        requestId: envelope.request_id,
        targetServiceCount: serviceNames.length,
        processingTime: `${processingTime}ms`,
        envelopeSize: response.envelope_json.length
      });

      // Step 8: Send successful response
      callback(null, response);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('gRPC Route handler failed', {
        error: error.message,
        stack: error.stack,
        tenantId: request?.tenant_id,
        userId: request?.user_id,
        processingTime: `${processingTime}ms`
      });

      // Record error metrics
      if (metricsService.recordGrpcRequest) {
        metricsService.recordGrpcRequest('Route', 'error', processingTime / 1000);
      }

      // Send error response
      const grpcError = {
        code: grpc.status.INTERNAL,
        message: `Route processing failed: ${error.message}`,
        details: error.stack
      };

      callback(grpcError);
    }
  }

  /**
   * Get service status for debugging
   * @returns {Object} - Service status
   */
  getStatus() {
    return {
      serviceName: this.serviceName,
      methods: ['Route'],
      protocol: 'gRPC',
      package: 'rag.v1'
    };
  }
}

// Import grpc for status codes
const grpc = require('@grpc/grpc-js');

// Singleton instance
const coordinatorServiceHandler = new CoordinatorServiceHandler();

module.exports = coordinatorServiceHandler;
