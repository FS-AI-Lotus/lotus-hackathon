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
      
      if (!routingResult.success || !routingResult.routing.rankedServices || routingResult.routing.rankedServices.length === 0) {
        const error = new Error('AI routing failed to find suitable services');
        logger.error('gRPC AI routing failed', {
          requestId: envelope.request_id,
          error: error.message
        });
        
        return callback(error);
      }

      // Step 4: Get ranked services for cascading
      const rankedServices = routingResult.routing.rankedServices;
      
      logger.info('gRPC routing completed', {
        requestId: envelope.request_id,
        totalCandidates: routingResult.routing.totalCandidates,
        primaryTarget: routingResult.routing.primaryTarget?.serviceName,
        primaryConfidence: routingResult.routing.primaryTarget?.confidence,
        method: routingResult.routing.method
      });

      // Step 5: Call services with cascading fallback via gRPC
      logger.debug('Calling microservices with cascading fallback via gRPC', {
        requestId: envelope.request_id,
        candidateCount: rankedServices.length,
        protocol: 'grpc'
      });

      const cascadeResult = await communicationService.callWithCascadingFallback(
        rankedServices,
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

      logger.info('Cascading routing completed', {
        requestId: envelope.request_id,
        successful_service: cascadeResult.successfulResult?.serviceName,
        rank_used: cascadeResult.successfulResult?.rank,
        total_attempts: cascadeResult.totalAttempts,
        stopped_reason: cascadeResult.stopped,
        total_duration: cascadeResult.totalTime
      });
      
      // Step 6: Build gRPC RouteResponse with cascade metadata
      const processingTime = Date.now() - startTime;
      
      // Extract base normalized fields and add cascade information
      const baseNormalizedFields = envelopeService.extractNormalizedFields(envelope);
      const normalizedFields = {
        ...baseNormalizedFields,
        // Cascade information
        successful_service: cascadeResult.successfulResult?.serviceName || 'none',
        rank_used: cascadeResult.successfulResult?.rank?.toString() || '0',
        total_attempts: cascadeResult.totalAttempts.toString(),
        // AI ranking information
        primary_target: routingResult.routing.primaryTarget?.serviceName || 'none',
        primary_confidence: routingResult.routing.primaryTarget?.confidence?.toString() || '0',
        // Execution information
        stopped_reason: cascadeResult.stopped,
        quality_score: cascadeResult.successfulResult?.quality?.toString() || '0',
        total_time: cascadeResult.totalTime,
        processing_time: `${processingTime}ms`
      };

      // Build envelope_json with full cascade details
      const envelopeJson = JSON.stringify({
        request: {
          tenant_id: request.tenant_id,
          user_id: request.user_id,
          query_text: request.query_text
        },
        aiRanking: routingResult.routing.rankedServices.map(s => ({
          serviceName: s.serviceName,
          endpoint: s.endpoint,
          confidence: s.confidence,
          reasoning: s.reasoning
        })),
        cascadeAttempts: cascadeResult.allAttempts.map(a => ({
          rank: a.rank,
          serviceName: a.serviceName,
          confidence: a.confidence,
          success: a.success,
          quality: a.quality,
          duration: a.duration,
          error: a.error,
          rejectReason: a.rejectReason
        })),
        successfulResult: cascadeResult.successfulResult ? {
          serviceName: cascadeResult.successfulResult.serviceName,
          rank: cascadeResult.successfulResult.rank,
          confidence: cascadeResult.successfulResult.confidence,
          quality: cascadeResult.successfulResult.quality,
          duration: cascadeResult.successfulResult.duration,
          protocol: cascadeResult.successfulResult.protocol,
          reasoning: cascadeResult.successfulResult.reasoning,
          data: cascadeResult.successfulResult.data
        } : null,
        metadata: {
          total_attempts: cascadeResult.totalAttempts,
          stopped_reason: cascadeResult.stopped,
          total_time: cascadeResult.totalTime,
          processing_time: `${processingTime}ms`
        },
        original_envelope: envelope
      }, null, 2);

      // Build routing_metadata with cascade execution details
      const routingMetadata = JSON.stringify({
        routing_strategy: 'cascading_fallback',
        ai_ranking: routingResult.routing.rankedServices.map(s => ({
          name: s.serviceName,
          confidence: s.confidence,
          reasoning: s.reasoning
        })),
        execution: {
          total_attempts: cascadeResult.totalAttempts,
          successful_rank: cascadeResult.successfulResult?.rank || null,
          stopped_reason: cascadeResult.stopped,
          successful_service: cascadeResult.successfulResult?.serviceName || null
        },
        performance: {
          cascade_time: cascadeResult.totalTime,
          total_duration_ms: processingTime
        },
        all_attempts: cascadeResult.allAttempts.map(a => ({
          rank: a.rank,
          service: a.serviceName,
          success: a.success,
          quality: a.quality,
          duration: a.duration,
          reject_reason: a.rejectReason,
          error: a.error
        })),
        ai_routing: {
          method: routingResult.routing.method,
          processingTime: routingResult.routing.processingTime,
          strategy: routingConfig.strategy,
          totalCandidates: routingResult.routing.totalCandidates
        }
      }, null, 2);

      // Build response
      const response = {
        target_services: cascadeResult.allAttempts.map(a => a.serviceName),
        normalized_fields: normalizedFields,
        envelope_json: envelopeJson,
        routing_metadata: routingMetadata
      };

      // Step 7: Record metrics
      if (metricsService.recordGrpcRequest) {
        metricsService.recordGrpcRequest('Route', 'success', processingTime / 1000);
      }

      logger.info('gRPC Route response sent', {
        requestId: envelope.request_id,
        targetServiceCount: cascadeResult.allAttempts.length,
        successfulService: cascadeResult.successfulResult?.serviceName,
        successfulRank: cascadeResult.successfulResult?.rank,
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
