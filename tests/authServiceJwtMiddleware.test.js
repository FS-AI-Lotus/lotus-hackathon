/**
 * JWT Authentication Middleware Tests
 * 
 * Tests for src/security/authServiceJwtMiddleware.js
 * Ensures JWT middleware correctly verifies tokens and handles errors.
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

describe('JWT Authentication Middleware', () => {
  let app;
  let testKeys;
  let validToken;
  const testIssuer = 'test-issuer';
  const testAudience = 'test-audience';
  const testServiceId = 'test-service';

  beforeEach(() => {
    // Reset config
    resetConfig();

    // Generate test keys
    testKeys = generateTestKeyPair();

    // Set up environment variables
    process.env.NODE_ENV = 'test';
    process.env.SKIP_ENV_VALIDATION = 'true';
    process.env.SERVICE_JWT_PUBLIC_KEY = testKeys.publicKey;
    process.env.SERVICE_JWT_ISSUER = testIssuer;
    process.env.SERVICE_JWT_AUDIENCE = testAudience;

    // Create Express app with middleware
    app = express();
    app.use(express.json());
    app.use(authServiceJwtMiddleware);
    app.get('/protected', (req, res) => {
      res.json({
        success: true,
        serviceContext: req.serviceContext,
      });
    });

    // Generate valid token
    validToken = jwt.sign(
      {
        sub: testServiceId,
        service_id: testServiceId,
        iss: testIssuer,
        aud: testAudience,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      },
      testKeys.privateKey,
      { algorithm: 'RS256' }
    );
  });

  afterEach(() => {
    // Clean up env vars
    delete process.env.SERVICE_JWT_PUBLIC_KEY;
    delete process.env.SERVICE_JWT_ISSUER;
    delete process.env.SERVICE_JWT_AUDIENCE;
  });

  describe('Missing Authorization header', () => {
    test('should return 401 when Authorization header is missing', async () => {
      const response = await request(app)
        .get('/protected')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body).toHaveProperty('message', 'Missing Authorization header');
    });
  });

  describe('Invalid Authorization header format', () => {
    test('should return 401 when header is not "Bearer <token>"', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body.message).toContain('Invalid Authorization header format');
    });

    test('should return 401 when token is missing', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body.message).toContain('Missing token');
    });
  });

  describe('Invalid token', () => {
    test('should return 401 for malformed token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body).toHaveProperty('message', 'Invalid token');
    });

    test('should return 401 for token signed with wrong key', async () => {
      const wrongKeys = generateTestKeyPair();
      const wrongToken = jwt.sign(
        { sub: testServiceId, iss: testIssuer },
        wrongKeys.privateKey,
        { algorithm: 'RS256' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${wrongToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    test('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign(
        {
          sub: testServiceId,
          iss: testIssuer,
          iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
          exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
        },
        testKeys.privateKey,
        { algorithm: 'RS256' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body).toHaveProperty('message', 'Token has expired');
    });
  });

  describe('Invalid issuer/audience', () => {
    test('should return 403 for token with wrong issuer', async () => {
      const wrongIssuerToken = jwt.sign(
        {
          sub: testServiceId,
          iss: 'wrong-issuer',
          aud: testAudience,
        },
        testKeys.privateKey,
        { algorithm: 'RS256' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${wrongIssuerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });

    test('should return 403 for token with wrong audience', async () => {
      const wrongAudienceToken = jwt.sign(
        {
          sub: testServiceId,
          iss: testIssuer,
          aud: 'wrong-audience',
        },
        testKeys.privateKey,
        { algorithm: 'RS256' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${wrongAudienceToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });
  });

  describe('Missing required claims', () => {
    test('should return 401 when token lacks sub and service_id', async () => {
      const tokenWithoutSub = jwt.sign(
        {
          iss: testIssuer,
          aud: testAudience,
        },
        testKeys.privateKey,
        { algorithm: 'RS256' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${tokenWithoutSub}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body.message).toContain('sub or service_id');
    });
  });

  describe('Valid token', () => {
    test('should allow request with valid RS256 token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.serviceContext).toBeDefined();
      expect(response.body.serviceContext.serviceId).toBe(testServiceId);
      expect(response.body.serviceContext.issuer).toBe(testIssuer);
      expect(response.body.serviceContext.audience).toBe(testAudience);
    });

    test('should attach service context to request', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      const context = response.body.serviceContext;
      expect(context).toHaveProperty('serviceId', testServiceId);
      expect(context).toHaveProperty('claims');
      expect(context.claims).toHaveProperty('sub', testServiceId);
      expect(context).toHaveProperty('issuer', testIssuer);
      expect(context).toHaveProperty('audience', testAudience);
    });

    test('should extract optional role and scope from token', async () => {
      const tokenWithRole = jwt.sign(
        {
          sub: testServiceId,
          service_id: testServiceId,
          iss: testIssuer,
          aud: testAudience,
          role: 'admin',
          scope: ['read', 'write'],
        },
        testKeys.privateKey,
        { algorithm: 'RS256' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${tokenWithRole}`)
        .expect(200);

      expect(response.body.serviceContext.role).toBe('admin');
      expect(response.body.serviceContext.scope).toEqual(['read', 'write']);
    });

    test('should accept token with only sub claim', async () => {
      const tokenWithSubOnly = jwt.sign(
        {
          sub: testServiceId,
          iss: testIssuer,
        },
        testKeys.privateKey,
        { algorithm: 'RS256' }
      );

      // Remove audience requirement for this test
      delete process.env.SERVICE_JWT_AUDIENCE;
      resetConfig();

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${tokenWithSubOnly}`)
        .expect(200);

      expect(response.body.serviceContext.serviceId).toBe(testServiceId);
    });

    test('should accept token with only service_id claim', async () => {
      const tokenWithServiceId = jwt.sign(
        {
          service_id: testServiceId,
          iss: testIssuer,
        },
        testKeys.privateKey,
        { algorithm: 'RS256' }
      );

      delete process.env.SERVICE_JWT_AUDIENCE;
      resetConfig();

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${tokenWithServiceId}`)
        .expect(200);

      expect(response.body.serviceContext.serviceId).toBe(testServiceId);
    });
  });

  describe('Configuration errors', () => {
    test('should return 500 when public key is not configured', async () => {
      delete process.env.SERVICE_JWT_PUBLIC_KEY;
      resetConfig();

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal Server Error');
      expect(response.body.message).toContain('JWT public key not configured');
    });
  });

  describe('Algorithm restrictions', () => {
    test('should reject HS256 token (symmetric)', async () => {
      const hs256Token = jwt.sign(
        { sub: testServiceId, iss: testIssuer },
        'secret-key',
        { algorithm: 'HS256' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${hs256Token}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });
});

