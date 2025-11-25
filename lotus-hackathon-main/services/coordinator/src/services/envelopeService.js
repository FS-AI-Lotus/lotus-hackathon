const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Universal Envelope Service
 * Creates standardized envelopes for both gRPC and HTTP communication paths
 */
class EnvelopeService {
  constructor() {
    this.version = '1.0';
    this.source = 'coordinator';
  }

  /**
   * Create Universal Envelope for outgoing requests to microservices
   * @param {Object} options - Envelope options
   * @param {string} options.tenantId - Tenant identifier
   * @param {string} options.userId - User identifier
   * @param {string} options.query - Query text from request
   * @param {Object} options.metadata - Additional metadata
   * @param {Object} options.context - Request context
   * @param {string} options.requestId - Optional request ID (generates if not provided)
   * @returns {Object} - Universal Envelope
   */
  createEnvelope({ tenantId, userId, query, metadata = {}, context = {}, requestId = null }) {
    const envelope = {
      version: this.version,
      timestamp: new Date().toISOString(),
      request_id: requestId || uuidv4(),
      tenant_id: tenantId || 'default',
      user_id: userId || 'anonymous',
      source: this.source,
      payload: {
        query: query || '',
        metadata: metadata,
        context: context
      }
    };

    logger.debug('Created Universal Envelope', {
      requestId: envelope.request_id,
      tenantId: envelope.tenant_id,
      userId: envelope.user_id,
      hasQuery: !!envelope.payload.query,
      metadataKeys: Object.keys(envelope.payload.metadata),
      contextKeys: Object.keys(envelope.payload.context)
    });

    return envelope;
  }

  /**
   * Create envelope from gRPC RouteRequest
   * @param {Object} grpcRequest - gRPC RouteRequest message
   * @returns {Object} - Universal Envelope
   */
  createEnvelopeFromGrpcRequest(grpcRequest) {
    return this.createEnvelope({
      tenantId: grpcRequest.tenant_id,
      userId: grpcRequest.user_id,
      query: grpcRequest.query_text,
      metadata: grpcRequest.metadata || {},
      context: {
        source: 'rag',
        protocol: 'grpc',
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create envelope from HTTP request data
   * @param {Object} httpData - HTTP request data
   * @param {Object} options - Additional options
   * @returns {Object} - Universal Envelope
   */
  createEnvelopeFromHttpRequest(httpData, options = {}) {
    // Extract query from different possible locations
    let query = '';
    if (httpData.payload?.query_text) {
      query = httpData.payload.query_text;
    } else if (httpData.payload?.query) {
      query = httpData.payload.query;
    } else if (typeof httpData.payload === 'string') {
      query = httpData.payload;
    }

    return this.createEnvelope({
      tenantId: options.tenantId || httpData.tenant_id || 'default',
      userId: options.userId || httpData.user_id || 'anonymous',
      query: query,
      metadata: httpData.metadata || {},
      context: {
        source: 'http',
        protocol: 'http',
        timestamp: new Date().toISOString(),
        originalData: httpData
      }
    });
  }

  /**
   * Convert envelope to JSON string for proto transmission
   * @param {Object} envelope - Universal Envelope
   * @returns {string} - JSON string
   */
  envelopeToJson(envelope) {
    try {
      return JSON.stringify(envelope);
    } catch (error) {
      logger.error('Failed to serialize envelope to JSON', {
        error: error.message,
        envelope: envelope
      });
      throw new Error(`Envelope serialization failed: ${error.message}`);
    }
  }

  /**
   * Parse envelope from JSON string (from proto)
   * @param {string} envelopeJson - JSON string
   * @returns {Object} - Universal Envelope
   */
  envelopeFromJson(envelopeJson) {
    try {
      const envelope = JSON.parse(envelopeJson);
      
      // Validate envelope structure
      if (!this.validateEnvelope(envelope)) {
        throw new Error('Invalid envelope structure');
      }
      
      return envelope;
    } catch (error) {
      logger.error('Failed to parse envelope from JSON', {
        error: error.message,
        json: envelopeJson
      });
      throw new Error(`Envelope parsing failed: ${error.message}`);
    }
  }

  /**
   * Validate envelope structure
   * @param {Object} envelope - Envelope to validate
   * @returns {boolean} - True if valid
   */
  validateEnvelope(envelope) {
    const requiredFields = ['version', 'timestamp', 'request_id', 'tenant_id', 'user_id', 'source', 'payload'];
    
    for (const field of requiredFields) {
      if (!envelope.hasOwnProperty(field)) {
        logger.warn('Envelope missing required field', { field, envelope });
        return false;
      }
    }

    // Validate payload structure
    if (!envelope.payload || typeof envelope.payload !== 'object') {
      logger.warn('Envelope payload is invalid', { payload: envelope.payload });
      return false;
    }

    return true;
  }

  /**
   * Extract normalized fields from envelope for gRPC response
   * @param {Object} envelope - Universal Envelope
   * @returns {Object} - Normalized fields map
   */
  extractNormalizedFields(envelope) {
    return {
      version: envelope.version,
      timestamp: envelope.timestamp,
      request_id: envelope.request_id,
      tenant_id: envelope.tenant_id,
      user_id: envelope.user_id,
      source: envelope.source,
      query: envelope.payload.query || '',
      metadata_count: Object.keys(envelope.payload.metadata || {}).length.toString(),
      context_count: Object.keys(envelope.payload.context || {}).length.toString()
    };
  }

  /**
   * Create routing metadata for gRPC response
   * @param {Array} targetServices - Target services from routing
   * @param {Object} routingInfo - Additional routing information
   * @returns {string} - Routing metadata as JSON string
   */
  createRoutingMetadata(targetServices, routingInfo = {}) {
    const metadata = {
      routing_timestamp: new Date().toISOString(),
      target_service_count: targetServices.length,
      routing_method: routingInfo.method || 'unknown',
      processing_time: routingInfo.processingTime || '0ms',
      strategy: routingInfo.strategy || 'single',
      confidence: targetServices[0]?.confidence || 0,
      coordinator_version: this.version
    };

    return JSON.stringify(metadata);
  }
}

// Singleton instance
const envelopeService = new EnvelopeService();

module.exports = envelopeService;
