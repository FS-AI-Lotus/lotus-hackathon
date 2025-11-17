/**
 * Test Coordinator Service
 * 
 * A complete test implementation of the Coordinator service with:
 * - Monitoring metrics (Prometheus)
 * - Health endpoint
 * - Service registration endpoint
 * - Data routing endpoint
 * 
 * Usage:
 *   node test-server.js
 * 
 * Endpoints:
 *   GET  /health    - Health check
 *   GET  /metrics   - Prometheus metrics
 *   POST /register  - Register a new service
 *   POST /route     - Route data between services
 */

const express = require('express');
const httpMetricsMiddleware = require('./src/monitoring/httpMetricsMiddleware');
const metricsEndpoint = require('./src/monitoring/metricsEndpoint');
const { incrementServiceRegistration, incrementRoutingResult } = require('./src/monitoring/metrics');

// Security middleware
const authServiceJwtMiddleware = require('./src/security/authServiceJwtMiddleware');
const { strictRateLimiter, moderateRateLimiter } = require('./src/security/rateLimiter');
const { validateRegisterMiddleware, validateRouteMiddleware } = require('./src/security/validationMiddleware');
const { sqlInjectionProtection, promptInjectionDetection } = require('./src/security/injectionProtection');

const app = express();
app.use(express.json());

// Add metrics middleware (must be before routes)
app.use(httpMetricsMiddleware);

// Global SQL injection protection (applies to all routes)
app.use(sqlInjectionProtection);

// In-memory storage for registered services (for testing)
const registeredServices = new Map();

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'coordinator-test',
    uptime: process.uptime(),
    registeredServices: registeredServices.size
  });
});

// Metrics endpoint
app.get('/metrics', metricsEndpoint);

// Service Registration endpoint
// Middleware order: Rate limiting -> JWT auth -> Validation -> Handler
app.post('/register', 
  strictRateLimiter,
  authServiceJwtMiddleware,
  validateRegisterMiddleware,
  (req, res) => {
  try {
    const { name, url, schema } = req.body;

    // Register service
    const serviceId = `service-${Date.now()}`;
    registeredServices.set(serviceId, {
      id: serviceId,
      name,
      url,
      schema: schema || {},
      registeredAt: new Date().toISOString()
    });

    // Track successful registration
    incrementServiceRegistration('success');

    res.status(201).json({
      id: serviceId,
      name,
      url,
      registeredAt: registeredServices.get(serviceId).registeredAt
    });
  } catch (error) {
    incrementServiceRegistration('failed');
    res.status(500).json({ 
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Data Routing endpoint
// Middleware order: Rate limiting -> JWT auth -> Validation -> Prompt injection protection -> Handler
app.post('/route',
  moderateRateLimiter,
  authServiceJwtMiddleware,
  validateRouteMiddleware,
  promptInjectionDetection,
  (req, res) => {
  try {
    const { origin, destination, data } = req.body;

    // Check if destination service is registered
    const destinationService = Array.from(registeredServices.values())
      .find(s => s.id === destination || s.name === destination);

    if (!destinationService) {
      incrementRoutingResult('failed');
      return res.status(404).json({ 
        error: 'Destination service not found',
        destination
      });
    }

    // Simulate routing (in real implementation, this would forward to the service)
    // For testing, we'll just return success
    incrementRoutingResult('success');

    res.status(200).json({
      success: true,
      origin,
      destination: destinationService.name,
      destinationUrl: destinationService.url,
      routedAt: new Date().toISOString(),
      dataSize: JSON.stringify(data).length
    });
  } catch (error) {
    incrementRoutingResult('failed');
    res.status(500).json({ 
      error: 'Routing failed',
      message: error.message
    });
  }
});

// List registered services (for testing)
app.get('/services', (req, res) => {
  const services = Array.from(registeredServices.values());
  res.json({
    count: services.length,
    services: services
  });
});

// Test endpoint to generate some metrics
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint', timestamp: new Date().toISOString() });
});

// Error endpoint to test error metrics
app.get('/error', (req, res) => {
  res.status(500).json({ error: 'Test error endpoint' });
});

// Export app for testing
module.exports = app;

// Only start server if run directly (not when imported for tests)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log('\n✅ Test Coordinator Service running!');
    console.log(`\n📍 Endpoints:`);
    console.log(`   Health:    http://localhost:${PORT}/health`);
    console.log(`   Metrics:   http://localhost:${PORT}/metrics`);
    console.log(`   Register:  http://localhost:${PORT}/register`);
    console.log(`   Route:     http://localhost:${PORT}/route`);
    console.log(`   Services:  http://localhost:${PORT}/services`);
    console.log(`\n💡 Test examples:`);
    console.log(`   # Health check`);
    console.log(`   curl http://localhost:${PORT}/health`);
    console.log(`\n   # Register a service`);
    console.log(`   curl -X POST http://localhost:${PORT}/register \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"name":"test-service","url":"http://localhost:3001"}'`);
    console.log(`\n   # Route data`);
    console.log(`   curl -X POST http://localhost:${PORT}/route \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"origin":"client","destination":"service-123","data":{"key":"value"}}'`);
    console.log(`\n   # Check metrics`);
    console.log(`   curl http://localhost:${PORT}/metrics`);
    console.log(`\n📊 All requests are automatically tracked in Prometheus metrics!\n`);
  });
}

// Export registeredServices for test cleanup
module.exports.registeredServices = registeredServices;

