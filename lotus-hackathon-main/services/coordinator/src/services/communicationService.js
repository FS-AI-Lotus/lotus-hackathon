const logger = require('../utils/logger');
const envelopeService = require('./envelopeService');
const grpcClient = require('../grpc/client');
const metricsService = require('./metricsService');
const routingConfig = require('../config/routing');
const registryService = require('./registryService');

/**
 * Communication Service - Protocol abstraction layer
 * Supports both gRPC and HTTP calls to microservices
 */
class CommunicationService {
  constructor() {
    this.timeout = 30000; // 30 seconds timeout
    this.defaultProtocol = process.env.DEFAULT_PROTOCOL || 'http';
  }

  /**
   * Call multiple microservices using specified protocol
   * @param {Array} services - Array of target services from routing
   * @param {Object} requestData - Original request data
   * @param {string} protocol - 'grpc' or 'http'
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} - Array of service responses
   */
  async callMicroservices(services, requestData, protocol = 'http', options = {}) {
    const startTime = Date.now();
    
    try {
      logger.info('Calling microservices', {
        protocol,
        serviceCount: services.length,
        services: services.map(s => s.serviceName),
        timestamp: new Date().toISOString()
      });

      // Create Universal Envelope for the request
      const envelope = this.createEnvelopeForServices(requestData, options);
      
      // Call services based on protocol
      const results = [];
      
      for (const service of services) {
        try {
          let result;
          
          if (protocol === 'grpc') {
            result = await this.callServiceViaGrpc(service, envelope);
          } else {
            result = await this.callServiceViaHttp(service, envelope);
          }
          
          results.push({
            serviceName: service.serviceName,
            success: result.success,
            data: result.data || result.envelope,
            error: result.error,
            protocol: protocol,
            processingTime: result.processingTime
          });

        } catch (error) {
          logger.error('Failed to call individual service', {
            serviceName: service.serviceName,
            protocol,
            error: error.message
          });
          
          results.push({
            serviceName: service.serviceName,
            success: false,
            data: null,
            error: error.message,
            protocol: protocol,
            processingTime: '0ms'
          });
        }
      }

      const totalTime = Date.now() - startTime;
      
      logger.info('Microservice calls completed', {
        protocol,
        totalServices: services.length,
        successfulCalls: results.filter(r => r.success).length,
        failedCalls: results.filter(r => !r.success).length,
        totalTime: `${totalTime}ms`
      });

      return results;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      
      logger.error('Failed to call microservices', {
        error: error.message,
        protocol,
        serviceCount: services.length,
        totalTime: `${totalTime}ms`
      });
      
      throw error;
    }
  }

  /**
   * Call a single service via gRPC
   * @param {Object} service - Service information
   * @param {Object} envelope - Universal Envelope
   * @returns {Promise<Object>} - Service response
   */
  async callServiceViaGrpc(service, envelope) {
    const startTime = Date.now();
    
    try {
      logger.debug('Calling service via gRPC', {
        serviceName: service.serviceName,
        endpoint: service.endpoint
      });

      // Convert envelope to JSON string for gRPC transmission
      const envelopeJson = envelopeService.envelopeToJson(envelope);
      
      // Call service using gRPC client
      const result = await grpcClient.callMicroserviceViaGrpc(
        service.serviceName,
        service.endpoint,
        envelopeJson
      );

      const processingTime = Date.now() - startTime;

      // Record metrics
      if (metricsService.recordGrpcClientCall) {
        const status = result.success ? 'success' : 'error';
        metricsService.recordGrpcClientCall(service.serviceName, status, processingTime / 1000);
      }

      return {
        success: result.success,
        envelope: result.envelope,
        error: result.error,
        processingTime: `${processingTime}ms`,
        protocol: 'grpc'
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('gRPC service call failed', {
        serviceName: service.serviceName,
        error: error.message,
        processingTime: `${processingTime}ms`
      });

      // Record error metrics
      if (metricsService.recordGrpcClientCall) {
        metricsService.recordGrpcClientCall(service.serviceName, 'error', processingTime / 1000);
      }

      throw error;
    }
  }

  /**
   * Call a single service via HTTP
   * @param {Object} service - Service information
   * @param {Object} envelope - Universal Envelope
   * @returns {Promise<Object>} - Service response
   */
  async callServiceViaHttp(service, envelope) {
    const startTime = Date.now();
    
    try {
      logger.debug('Calling service via HTTP', {
        serviceName: service.serviceName,
        endpoint: service.endpoint
      });

      // Prepare HTTP request
      const targetUrl = `${service.endpoint}/api/process`; // Standard endpoint for envelope processing
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Coordinator-Service': 'coordinator',
          'X-Target-Service': service.serviceName,
          'X-Protocol': 'http',
          'X-Request-ID': envelope.request_id
        },
        body: JSON.stringify(envelope),
        signal: controller.signal
      };

      // Make HTTP request
      let response;
      try {
        response = await fetch(targetUrl, fetchOptions);
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error(`HTTP request timeout after ${this.timeout}ms`);
        }
        throw fetchError;
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      const processingTime = Date.now() - startTime;
      const success = response.ok;

      logger.debug('HTTP service call completed', {
        serviceName: service.serviceName,
        status: response.status,
        success,
        processingTime: `${processingTime}ms`
      });

      return {
        success: success,
        envelope: success ? responseData : null,
        error: success ? null : `HTTP ${response.status}: ${response.statusText}`,
        processingTime: `${processingTime}ms`,
        protocol: 'http'
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('HTTP service call failed', {
        serviceName: service.serviceName,
        error: error.message,
        processingTime: `${processingTime}ms`
      });

      throw error;
    }
  }

  /**
   * Create Universal Envelope for service calls
   * @param {Object} requestData - Original request data
   * @param {Object} options - Additional options
   * @returns {Object} - Universal Envelope
   */
  createEnvelopeForServices(requestData, options = {}) {
    // Determine if this is from gRPC or HTTP request
    const isGrpcRequest = options.protocol === 'grpc' || requestData.context?.protocol === 'grpc';
    
    if (isGrpcRequest) {
      // For gRPC requests, requestData should already be in envelope format or have the necessary fields
      return envelopeService.createEnvelope({
        tenantId: options.tenantId || requestData.tenant_id || 'default',
        userId: options.userId || requestData.user_id || 'anonymous',
        query: requestData.payload?.query || requestData.query_text || '',
        metadata: requestData.payload?.metadata || requestData.metadata || {},
        context: {
          ...requestData.payload?.context,
          ...requestData.context,
          protocol: 'grpc',
          source: 'rag'
        },
        requestId: options.requestId || requestData.request_id
      });
    } else {
      // For HTTP requests, use the existing HTTP envelope creation
      return envelopeService.createEnvelopeFromHttpRequest(requestData, options);
    }
  }

  /**
   * Determine best protocol for a service
   * @param {Object} service - Service information
   * @returns {string} - 'grpc' or 'http'
   */
  selectProtocolForService(service) {
    // Check if service supports gRPC (could be from registry metadata)
    if (service.supportsGrpc || service.grpcEndpoint) {
      return 'grpc';
    }
    
    // Check if service has gRPC port (convention: HTTP port + 51)
    if (service.endpoint && service.endpoint.includes(':')) {
      const port = service.endpoint.split(':')[1];
      if (port && (port.includes('505') || port.includes('506'))) {
        return 'grpc';
      }
    }
    
    // Default to HTTP
    return 'http';
  }

  /**
   * Get communication service status
   * @returns {Object} - Service status
   */
  getStatus() {
    return {
      defaultProtocol: this.defaultProtocol,
      timeout: this.timeout,
      grpcClientStatus: grpcClient.getStatus(),
      supportedProtocols: ['http', 'grpc']
    };
  }

  /**
   * Call services with cascading fallback - tries services in ranked order until finding quality response
   * @param {Array} rankedServices - Array of ranked services from AI routing (with serviceName, endpoint, confidence, reasoning)
   * @param {Object} requestData - Original request data
   * @param {string} protocol - 'grpc' or 'http'
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Cascade result with successfulResult, allAttempts, totalAttempts, stopped
   */
  async callWithCascadingFallback(rankedServices, requestData, protocol = 'http', options = {}) {
    const config = routingConfig.cascading;
    const startTime = Date.now();
    const allAttempts = [];
    let successfulResult = null;
    let stopped = 'exhausted_candidates';

    logger.info('Starting cascading fallback', {
      protocol,
      totalCandidates: rankedServices.length,
      maxAttempts: config.maxAttempts,
      minQualityScore: config.minQualityScore,
      stopOnFirst: config.stopOnFirst
    });

    // Limit attempts to maxAttempts
    const servicesToTry = rankedServices.slice(0, config.maxAttempts);

    // Create envelope once for all attempts
    const envelope = this.createEnvelopeForServices(requestData, options);

    for (let i = 0; i < servicesToTry.length; i++) {
      const service = servicesToTry[i];
      const rank = i + 1;
      const attemptStartTime = Date.now();

      // Determine actual protocol for this service (may be HTTP even if request is gRPC)
      const serviceProtocol = this.selectProtocolForService(service);
      const actualProtocol = serviceProtocol || protocol; // Use service-specific protocol if available, otherwise use requested protocol

      logger.info(`Trying rank ${rank}: ${service.serviceName} (confidence: ${service.confidence})`, {
        rank,
        serviceName: service.serviceName,
        confidence: service.confidence,
        endpoint: service.endpoint,
        protocol: actualProtocol
      });

      let attemptResult = {
        rank,
        serviceName: service.serviceName,
        confidence: service.confidence,
        reasoning: service.reasoning,
        success: false,
        quality: 0,
        duration: 0,
        error: null,
        rejectReason: null,
        data: null
      };

      try {
        // Call service with timeout
        let serviceResult;
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Service call timeout after ${config.attemptTimeout}ms`)), config.attemptTimeout);
        });

        const callPromise = (async () => {
          // Use service-specific protocol if determined, otherwise use requested protocol
          const actualProtocol = this.selectProtocolForService(service) || protocol;
          if (actualProtocol === 'grpc') {
            return await this.callServiceViaGrpc(service, envelope);
          } else {
            return await this.callServiceViaHttp(service, envelope);
          }
        })();

        serviceResult = await Promise.race([callPromise, timeoutPromise]);

        const duration = Date.now() - attemptStartTime;
        attemptResult.duration = duration;

        // Extract data from result
        // HTTP services return {success: true, data: {...}}, so extract the data field
        let data = serviceResult.envelope || serviceResult.data || null;
        
        // If data is wrapped in a 'data' field (common HTTP response format), unwrap it
        if (data && typeof data === 'object' && data.data && !data.envelope) {
          data = data.data;
        }

        // Assess quality
        const quality = data ? this._assessQuality(data) : 0;
        attemptResult.quality = quality;
        attemptResult.data = data;

        logger.info(`Response received - success: ${serviceResult.success}, quality: ${quality}`, {
          rank,
          serviceName: service.serviceName,
          success: serviceResult.success,
          quality: quality,
          duration: `${duration}ms`
        });

        // Check if response is good
        const isGood = this._isGoodResponse(serviceResult, config, data);

        if (isGood) {
          attemptResult.success = true;
          const actualProtocol = this.selectProtocolForService(service) || protocol;
          successfulResult = {
            serviceName: service.serviceName,
            rank,
            confidence: service.confidence,
            data: data,
            quality: quality,
            duration: duration,
            protocol: actualProtocol,
            reasoning: service.reasoning
          };

          logger.info(`Good response found! Stopping at rank ${rank}`, {
            rank,
            serviceName: service.serviceName,
            quality: quality,
            duration: `${duration}ms`
          });

          // Record metrics
          // First param: rank of service that succeeded
          // Second param: total attempts made (i + 1 because i is 0-based)
          if (metricsService.recordCascadingSuccess) {
            metricsService.recordCascadingSuccess(rank, i + 1);
          }

          stopped = 'found_good_response';

          // If stopOnFirst is true, break immediately
          if (config.stopOnFirst) {
            allAttempts.push(attemptResult);
            break;
          }
        } else {
          // Response not good enough
          const rejectReason = this._getRejectReason(serviceResult, config, data);
          attemptResult.rejectReason = rejectReason;

          logger.info(`Response not good enough - ${rejectReason}, trying next`, {
            rank,
            serviceName: service.serviceName,
            quality: quality,
            rejectReason: rejectReason
          });
        }

      } catch (error) {
        const duration = Date.now() - attemptStartTime;
        attemptResult.duration = duration;
        attemptResult.error = error.message;

        logger.warn(`Service call failed - ${error.message}, trying next`, {
          rank,
          serviceName: service.serviceName,
          error: error.message,
          duration: `${duration}ms`
        });
      }

      allAttempts.push(attemptResult);

      // If we found a good result and stopOnFirst is false, continue trying all
      // (This allows collecting metrics on all attempts)
    }

    const totalTime = Date.now() - startTime;

    logger.info('Cascade completed', {
      successful: !!successfulResult,
      successfulService: successfulResult?.serviceName || null,
      successfulRank: successfulResult?.rank || null,
      totalAttempts: allAttempts.length,
      stopped: stopped,
      totalTime: `${totalTime}ms`
    });

    return {
      successfulResult,
      allAttempts,
      totalAttempts: allAttempts.length,
      stopped,
      totalTime: `${totalTime}ms`
    };
  }

  /**
   * Check if response is good enough based on quality criteria
   * @param {Object} result - Service call result
   * @param {Object} config - Cascading configuration
   * @param {Object} data - Response data (optional, extracted from result if not provided)
   * @returns {boolean} - True if response is good
   * @private
   */
  _isGoodResponse(result, config, data = null) {
    // Extract data if not provided
    if (!data) {
      data = result.envelope || result.data || null;
    }

    // Check 1: result.success === true
    if (result.success !== true) {
      return false;
    }

    // Check 2: result.data exists (not null/undefined)
    if (!data) {
      return false;
    }

    // Check 3: result.data is an object
    if (typeof data !== 'object' || Array.isArray(data)) {
      return false;
    }

    // Check 4: Has minimum keys
    const keys = Object.keys(data);
    if (keys.length < config.qualityCriteria.minKeys) {
      return false;
    }

    // Check 5: Has relevant data (not ONLY metadata)
    if (config.qualityCriteria.requireRelevant && !this._hasRelevantData(data)) {
      return false;
    }

    // Check 6: Is NOT empty (no empty arrays)
    if (config.qualityCriteria.rejectEmpty && this._isEmptyResponse(data)) {
      return false;
    }

    // Check 7: Quality score >= minQualityScore
    const quality = this._assessQuality(data);
    if (quality < config.minQualityScore) {
      return false;
    }

    return true;
  }

  /**
   * Assess quality score based on number of keys
   * @param {Object} data - Response data
   * @returns {number} - Quality score (0-1)
   * @private
   */
  _assessQuality(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return 0.0;
    }

    const keys = Object.keys(data);
    const keyCount = keys.length;

    if (keyCount === 0) {
      return 0.0;
    } else if (keyCount < 3) {
      return 0.3;
    } else if (keyCount < 10) {
      return 0.7;
    } else {
      return 1.0;
    }
  }

  /**
   * Check if data has relevant fields (not only metadata)
   * @param {Object} data - Response data
   * @returns {boolean} - True if has relevant data
   * @private
   */
  _hasRelevantData(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return false;
    }

    const metadataKeys = ['timestamp', 'status', 'message', 'success', 'error'];
    const keys = Object.keys(data);
    const relevantKeys = keys.filter(key => !metadataKeys.includes(key.toLowerCase()));

    return relevantKeys.length > 0;
  }

  /**
   * Check if response is empty (has empty arrays)
   * @param {Object} data - Response data
   * @returns {boolean} - True if empty
   * @private
   */
  _isEmptyResponse(data) {
    if (!data || typeof data !== 'object') {
      return true;
    }

    // Check for empty arrays
    if (Array.isArray(data) && data.length === 0) {
      return true;
    }

    // Check common empty array fields
    if (data.results && Array.isArray(data.results) && data.results.length === 0) {
      return true;
    }

    if (data.items && Array.isArray(data.items) && data.items.length === 0) {
      return true;
    }

    if (data.data && Array.isArray(data.data) && data.data.length === 0) {
      return true;
    }

    return false;
  }

  /**
   * Get reason why response was rejected
   * @param {Object} result - Service call result
   * @param {Object} config - Cascading configuration
   * @param {Object} data - Response data (optional)
   * @returns {string} - Rejection reason
   * @private
   */
  _getRejectReason(result, config, data = null) {
    // Extract data if not provided
    if (!data) {
      data = result.envelope || result.data || null;
    }

    // Check service error
    if (result.success !== true) {
      return 'service_error';
    }

    // Check no data
    if (!data) {
      return 'no_data';
    }

    // Check empty data
    if (typeof data !== 'object' || Array.isArray(data)) {
      return 'empty_data';
    }

    const keys = Object.keys(data);
    if (keys.length === 0) {
      return 'empty_data';
    }

    // Check empty results
    if (this._isEmptyResponse(data)) {
      return 'empty_results';
    }

    // Check only metadata
    if (config.qualityCriteria.requireRelevant && !this._hasRelevantData(data)) {
      return 'only_metadata';
    }

    // Check quality too low
    const quality = this._assessQuality(data);
    if (quality < config.minQualityScore) {
      return 'quality_too_low';
    }

    // Should not reach here if _isGoodResponse is called first
    return 'unknown';
  }

  /**
   * Health check for all protocols
   * @param {Object} service - Service to check
   * @returns {Promise<Object>} - Health status for both protocols
   */
  async healthCheckService(service) {
    const results = {
      serviceName: service.serviceName,
      http: false,
      grpc: false
    };

    // Test HTTP
    try {
      const testEnvelope = envelopeService.createEnvelope({
        tenantId: 'health-check',
        userId: 'coordinator',
        query: 'health-check',
        metadata: { type: 'health' },
        context: { purpose: 'connectivity-test' }
      });
      
      const httpResult = await this.callServiceViaHttp(service, testEnvelope);
      results.http = httpResult.success;
    } catch (error) {
      logger.debug('HTTP health check failed', {
        serviceName: service.serviceName,
        error: error.message
      });
    }

    // Test gRPC
    try {
      results.grpc = await grpcClient.healthCheck(service.serviceName, service.endpoint);
    } catch (error) {
      logger.debug('gRPC health check failed', {
        serviceName: service.serviceName,
        error: error.message
      });
    }

    return results;
  }
}

// Singleton instance
const communicationService = new CommunicationService();

module.exports = communicationService;
