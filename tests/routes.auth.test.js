/**
 * Route Authentication Tests
 * 
 * Tests for JWT authentication on protected routes.
 * Ensures protected routes require valid JWT tokens.
 */

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authServiceJwtMiddleware = require('../src/security/authServiceJwtMiddleware');
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

describe('Route Authentication', () => {
  let app;
  let testKeys;
  let validToken;
  const testIssuer = 'test-issuer';
  const testServiceId = 'test-service';

  beforeEach(() => {
    resetConfig();

    // Generate test keys
    testKeys = generateTestKeyPair();

    // Set up environment variables
    process.env.NODE_ENV = 'test';
    process.env.SKIP_ENV_VALIDATION = 'true';
    process.env.SERVICE_JWT_PUBLIC_KEY = testKeys.publicKey;
    process.env.SERVICE_JWT_ISSUER = testIssuer;

    // Create Express app
    app = express();
    app.use(express.json());

    // Protected routes (with JWT auth)
    app.post('/register', authServiceJwtMiddleware, (req, res) => {
      res.json({ success: true, serviceId: req.serviceContext.serviceId });
    });

    app.post('/route', authServiceJwtMiddleware, (req, res) => {
      res.json({ success: true, serviceId: req.serviceContext.serviceId });
    });

    // Public route (no auth)
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

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
  });

  afterEach(() => {
    delete process.env.SERVICE_JWT_PUBLIC_KEY;
    delete process.env.SERVICE_JWT_ISSUER;
  });

  describe('Protected Routes', () => {
    test('POST /register should require JWT token', async () => {
      const response = await request(app)
        .post('/register')
        .send({ name: 'test', url: 'http://localhost:3001' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    test('POST /register should accept valid JWT token', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'test', url: 'http://localhost:3001' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.serviceId).toBe(testServiceId);
    });

    test('POST /route should require JWT token', async () => {
      const response = await request(app)
        .post('/route')
        .send({ origin: 'client', destination: 'service-123', data: {} })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    test('POST /route should accept valid JWT token', async () => {
      const response = await request(app)
        .post('/route')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ origin: 'client', destination: 'service-123', data: {} })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.serviceId).toBe(testServiceId);
    });

    test('POST /register should reject invalid JWT token', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', 'Bearer invalid-token')
        .send({ name: 'test', url: 'http://localhost:3001' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('Public Routes', () => {
    test('GET /health should not require JWT token', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });
  });
});

