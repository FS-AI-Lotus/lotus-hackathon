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

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

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
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Coordinator Microservice',
    version: '1.0.0',
    status: 'running',
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

// Proxy route - MUST be after all specific routes but before error handlers
// This catches all requests that don't match coordinator endpoints
app.use(proxyRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize knowledge graph on startup
const knowledgeGraphService = require('./services/knowledgeGraphService');
setImmediate(async () => {
  try {
    await knowledgeGraphService.rebuildGraph();
    logger.info('Knowledge graph initialized on startup');
  } catch (error) {
    logger.warn('Failed to initialize knowledge graph on startup', {
      error: error.message
    });
  }
});

// Start HTTP server
const server = app.listen(PORT, () => {
  logger.info(`Coordinator HTTP server started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start gRPC server
const { startGrpcServer } = require('./grpc/server');
let grpcServer = null;

const grpcEnabled = process.env.GRPC_ENABLED !== 'false'; // Default: enabled
if (grpcEnabled) {
  startGrpcServer()
    .then((server) => {
      grpcServer = server;
      logger.info('Both HTTP and gRPC servers are running', {
        httpPort: PORT,
        grpcPort: process.env.GRPC_PORT || 50051
      });
    })
    .catch((error) => {
      logger.error('Failed to start gRPC server', { error: error.message });
    });
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

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;

