const logger = require('../utils/logger');
const envelopeService = require('./envelopeService');
const grpcClient = require('../grpc/client');
const metricsService = require('./metricsService');

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
