/**
 * Coordinator Service Integration Tests
 * 
 * Tests for /register and /route endpoints with business metrics tracking.
 * Uses the test coordinator (test-server.js).
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const app = require('../test-server');
const { registeredServices } = require('../test-server');
const { getMetrics, resetMetrics } = require('../src/monitoring/metrics');
const { resetConfig } = require('../src/config');

// Generate test RSA key pair
function generateTestKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
}

describe('Coordinator Service - Registration & Routing', () => {
  let testKeys;
  let validToken;
  const testIssuer = 'test-issuer';
  const testServiceId = 'test-service';

  beforeEach(() => {
    // Reset config
    resetConfig();

    // Generate test keys
    testKeys = generateTestKeyPair();

    // Set up environment variables for JWT
    process.env.NODE_ENV = 'test';
    process.env.SKIP_ENV_VALIDATION = 'true';
    process.env.SERVICE_JWT_PUBLIC_KEY = testKeys.publicKey;
    process.env.SERVICE_JWT_ISSUER = testIssuer;

    // Generate valid token
    validToken = jwt.sign(
      {
        sub: testServiceId,
        service_id: testServiceId,
        iss: testIssuer,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      testKeys.privateKey,
      { algorithm: 'RS256' }
    );

    // Reset metrics and clear registered services before each test
    resetMetrics();
    registeredServices.clear();
  });

  afterEach(() => {
    delete process.env.SERVICE_JWT_PUBLIC_KEY;
    delete process.env.SERVICE_JWT_ISSUER;
  });

  describe('POST /register', () => {
    test('should register a service successfully', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'test-service',
          url: 'http://localhost:3001'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'test-service');
      expect(response.body).toHaveProperty('url', 'http://localhost:3001');
      expect(response.body).toHaveProperty('registeredAt');
    });

    test('should increment registration success metric', async () => {
      await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'test-service',
          url: 'http://localhost:3001'
        })
        .expect(201);

      const metrics = await getMetrics();
      expect(metrics).toMatch(/coordinator_service_registrations_total.*status="success"/);
    });

    test('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'test-service'
          // Missing required 'url' field
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
      // Note: Validation errors don't increment business metrics (validation happens before handler)
    });

    test('should reject invalid URL format', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'test-service',
          url: 'not-a-valid-url'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('url');
      // Note: Validation errors don't increment business metrics (validation happens before handler)
    });

    test('should accept optional schema field', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'test-service',
          url: 'http://localhost:3001',
          schema: { type: 'object', properties: {} }
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('POST /route', () => {
    let serviceId;

    beforeEach(async () => {
      // Register a service first for routing tests
      const registerResponse = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'destination-service',
          url: 'http://localhost:3002'
        });
      serviceId = registerResponse.body.id;
    });

    test('should route data successfully', async () => {
      const response = await request(app)
        .post('/route')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          origin: 'client',
          destination: serviceId,
          data: { key: 'value', test: true }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('origin', 'client');
      expect(response.body).toHaveProperty('destination');
      expect(response.body).toHaveProperty('routedAt');
    });

    test('should increment routing success metric', async () => {
      await request(app)
        .post('/route')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          origin: 'client',
          destination: serviceId,
          data: { key: 'value' }
        })
        .expect(200);

      const metrics = await getMetrics();
      expect(metrics).toMatch(/coordinator_routing_operations_total.*status="success"/);
    });

    test('should reject routing with missing required fields', async () => {
      const response = await request(app)
        .post('/route')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          origin: 'client'
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
      // Note: Validation errors don't increment business metrics (validation happens before handler)
    });

    test('should fail routing to non-existent service', async () => {
      const response = await request(app)
        .post('/route')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          origin: 'client',
          destination: 'non-existent-service',
          data: { key: 'value' }
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');

      const metrics = await getMetrics();
      expect(metrics).toMatch(/coordinator_routing_operations_total.*status="failed"/);
    });

    test('should route by service name', async () => {
      const response = await request(app)
        .post('/route')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          origin: 'client',
          destination: 'destination-service', // Use name instead of ID
          data: { key: 'value' }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /services', () => {
    test('should list registered services', async () => {
      // Register a few services
      await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'service1', url: 'http://localhost:3001' });

      await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'service2', url: 'http://localhost:3002' });

      const response = await request(app)
        .get('/services')
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBeGreaterThanOrEqual(2);
      expect(response.body).toHaveProperty('services');
      expect(Array.isArray(response.body.services)).toBe(true);
      expect(response.body.services.length).toBeGreaterThanOrEqual(2);
      
      // Verify services are in the list
      const serviceNames = response.body.services.map(s => s.name);
      expect(serviceNames).toContain('service1');
      expect(serviceNames).toContain('service2');
    });
  });

  describe('Metrics Integration', () => {
    test('should track HTTP metrics for all endpoints', async () => {
      // Make requests to various endpoints
      await request(app).get('/health').expect(200);
      await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'test', url: 'http://localhost:3001' })
        .expect(201);
      await request(app).get('/services').expect(200);

      const metrics = await getMetrics();
      
      // Check HTTP metrics are recorded
      expect(metrics).toMatch(/http_requests_total.*route="\/health"/);
      expect(metrics).toMatch(/http_requests_total.*route="\/register"/);
      expect(metrics).toMatch(/http_requests_total.*route="\/services"/);
      expect(metrics).toMatch(/http_request_duration_seconds/);
    });

    test('should track business metrics alongside HTTP metrics', async () => {
      // Register and route
      const registerResponse = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'test-service', url: 'http://localhost:3001' })
        .expect(201);

      await request(app)
        .post('/route')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          origin: 'client',
          destination: registerResponse.body.id,
          data: { test: true }
        })
        .expect(200);

      const metrics = await getMetrics();
      
      // Check both HTTP and business metrics
      expect(metrics).toMatch(/http_requests_total/);
      expect(metrics).toMatch(/coordinator_service_registrations_total.*status="success"/);
      expect(metrics).toMatch(/coordinator_routing_operations_total.*status="success"/);
    });
  });
});

