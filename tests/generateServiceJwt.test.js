/**
 * JWT Generation Script Tests
 * 
 * Tests for scripts/generateServiceJwt.js
 * Ensures JWT generation produces valid, verifiable tokens.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateServiceJwt, parseArgs } = require('../scripts/generateServiceJwt');
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

describe('JWT Generation Script', () => {
  let testKeys;
  const testIssuer = 'test-issuer';
  const testAudience = 'test-audience';

  beforeEach(() => {
    // Reset config
    resetConfig();

    // Generate test keys
    testKeys = generateTestKeyPair();

    // Set up environment variables
    process.env.NODE_ENV = 'development';
    process.env.SKIP_ENV_VALIDATION = 'true';
    process.env.SERVICE_JWT_PRIVATE_KEY = testKeys.privateKey;
    process.env.SERVICE_JWT_PUBLIC_KEY = testKeys.publicKey;
    process.env.SERVICE_JWT_ISSUER = testIssuer;
    process.env.SERVICE_JWT_AUDIENCE = testAudience;
  });

  afterEach(() => {
    // Clean up env vars
    delete process.env.SERVICE_JWT_PRIVATE_KEY;
    delete process.env.SERVICE_JWT_PUBLIC_KEY;
    delete process.env.SERVICE_JWT_ISSUER;
    delete process.env.SERVICE_JWT_AUDIENCE;
  });

  describe('generateServiceJwt', () => {
    test('should generate a valid JWT token string', () => {
      const options = {
        serviceId: 'test-service',
        expMinutes: 60,
      };

      const token = generateServiceJwt(options);

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should include required claims in token', () => {
      const options = {
        serviceId: 'test-service',
        expMinutes: 60,
      };

      const token = generateServiceJwt(options);
      const decoded = jwt.decode(token);

      expect(decoded).toHaveProperty('sub', 'test-service');
      expect(decoded).toHaveProperty('service_id', 'test-service');
      expect(decoded).toHaveProperty('iss', testIssuer);
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('should include audience if configured', () => {
      const options = {
        serviceId: 'test-service',
        expMinutes: 60,
      };

      const token = generateServiceJwt(options);
      const decoded = jwt.decode(token);

      expect(decoded).toHaveProperty('aud', testAudience);
    });

    test('should not include audience if not configured', () => {
      delete process.env.SERVICE_JWT_AUDIENCE;
      resetConfig();

      const options = {
        serviceId: 'test-service',
        expMinutes: 60,
      };

      const token = generateServiceJwt(options);
      const decoded = jwt.decode(token);

      expect(decoded).not.toHaveProperty('aud');
    });

    test('should include optional role claim', () => {
      const options = {
        serviceId: 'test-service',
        role: 'admin',
        expMinutes: 60,
      };

      const token = generateServiceJwt(options);
      const decoded = jwt.decode(token);

      expect(decoded).toHaveProperty('role', 'admin');
    });

    test('should include optional scope claim', () => {
      const options = {
        serviceId: 'test-service',
        scope: ['read', 'write'],
        expMinutes: 60,
      };

      const token = generateServiceJwt(options);
      const decoded = jwt.decode(token);

      expect(decoded).toHaveProperty('scope');
      expect(decoded.scope).toEqual(['read', 'write']);
    });

    test('should set expiration based on expMinutes', () => {
      const options = {
        serviceId: 'test-service',
        expMinutes: 30,
      };

      const token = generateServiceJwt(options);
      const decoded = jwt.decode(token);

      const now = Math.floor(Date.now() / 1000);
      const expectedExp = now + (30 * 60); // 30 minutes

      // Allow 5 second tolerance
      expect(Math.abs(decoded.exp - expectedExp)).toBeLessThan(5);
    });

    test('should generate token verifiable with matching public key', () => {
      const options = {
        serviceId: 'test-service',
        expMinutes: 60,
      };

      const token = generateServiceJwt(options);

      // Verify token can be verified with public key
      expect(() => {
        jwt.verify(token, testKeys.publicKey, {
          algorithms: ['RS256'],
          issuer: testIssuer,
          audience: testAudience,
        });
      }).not.toThrow();
    });

    test('should throw error when private key is missing', () => {
      delete process.env.SERVICE_JWT_PRIVATE_KEY;
      resetConfig();

      const options = {
        serviceId: 'test-service',
        expMinutes: 60,
      };

      expect(() => {
        generateServiceJwt(options);
      }).toThrow('SERVICE_JWT_PRIVATE_KEY');
    });

    test('should throw error when issuer is missing', () => {
      delete process.env.SERVICE_JWT_ISSUER;
      resetConfig();

      const options = {
        serviceId: 'test-service',
        expMinutes: 60,
      };

      expect(() => {
        generateServiceJwt(options);
      }).toThrow('SERVICE_JWT_ISSUER');
    });

    test('should use RS256 algorithm', () => {
      const options = {
        serviceId: 'test-service',
        expMinutes: 60,
      };

      const token = generateServiceJwt(options);
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded.header.alg).toBe('RS256');
    });
  });

  describe('parseArgs', () => {
    test('should parse service ID from first argument', () => {
      process.argv = ['node', 'script.js', 'my-service'];
      const options = parseArgs();

      expect(options.serviceId).toBe('my-service');
    });

    test('should use default service ID if not provided', () => {
      process.argv = ['node', 'script.js'];
      const options = parseArgs();

      expect(options.serviceId).toBe('default-service');
    });

    test('should parse --role option', () => {
      process.argv = ['node', 'script.js', 'my-service', '--role', 'admin'];
      const options = parseArgs();

      expect(options.role).toBe('admin');
    });

    test('should parse --scope option', () => {
      process.argv = ['node', 'script.js', 'my-service', '--scope', 'read,write'];
      const options = parseArgs();

      expect(options.scope).toEqual(['read', 'write']);
    });

    test('should parse --exp option', () => {
      process.argv = ['node', 'script.js', 'my-service', '--exp', '30'];
      const options = parseArgs();

      expect(options.expMinutes).toBe(30);
    });

    test('should use default expMinutes if not provided', () => {
      process.argv = ['node', 'script.js', 'my-service'];
      const options = parseArgs();

      expect(options.expMinutes).toBe(60);
    });
  });
});

