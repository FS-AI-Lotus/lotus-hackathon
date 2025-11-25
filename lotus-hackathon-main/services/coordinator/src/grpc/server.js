const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const logger = require('../utils/logger');
const coordinatorService = require('./services/coordinator.service');

/**
 * gRPC Server - Receives requests from RAG
 * Implements the CoordinatorService defined in coordinator.proto
 */
class GrpcServer {
  constructor() {
    this.server = null;
    this.port = process.env.GRPC_PORT || 50051;
    this.protoPath = path.join(__dirname, 'proto', 'coordinator.proto');
  }

  /**
   * Load proto definition and create gRPC server
   * @returns {Object} - gRPC server instance
   */
  createServer() {
    try {
      // Load proto definition
      const packageDefinition = protoLoader.loadSync(this.protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      // Load the rag.v1 package (CRITICAL: must match RAG expectations)
      const proto = grpc.loadPackageDefinition(packageDefinition).rag.v1;

      if (!proto || !proto.CoordinatorService) {
        throw new Error('Failed to load CoordinatorService from proto definition');
      }

      // Create gRPC server
      this.server = new grpc.Server();

      // Register CoordinatorService with Route RPC handler
      this.server.addService(proto.CoordinatorService.service, {
        Route: coordinatorService.handleRoute.bind(coordinatorService)
      });

      logger.info('gRPC server created successfully', {
        protoPath: this.protoPath,
        port: this.port,
        service: 'rag.v1.CoordinatorService'
      });

      return this.server;

    } catch (error) {
      logger.error('Failed to create gRPC server', {
        error: error.message,
        stack: error.stack,
        protoPath: this.protoPath
      });
      throw error;
    }
  }

  /**
   * Start the gRPC server
   * @returns {Object} - Server instance for shutdown
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        if (!this.server) {
          this.createServer();
        }

        // Bind server to port
        const bindAddress = `0.0.0.0:${this.port}`;
        this.server.bindAsync(
          bindAddress,
          grpc.ServerCredentials.createInsecure(),
          (error, port) => {
            if (error) {
              logger.error('Failed to bind gRPC server', {
                error: error.message,
                bindAddress,
                port: this.port
              });
              reject(error);
              return;
            }

            // Start the server
            this.server.start();
            
            logger.info('gRPC server started successfully', {
              port: port,
              address: bindAddress,
              service: 'CoordinatorService',
              methods: ['Route']
            });
            
            resolve(this.server);
          }
        );
      } catch (error) {
        logger.error('Failed to start gRPC server', {
          error: error.message,
          port: this.port
        });
        reject(error);
      }
    });
  }

  /**
   * Graceful shutdown of gRPC server
   * @returns {Promise<void>}
   */
  async shutdown() {
    return new Promise((resolve) => {
      if (!this.server) {
        logger.info('gRPC server not running, nothing to shutdown');
        resolve();
        return;
      }

      logger.info('Shutting down gRPC server...');
      
      this.server.tryShutdown((error) => {
        if (error) {
          logger.error('Error during gRPC server shutdown', {
            error: error.message
          });
          // Force shutdown if graceful shutdown fails
          this.server.forceShutdown();
        } else {
          logger.info('gRPC server shutdown completed');
        }
        resolve();
      });
    });
  }

  /**
   * Get server status
   * @returns {Object} - Server status information
   */
  getStatus() {
    return {
      running: this.server !== null,
      port: this.port,
      protoPath: this.protoPath,
      service: 'rag.v1.CoordinatorService'
    };
  }
}

// Singleton instance
const grpcServer = new GrpcServer();

/**
 * Start gRPC server (exported function for index.js)
 * @returns {Promise<Object>} - Server instance
 */
async function startGrpcServer() {
  try {
    logger.info('Starting gRPC server for RAG communication...');
    const server = await grpcServer.start();
    return server;
  } catch (error) {
    logger.error('Failed to start gRPC server', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Shutdown gRPC server (exported function for graceful shutdown)
 * @returns {Promise<void>}
 */
async function shutdownGrpcServer() {
  return grpcServer.shutdown();
}

/**
 * Get gRPC server status
 * @returns {Object} - Server status
 */
function getGrpcServerStatus() {
  return grpcServer.getStatus();
}

module.exports = {
  startGrpcServer,
  shutdownGrpcServer,
  getGrpcServerStatus,
  GrpcServer
};
