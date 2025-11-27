// Top-level error handling - catch any errors during module loading
let startupErrorHandler = (error) => {
  console.error('❌ UNCAUGHT EXCEPTION during startup:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
};
process.on('uncaughtException', startupErrorHandler);

let startupRejectionHandler = (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION during startup:', reason);
  // Don't exit - log and continue
};
process.on('unhandledRejection', startupRejectionHandler);

require('dotenv').config();
const express = require('express');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/logger');

// Import routes
const registerRoutes = require('./routes/register');
const uiuxRoutes = require('./routes/uiux');
const servicesRoutes = require('./routes/services');
const healthRoutes = require('./routes/health');
const metricsRoutes = require('./routes/metrics');
const routeRoutes = require('./routes/route');
const knowledgeGraphRoutes = require('./routes/knowledgeGraph');
const changelogRoutes = require('./routes/changelog');
const schemasRoutes = require('./routes/schemas');
const proxyRoutes = require('./routes/proxy');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint FIRST - before ANYTHING else (for Railway)
// This MUST respond immediately with zero dependencies or Railway will kill the container
// Railway checks this within 1-2 seconds of container start
app.get('/health', (req, res) => {
  // Respond immediately - no checks, no async, no dependencies
  res.status(200).json({
    status: 'healthy',
    service: 'coordinator'
  });
});

// Root endpoint also responds immediately (Railway may check this too)
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Coordinator Microservice',
    version: '1.0.0',
    status: 'running'
  });
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Request timeout middleware - but skip for health checks
app.use((req, res, next) => {
  // Health checks need to respond immediately, no timeout
  if (req.path === '/health' || req.path === '/') {
    return next();
  }
  
  req.setTimeout(25000, () => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: 'Request timeout'
      });
    }
  });
  next();
});

// Sanitize URL paths - remove trailing whitespace and newlines
app.use((req, res, next) => {
  // Clean URL from newlines and trailing whitespace
  if (req.url) {
    const cleanedUrl = req.url
      .replace(/%0A/g, '')  // Remove URL-encoded newlines
      .replace(/%0D/g, '')  // Remove URL-encoded carriage returns
      .replace(/\s+$/g, ''); // Remove trailing whitespace
    
    if (cleanedUrl !== req.url) {
      req.url = cleanedUrl;
      // Re-parse the URL to update req.path
      try {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        req.path = url.pathname;
      } catch (e) {
        // If URL parsing fails, just use the cleaned path
        req.path = cleanedUrl.split('?')[0];
      }
    }
  }
  next();
});

// CORS middleware (basic - can be enhanced by Team 4)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Health routes (detailed health info) - but /health is already handled above
// Keep this for backward compatibility but it won't be hit since /health is already defined
// app.use('/health', healthRoutes); // Disabled - using inline /health above for Railway

// Routes
app.use('/register', registerRoutes);
app.use('/uiux', uiuxRoutes);
app.use('/services', servicesRoutes);
app.use('/registry', servicesRoutes); // Alias for /services
app.use('/route', routeRoutes);
app.use('/knowledge-graph', knowledgeGraphRoutes);
app.use('/graph', knowledgeGraphRoutes); // Alias for /knowledge-graph
app.use('/changelog', changelogRoutes);
app.use('/schemas', schemasRoutes);
app.use('/metrics', metricsRoutes);

// Detailed root endpoint (after middleware)
app.get('/info', (req, res) => {
  res.status(200).json({
    service: 'Coordinator Microservice',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      register: 'POST /register, POST /register/:serviceId/migration',
      route: 'GET /route, POST /route (AI-based routing)',
      knowledgeGraph: 'GET /knowledge-graph, GET /graph, POST /knowledge-graph/rebuild',
      uiux: 'GET /uiux, POST /uiux',
      services: 'GET /services, GET /registry',
      changelog: 'GET /changelog, GET /changelog/stats, GET /changelog/search, POST /changelog/cleanup',
      schemas: 'GET /schemas, GET /schemas/:serviceId, POST /schemas/:serviceId/validate',
      health: 'GET /health',
      metrics: 'GET /metrics',
      proxy: 'All other routes are proxied through AI routing'
    }
  });
});

// Simple test endpoint - no dependencies, responds immediately
app.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is responding',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Proxy route - MUST be after all specific routes but before error handlers
// This catches all requests that don't match coordinator endpoints
app.use(proxyRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize knowledge graph on startup (non-blocking, after server starts)
// Use setTimeout to ensure server starts first
setTimeout(async () => {
  try {
    const knowledgeGraphService = require('./services/knowledgeGraphService');
    await knowledgeGraphService.rebuildGraph();
    logger.info('Knowledge graph initialized on startup');
  } catch (error) {
    logger.warn('Failed to initialize knowledge graph on startup', {
      error: error.message,
      stack: error.stack
    });
    // Don't crash - this is non-critical
  }
}, 1000); // Wait 1 second after server starts

// Start HTTP server
// Use 0.0.0.0 for Railway/deployment, 127.0.0.1 for local development (avoids IPv6 issues)
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

// Log that we're about to start
console.log('🚀 Starting HTTP server...');
console.log(`   Port: ${PORT}`);
console.log(`   Host: ${HOST}`);
console.log(`   Node Env: ${process.env.NODE_ENV || 'development'}`);

logger.info('Starting HTTP server', {
  port: PORT,
  host: HOST,
  nodeEnv: process.env.NODE_ENV || 'development'
});

let server;
try {
  server = app.listen(PORT, HOST, () => {
    // Server started successfully
    const address = server.address();
    
    console.log(`✅ Server started successfully!`);
    console.log(`   Listening on http://${address.address}:${address.port}`);
    console.log(`   Health: http://${address.address}:${address.port}/health`);
    console.log(`   Ready to accept connections`);
    
    logger.info(`✅ Coordinator HTTP server started successfully`, {
      port: PORT,
      host: HOST,
      address: address.address,
      port: address.port,
      url: `http://${HOST}:${PORT}`,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });
} catch (error) {
  console.error('❌ FATAL: Failed to start server:', error);
  logger.error('FATAL: Failed to start server', {
    error: error.message,
    stack: error.stack,
    port: PORT,
    host: HOST
  });
  process.exit(1);
}

// Handle server errors
server.on('error', (err) => {
  logger.error('❌ Server error occurred', {
    error: err.message,
    code: err.code,
    port: PORT,
    host: HOST
  });
  
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Try a different port: PORT=3002 npm start`);
  } else if (err.code === 'EACCES') {
    logger.error(`Permission denied on port ${PORT}. Try a different port: PORT=3002 npm start`);
  }
  
  process.exit(1);
});

// Log when server is listening
server.on('listening', () => {
  const address = server.address();
  logger.info('✅ Server is listening', {
    address: address.address,
    port: address.port,
    family: address.family
  });
});

// Set request timeout to prevent hanging requests
server.timeout = 30000; // 30 seconds
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Try a different port: PORT=3002 npm start`);
  } else if (err.code === 'EACCES') {
    logger.error(`Permission denied on port ${PORT}. Try a different port: PORT=3002 npm start`);
  } else {
    logger.error('Server error', { error: err.message, code: err.code });
  }
  process.exit(1);
});

// Start gRPC server (optional, won't crash if it fails)
let grpcServer = null;
const grpcEnabled = process.env.GRPC_ENABLED !== 'false'; // Default: enabled

if (grpcEnabled) {
  try {
    const { startGrpcServer } = require('./grpc/server');
    startGrpcServer()
      .then((server) => {
        grpcServer = server;
        logger.info('Both HTTP and gRPC servers are running', {
          httpPort: PORT,
          grpcPort: process.env.GRPC_PORT || 50051
        });
      })
      .catch((error) => {
        logger.warn('Failed to start gRPC server (HTTP server will continue)', { 
          error: error.message,
          hint: 'Set GRPC_ENABLED=false to disable gRPC, or install @grpc/grpc-js and @grpc/proto-loader'
        });
        // Don't crash - HTTP server is more important
      });
  } catch (error) {
    logger.warn('gRPC dependencies not available (HTTP server will continue)', {
      error: error.message,
      hint: 'Install @grpc/grpc-js and @grpc/proto-loader for gRPC support, or set GRPC_ENABLED=false'
    });
    // Don't crash - HTTP server is more important
  }
} else {
  logger.info('gRPC server disabled via GRPC_ENABLED=false');
}

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} signal received: shutting down gracefully`);
  
  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close gRPC server if running
    if (grpcServer) {
      grpcServer.tryShutdown((error) => {
        if (error) {
          logger.error('Error shutting down gRPC server', { error: error.message });
          grpcServer.forceShutdown();
        } else {
          logger.info('gRPC server closed');
        }
        
        // Close gRPC clients
        const { closeMicroserviceClients } = require('./grpc/client');
        closeMicroserviceClients();
        
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
};

// Replace startup error handlers with runtime handlers (after server is created)
process.removeListener('uncaughtException', startupErrorHandler);
process.removeListener('unhandledRejection', startupRejectionHandler);

// Handle unhandled promise rejections (after server is created)
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { promise, reason });
  // Don't exit - just log
  if (process.env.NODE_ENV !== 'production') {
    console.error('Unhandled Rejection:', reason);
  }
});

// Handle uncaught exceptions (after server is created)
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  // Use graceful shutdown if server exists
  if (server) {
    gracefulShutdown('uncaughtException');
  } else {
    console.error('Fatal error before server started:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;

