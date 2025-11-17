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

// Logging middleware
const correlationIdMiddleware = require('./src/middleware/correlationId');
const { info, error, security, audit } = require('./src/logger');

const app = express();
app.use(express.json());

// Add correlation ID middleware (must be early in the stack)
app.use(correlationIdMiddleware);

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
    const serviceId = req.serviceContext?.serviceId || 'unknown';

    // Check if service already exists (for schema change detection)
    const existingService = Array.from(registeredServices.values())
      .find(s => s.name === name || s.url === url);
    
    const oldSchema = existingService ? existingService.schema : null;

    // Register service
    const newServiceId = `service-${Date.now()}`;
    registeredServices.set(newServiceId, {
      id: newServiceId,
      name,
      url,
      schema: schema || {},
      registeredAt: new Date().toISOString()
    });

    // Track successful registration
    incrementServiceRegistration('success');

    // Audit log: Service registration success
    audit({ req, serviceId, registeredService: { id: newServiceId, name, url } }, 
      `Service registered successfully: ${name}`);

    // Audit log: Schema change (if updating existing service)
    if (existingService && schema) {
      const schemaChanged = JSON.stringify(oldSchema) !== JSON.stringify(schema);
      if (schemaChanged) {
        audit({ 
          req, 
          serviceId, 
          registeredService: { id: newServiceId, name },
          oldSchema: oldSchema ? JSON.stringify(oldSchema).substring(0, 100) : null,
          newSchema: JSON.stringify(schema).substring(0, 100),
        }, 
        `Schema updated for service: ${name}`);
      }
    }

    res.status(201).json({
      id: newServiceId,
      name,
      url,
      registeredAt: registeredServices.get(newServiceId).registeredAt
    });
  } catch (err) {
    incrementServiceRegistration('failed');
    
    // Audit log: Registration failure
    audit({ req, error: err }, `Service registration failed: ${err.message}`);
    
    res.status(500).json({ 
      error: 'Registration failed',
      message: err.message
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
    const serviceId = req.serviceContext?.serviceId || 'unknown';

    // Check if destination service is registered
    const destinationService = Array.from(registeredServices.values())
      .find(s => s.id === destination || s.name === destination);

    if (!destinationService) {
      incrementRoutingResult('failed');
      
      // Audit log: Routing failure
      audit({ req, serviceId, destination }, 
        `Routing failed: destination service not found: ${destination}`);
      
      return res.status(404).json({ 
        error: 'Destination service not found',
        destination
      });
    }

    // Simulate routing (in real implementation, this would forward to the service)
    // For testing, we'll just return success
    incrementRoutingResult('success');

    // Audit log: Routing success
    audit({ 
      req, 
      serviceId, 
      origin, 
      destination: destinationService.name,
      dataSize: JSON.stringify(data).length 
    }, 
    `Data routed successfully from ${origin} to ${destinationService.name}`);

    res.status(200).json({
      success: true,
      origin,
      destination: destinationService.name,
      destinationUrl: destinationService.url,
      routedAt: new Date().toISOString(),
      dataSize: JSON.stringify(data).length
    });
  } catch (err) {
    incrementRoutingResult('failed');
    
    // Audit log: Routing failure
    audit({ req, error: err }, `Routing operation failed: ${err.message}`);
    
    res.status(500).json({ 
      error: 'Routing failed',
      message: err.message
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
    console.log(`   # Health check (public endpoint)`);
    console.log(`   curl http://localhost:${PORT}/health`);
    console.log(`\n   # Generate JWT token first:`);
    console.log(`   node scripts/generateServiceJwt.js my-service`);
    console.log(`\n   # Register a service (requires JWT token)`);
    console.log(`   TOKEN="<your-jwt-token>"`);
    console.log(`   curl -X POST http://localhost:${PORT}/register \\`);
    console.log(`     -H "Authorization: Bearer $TOKEN" \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"name":"test-service","url":"http://localhost:3001"}'`);
    console.log(`\n   # Route data (requires JWT token)`);
    console.log(`   curl -X POST http://localhost:${PORT}/route \\`);
    console.log(`     -H "Authorization: Bearer $TOKEN" \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"origin":"client","destination":"service-123","data":{"key":"value"}}'`);
    console.log(`\n   # Check metrics (public endpoint)`);
    console.log(`   curl http://localhost:${PORT}/metrics`);
    console.log(`\n📊 All requests are automatically tracked in Prometheus metrics!`);
    console.log(`🔒 Security: /register and /route require JWT authentication`);
    console.log(`📝 See docs/monitoring-and-security.md for complete setup guide\n`);
  });
}

// Export registeredServices for test cleanup
module.exports.registeredServices = registeredServices;

