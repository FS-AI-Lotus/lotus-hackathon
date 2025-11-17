/**
 * Route Validation Tests
 * 
 * Tests for input validation on protected routes.
 * Ensures validation middleware correctly validates and rejects invalid payloads.
 */

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authServiceJwtMiddleware = require('../src/security/authServiceJwtMiddleware');
const { validateRegisterMiddleware, validateRouteMiddleware } = require('../src/security/validationMiddleware');
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

describe('Route Validation', () => {
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

    // Protected routes with validation
    app.post('/register', 
      authServiceJwtMiddleware,
      validateRegisterMiddleware,
      (req, res) => {
        res.json({ success: true, data: req.body });
      }
    );

    app.post('/route',
      authServiceJwtMiddleware,
      validateRouteMiddleware,
      (req, res) => {
        res.json({ success: true, data: req.body });
      }
    );

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

  describe('POST /register validation', () => {
    test('should accept valid registration payload', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'test-service',
          url: 'http://localhost:3001',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'test-service');
      expect(response.body.data).toHaveProperty('url', 'http://localhost:3001');
    });

    test('should reject missing name', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          url: 'http://localhost:3001',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('name');
    });

    test('should reject missing url', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'test-service',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('url');
    });

    test('should reject invalid URL format', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'test-service',
          url: 'not-a-url',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
    });

    test('should trim whitespace from name and url', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: '  test-service  ',
          url: '  http://localhost:3001  ',
        })
        .expect(200);

      expect(response.body.data.name).toBe('test-service');
      expect(response.body.data.url).toBe('http://localhost:3001');
    });
  });

  describe('POST /route validation', () => {
    test('should accept valid routing payload', async () => {
      const response = await request(app)
        .post('/route')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          origin: 'client',
          destination: 'service-123',
          data: { key: 'value' },
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('origin', 'client');
      expect(response.body.data).toHaveProperty('destination', 'service-123');
    });

    test('should reject missing origin', async () => {
      const response = await request(app)
        .post('/route')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          destination: 'service-123',
          data: {},
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('origin');
    });

    test('should reject missing destination', async () => {
      const response = await request(app)
        .post('/route')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          origin: 'client',
          data: {},
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('destination');
    });

    test('should default data to empty object if not provided', async () => {
      const response = await request(app)
        .post('/route')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          origin: 'client',
          destination: 'service-123',
        })
        .expect(200);

      expect(response.body.data.data).toEqual({});
    });
  });
});

