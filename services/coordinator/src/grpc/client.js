const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const logger = require('../utils/logger');

/**
 * gRPC Client - Calls microservices via gRPC
 * Implements calls to microservices using the generic MicroserviceAPI
 */
class GrpcClient {
  constructor() {
    this.clients = new Map(); // Cache gRPC clients
    this.protoPath = path.join(__dirname, 'proto', 'microservice.proto');
    this.timeout = 30000; // 30 seconds timeout
    this.proto = null;
    
    this.loadProto();
  }

  /**
   * Load microservice proto definition
   */
  loadProto() {
    try {
      const packageDefinition = protoLoader.loadSync(this.protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      this.proto = grpc.loadPackageDefinition(packageDefinition).microservice.v1;

      if (!this.proto || !this.proto.MicroserviceAPI) {
        throw new Error('Failed to load MicroserviceAPI from proto definition');
      }

      logger.info('gRPC client proto loaded successfully', {
        protoPath: this.protoPath,
        service: 'microservice.v1.MicroserviceAPI'
      });

    } catch (error) {
      logger.error('Failed to load gRPC client proto', {
        error: error.message,
        protoPath: this.protoPath
      });
      throw error;
    }
  }

  /**
   * Create or get cached gRPC client for a microservice
   * @param {string} serviceName - Name of the microservice
   * @param {string} endpoint - gRPC endpoint (e.g., "service:5051")
   * @returns {Object} - gRPC client instance
   */
  createMicroserviceClient(serviceName, endpoint) {
    const clientKey = `${serviceName}:${endpoint}`;
    
    // Return cached client if exists
    if (this.clients.has(clientKey)) {
      logger.debug('Using cached gRPC client', { serviceName, endpoint });
      return this.clients.get(clientKey);
    }

    try {
      // Ensure endpoint has gRPC port (convert HTTP port to gRPC port if needed)
      let grpcEndpoint = endpoint;
      if (endpoint.includes(':')) {
        const [host, port] = endpoint.split(':');
        // Convert HTTP port to gRPC port (add 1000 to HTTP port as convention)
        // e.g., service:5000 -> service:5051 (or use explicit gRPC port if provided)
        if (!endpoint.includes('505')) { // If not already a gRPC port
          const httpPort = parseInt(port);
          const grpcPort = httpPort + 51; // 5000 -> 5051, 4000 -> 4051
          grpcEndpoint = `${host}:${grpcPort}`;
        }
      }

      // Create new gRPC client
      const client = new this.proto.MicroserviceAPI(
        grpcEndpoint,
        grpc.credentials.createInsecure(),
        {
          'grpc.keepalive_time_ms': 30000,
          'grpc.keepalive_timeout_ms': 5000,
          'grpc.keepalive_permit_without_calls': true,
          'grpc.http2.max_pings_without_data': 0,
          'grpc.http2.min_time_between_pings_ms': 10000,
          'grpc.http2.min_ping_interval_without_data_ms': 300000
        }
      );

      // Cache the client
      this.clients.set(clientKey, client);

      logger.info('Created new gRPC client', {
        serviceName,
        originalEndpoint: endpoint,
        grpcEndpoint,
        clientKey
      });

      return client;

    } catch (error) {
      logger.error('Failed to create gRPC client', {
        error: error.message,
        serviceName,
        endpoint
      });
      throw error;
    }
  }

  /**
   * Call microservice via gRPC
   * @param {string} serviceName - Name of the microservice
   * @param {string} endpoint - Service endpoint
   * @param {string} envelopeJson - Universal Envelope as JSON string
   * @returns {Promise<Object>} - Response from microservice
   */
  async callMicroserviceViaGrpc(serviceName, endpoint, envelopeJson) {
    const startTime = Date.now();
    
    try {
      logger.info('Calling microservice via gRPC', {
        serviceName,
        endpoint,
        envelopeSize: envelopeJson.length,
        timestamp: new Date().toISOString()
      });

      // Get or create gRPC client
      const client = this.createMicroserviceClient(serviceName, endpoint);

      // Prepare request
      const request = {
        envelope_json: envelopeJson
      };

      // Call Process RPC with timeout
      const response = await new Promise((resolve, reject) => {
        const deadline = new Date(Date.now() + this.timeout);
        
        client.Process(request, { deadline }, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      const processingTime = Date.now() - startTime;

      logger.info('gRPC call to microservice completed', {
        serviceName,
        success: response.success,
        processingTime: `${processingTime}ms`,
        responseSize: response.envelope_json?.length || 0,
        hasError: !!response.error
      });

      // Parse response envelope
      let responseEnvelope = null;
      if (response.envelope_json) {
        try {
          responseEnvelope = JSON.parse(response.envelope_json);
        } catch (parseError) {
          logger.warn('Failed to parse response envelope JSON', {
            serviceName,
            error: parseError.message,
            responseJson: response.envelope_json
          });
        }
      }

      return {
        success: response.success,
        error: response.error || null,
        envelope: responseEnvelope,
        rawResponse: response,
        processingTime: `${processingTime}ms`,
        protocol: 'grpc'
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('gRPC call to microservice failed', {
        error: error.message,
        serviceName,
        endpoint,
        processingTime: `${processingTime}ms`,
        grpcCode: error.code,
        grpcDetails: error.details
      });

      // Return error in consistent format
      return {
        success: false,
        error: `gRPC call failed: ${error.message}`,
        envelope: null,
        rawResponse: null,
        processingTime: `${processingTime}ms`,
        protocol: 'grpc',
        grpcError: {
          code: error.code,
          details: error.details
        }
      };
    }
  }

  /**
   * Close all cached gRPC clients (for shutdown)
   */
  closeMicroserviceClients() {
    logger.info('Closing all gRPC clients', {
      clientCount: this.clients.size
    });

    for (const [clientKey, client] of this.clients.entries()) {
      try {
        client.close();
        logger.debug('Closed gRPC client', { clientKey });
      } catch (error) {
        logger.warn('Error closing gRPC client', {
          clientKey,
          error: error.message
        });
      }
    }

    this.clients.clear();
    logger.info('All gRPC clients closed');
  }

  /**
   * Get client status for debugging
   * @returns {Object} - Client status information
   */
  getStatus() {
    return {
      protoLoaded: !!this.proto,
      clientCount: this.clients.size,
      clients: Array.from(this.clients.keys()),
      timeout: this.timeout,
      protoPath: this.protoPath
    };
  }

  /**
   * Health check for a specific microservice
   * @param {string} serviceName - Service name
   * @param {string} endpoint - Service endpoint
   * @returns {Promise<boolean>} - True if service is reachable
   */
  async healthCheck(serviceName, endpoint) {
    try {
      // Create a simple envelope for health check
      const healthEnvelope = JSON.stringify({
        version: '1.0',
        timestamp: new Date().toISOString(),
        request_id: 'health-check',
        tenant_id: 'system',
        user_id: 'coordinator',
        source: 'coordinator',
        payload: {
          query: 'health-check',
          metadata: { type: 'health' },
          context: { purpose: 'connectivity-test' }
        }
      });

      const result = await this.callMicroserviceViaGrpc(serviceName, endpoint, healthEnvelope);
      return result.success;

    } catch (error) {
      logger.debug('gRPC health check failed', {
        serviceName,
        endpoint,
        error: error.message
      });
      return false;
    }
  }
}

// Singleton instance
const grpcClient = new GrpcClient();

module.exports = {
  createMicroserviceClient: grpcClient.createMicroserviceClient.bind(grpcClient),
  callMicroserviceViaGrpc: grpcClient.callMicroserviceViaGrpc.bind(grpcClient),
  closeMicroserviceClients: grpcClient.closeMicroserviceClients.bind(grpcClient),
  healthCheck: grpcClient.healthCheck.bind(grpcClient),
  getStatus: grpcClient.getStatus.bind(grpcClient),
  GrpcClient
};
