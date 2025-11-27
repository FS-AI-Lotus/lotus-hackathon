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

// Create Express app IMMEDIATELY - before loading any services
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

// ============================================================
// CRITICAL: Health check endpoint FIRST - before ANY middleware
// Railway checks this within 1-2 seconds of container start
// This MUST respond immediately with NO dependencies, NO middleware
// ============================================================
app.get('/health', (req, res) => {
  // Respond immediately - no async, no services, no middleware, no logging
  // Railway needs this to respond in < 1 second
  res.status(200).json({ 
    status: 'healthy', 
    service: 'coordinator',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  // Root endpoint also responds immediately for Railway
  res.status(200).json({ 
    service: 'Coordinator', 
    status: 'running',
    health: '/health'
  });
});

// Load logger AFTER health endpoint (for consistent logging)
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/logger');

// ============================================================
// Add middleware AFTER health endpoint
// This ensures health endpoint responds immediately
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Request timeout middleware - but skip for health checks
app.use((req, res, next) => {
  // Health checks need to respond immediately, no timeout
  if (req.path === '/health' || req.path === '/') {
    return next();
  }
  
  // Set timeout on response (req.setTimeout is deprecated and unreliable)
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: 'Request timeout'
      });
      res.end();
    }
  }, 25000); // 25 seconds
  
  // Clear timeout when response finishes
  res.on('finish', () => {
    clearTimeout(timeout);
  });
  
  res.on('close', () => {
    clearTimeout(timeout);
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

// CORS middleware (configurable via environment variables)
app.use((req, res, next) => {
  // Allow specific origins from env var, or default to '*' (all origins)
  // For production, set ALLOWED_ORIGINS to specific domains: "https://example.com,https://app.example.com"
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['*']; // Default: allow all origins
  
  const origin = req.headers.origin;
  
  // If specific origins configured, check if request origin is allowed
  if (allowedOrigins[0] !== '*' && origin) {
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true'); // ✅ OK with specific origin
    }
    // If origin not in allowed list, don't set header (browser will block)
  } else {
    // Allow all origins (default behavior)
    res.header('Access-Control-Allow-Origin', '*');
    // ❌ Cannot set credentials when origin is '*' - browsers reject this
    // Credentials only work with specific origins
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Health endpoints already registered above (before middleware)

// ============================================================
// START SERVER FIRST - Health endpoint must be available immediately
// Then load routes asynchronously (non-blocking)
// This ensures Railway health checks work even if route loading is slow
// ============================================================
let server;
let routesReady = false;

// Start server IMMEDIATELY - health endpoint is already registered
try {
  server = app.listen(PORT, HOST);
  
  // Consolidated event listener (single handler for all listening events)
  server.once('listening', () => {
    const address = server.address();
    console.log(`✅ Server listening on http://${address.address}:${address.port}`);
    console.log(`✅ Health check ready: http://${address.address}:${address.port}/health`);
    console.log(`✅ Server ready for Railway health checks`);
    
    logger.info('✅ Coordinator HTTP server is listening', {
      port: address.port,
      host: HOST,
      address: address.address,
      url: `http://${HOST}:${address.port}`,
      environment: process.env.NODE_ENV || 'development'
    });
    
    // Load routes asynchronously after server starts (non-blocking)
    loadRoutesAsync();
  });
  
  server.on('error', (error) => {
    logger.error('❌ Server error occurred', {
      error: error.message,
      code: error.code,
      port: PORT,
      host: HOST
    });
    console.error('❌ Server error:', error);
    
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use. Try a different port: PORT=3002 npm start`);
    } else if (error.code === 'EACCES') {
      logger.error(`Permission denied on port ${PORT}. Try a different port: PORT=3002 npm start`);
    }
    
    process.exit(1);
  });
  
  // Set request timeout to prevent hanging requests
  server.timeout = 30000; // 30 seconds
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds
  
  // Replace startup error handlers with runtime handlers (after server is created)
  // This allows graceful shutdown for runtime errors
  process.removeListener('uncaughtException', startupErrorHandler);
  process.removeListener('unhandledRejection', startupRejectionHandler);
  
} catch (error) {
  logger.error('❌ FATAL: Failed to start server', {
    error: error.message,
    stack: error.stack
  });
  console.error('❌ FATAL: Failed to start server:', error);
  process.exit(1);
}

// ============================================================
// Load routes asynchronously (non-blocking)
// This allows server to start immediately for Railway health checks
// ============================================================
async function loadRoutesAsync() {
  try {
    logger.info('Loading routes...');
    
    // Load route modules (services will initialize when routes are required)
    const registerRoutes = require('./routes/register');
    const uiuxRoutes = require('./routes/uiux');
    const servicesRoutes = require('./routes/services');
    // NOTE: healthRoutes removed - using simple /health endpoint above instead
    const metricsRoutes = require('./routes/metrics');
    const routeRoutes = require('./routes/route');
    const knowledgeGraphRoutes = require('./routes/knowledgeGraph');
    const changelogRoutes = require('./routes/changelog');
    const schemasRoutes = require('./routes/schemas');
    const proxyRoutes = require('./routes/proxy');
    
    // Register routes
    // IMPORTANT: Register before proxy route
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
    
    // Additional endpoints
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

    app.get('/test', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Server is responding',
        timestamp: new Date().toISOString(),
        port: PORT,
        routesReady: routesReady
      });
    });

    // Set routesReady BEFORE registering /ready endpoint to avoid race condition
    routesReady = true;
    
    app.get('/ready', (req, res) => {
      if (routesReady) {
        res.status(200).json({
          status: 'ready',
          message: 'All routes and services are initialized',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'starting',
          message: 'Routes are still being initialized',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Proxy route - MUST be after all specific routes
    // This catches all requests that don't match coordinator endpoints
    app.use(proxyRoutes);
    
    // Error handlers MUST be registered AFTER all routes
    // This ensures 404/500 errors are handled correctly
    app.use(notFoundHandler);
    app.use(errorHandler);
    
    routesReady = true;
    logger.info('All routes registered');
    console.log('✅ All API endpoints registered');
    
  } catch (error) {
    // Don't exit - server is running, health endpoint works
    // Just log the error and continue
    logger.error('Failed to load routes', { 
      error: error.message, 
      stack: error.stack 
    });
    console.error('❌ Failed to load routes (server still running, health endpoint works):', error.message);
    // Server continues running - health endpoint still works
  }
}

// ============================================================
// Initialize knowledge graph on startup (non-blocking, after server starts)
// Use setTimeout to ensure server starts first
// Added retry logic for better reliability
// ============================================================
let knowledgeGraphInitTimeout = null;
let knowledgeGraphRetryTimeout = null;

const initKnowledgeGraph = async () => {
  let retries = 3;
  while (retries > 0) {
    try {
      const knowledgeGraphService = require('./services/knowledgeGraphService');
      await knowledgeGraphService.rebuildGraph();
      logger.info('Knowledge graph initialized on startup');
      return; // Success
    } catch (error) {
      retries--;
      if (retries === 0) {
        logger.error('Failed to initialize knowledge graph after retries', {
          error: error.message,
          stack: error.stack
        });
        return;
      } else {
        logger.warn(`Knowledge graph init failed, retrying... (${retries} left)`, {
          error: error.message
        });
        // Wait 2 seconds before retry
        await new Promise(resolve => {
          knowledgeGraphRetryTimeout = setTimeout(resolve, 2000);
        });
      }
    }
  }
};

knowledgeGraphInitTimeout = setTimeout(() => {
  initKnowledgeGraph();
}, 1000); // Wait 1 second after server starts

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
  
  // Set timeout for graceful shutdown (prevent hanging)
  const shutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 10000); // 10 seconds max
  
  // Close HTTP server
  server.close(() => {
    clearTimeout(shutdownTimeout);
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
        
        clearTimeout(shutdownTimeout);
        process.exit(0);
      });
    } else {
      clearTimeout(shutdownTimeout);
      process.exit(0);
    }
  });
  
  // Force close idle connections
  if (server.closeIdleConnections) {
    server.closeIdleConnections();
  }
};

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

process.on('SIGTERM', () => {
  // Clear knowledge graph timeouts on shutdown
  if (knowledgeGraphInitTimeout) clearTimeout(knowledgeGraphInitTimeout);
  if (knowledgeGraphRetryTimeout) clearTimeout(knowledgeGraphRetryTimeout);
  gracefulShutdown('SIGTERM');
});

process.on('SIGINT', () => {
  // Clear knowledge graph timeouts on shutdown
  if (knowledgeGraphInitTimeout) clearTimeout(knowledgeGraphInitTimeout);
  if (knowledgeGraphRetryTimeout) clearTimeout(knowledgeGraphRetryTimeout);
  gracefulShutdown('SIGINT');
});

module.exports = app;

