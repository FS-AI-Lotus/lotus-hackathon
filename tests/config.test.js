/**
 * Config Module Tests
 * 
 * Tests for src/config/index.js
 * Ensures environment variable validation and config object creation work correctly.
 */

const { getConfig, validateEnv, resetConfig } = require('../src/config/index');

describe('Config Module', () => {
  // Save original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset config instance
    resetConfig();
    // Clear all env vars
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('SERVICE_JWT_') || key === 'PORT' || key === 'NODE_ENV' || 
          key === 'COORDINATOR_HOST' || key === 'METRICS_PORT' || key === 'SKIP_ENV_VALIDATION') {
        delete process.env[key];
      }
    });
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe('validateEnv', () => {
    test('should throw error when required env vars are missing in production', () => {
      process.env.NODE_ENV = 'production';
      
      expect(() => {
        validateEnv('production');
      }).toThrow('Missing required environment variables for production environment');
    });

    test('should throw error when required env vars are missing in development', () => {
      process.env.NODE_ENV = 'development';
      
      expect(() => {
        validateEnv('development');
      }).toThrow('Missing required environment variables for development environment');
    });

    test('should not throw error in test environment', () => {
      process.env.NODE_ENV = 'test';
      
      expect(() => {
        validateEnv('test');
      }).not.toThrow();
    });

    test('should throw error with list of missing variables', () => {
      process.env.NODE_ENV = 'production';
      
      try {
        validateEnv('production');
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('SERVICE_JWT_PUBLIC_KEY');
        expect(error.message).toContain('SERVICE_JWT_ISSUER');
      }
    });

    test('should not throw when all required vars are present', () => {
      process.env.NODE_ENV = 'production';
      process.env.SERVICE_JWT_PUBLIC_KEY = 'test-public-key';
      process.env.SERVICE_JWT_ISSUER = 'test-issuer';
      
      expect(() => {
        validateEnv('production');
      }).not.toThrow();
    });

    test('should throw when env var is empty string', () => {
      process.env.NODE_ENV = 'production';
      process.env.SERVICE_JWT_PUBLIC_KEY = '   ';
      process.env.SERVICE_JWT_ISSUER = 'test-issuer';
      
      expect(() => {
        validateEnv('production');
      }).toThrow();
    });
  });

  describe('getConfig', () => {
    test('should return config object with default values', () => {
      process.env.NODE_ENV = 'test';
      process.env.SKIP_ENV_VALIDATION = 'true';
      
      const config = getConfig('test');
      
      expect(config).toHaveProperty('port', 3000);
      expect(config).toHaveProperty('nodeEnv', 'test');
      expect(config).toHaveProperty('jwt');
      expect(config).toHaveProperty('monitoring');
    });

    test('should use PORT from environment', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '8080';
      process.env.SKIP_ENV_VALIDATION = 'true';
      
      const config = getConfig('test');
      
      expect(config.port).toBe(8080);
    });

    test('should throw error for invalid PORT', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = 'invalid';
      process.env.SKIP_ENV_VALIDATION = 'true';
      
      expect(() => {
        getConfig('test');
      }).toThrow('Invalid PORT value');
    });

    test('should throw error for PORT out of range', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '70000';
      process.env.SKIP_ENV_VALIDATION = 'true';
      
      expect(() => {
        getConfig('test');
      }).toThrow('Invalid PORT value');
    });

    test('should include JWT configuration', () => {
      process.env.NODE_ENV = 'test';
      process.env.SERVICE_JWT_PUBLIC_KEY = 'test-public-key';
      process.env.SERVICE_JWT_ISSUER = 'test-issuer';
      process.env.SERVICE_JWT_AUDIENCE = 'test-audience';
      process.env.SKIP_ENV_VALIDATION = 'true';
      
      const config = getConfig('test');
      
      expect(config.jwt).toEqual({
        privateKey: null,
        publicKey: 'test-public-key',
        issuer: 'test-issuer',
        audience: 'test-audience',
      });
    });

    test('should include monitoring configuration', () => {
      process.env.NODE_ENV = 'test';
      process.env.COORDINATOR_HOST = 'coordinator:3000';
      process.env.METRICS_PORT = '9090';
      process.env.SKIP_ENV_VALIDATION = 'true';
      
      const config = getConfig('test');
      
      expect(config.monitoring).toEqual({
        coordinatorHost: 'coordinator:3000',
        metricsPort: 9090,
      });
    });

    test('should use default COORDINATOR_HOST if not set', () => {
      process.env.NODE_ENV = 'test';
      process.env.SKIP_ENV_VALIDATION = 'true';
      
      const config = getConfig('test');
      
      expect(config.monitoring.coordinatorHost).toBe('localhost:3000');
    });

    test('should set metricsPort to null if METRICS_PORT not set', () => {
      process.env.NODE_ENV = 'test';
      process.env.SKIP_ENV_VALIDATION = 'true';
      
      const config = getConfig('test');
      
      expect(config.monitoring.metricsPort).toBeNull();
    });

    test('should throw error for invalid METRICS_PORT', () => {
      process.env.NODE_ENV = 'test';
      process.env.METRICS_PORT = 'invalid';
      process.env.SKIP_ENV_VALIDATION = 'true';
      
      expect(() => {
        getConfig('test');
      }).toThrow('Invalid METRICS_PORT value');
    });

    test('should validate required env vars in production', () => {
      process.env.NODE_ENV = 'production';
      // Missing required vars
      
      expect(() => {
        getConfig('production');
      }).toThrow();
    });

    test('should not validate in test if SKIP_ENV_VALIDATION is set', () => {
      process.env.NODE_ENV = 'test';
      process.env.SKIP_ENV_VALIDATION = 'true';
      
      expect(() => {
        getConfig('test');
      }).not.toThrow();
    });
  });

  describe('config singleton', () => {
    test('should return same instance on multiple calls', () => {
      process.env.NODE_ENV = 'test';
      process.env.SKIP_ENV_VALIDATION = 'true';
      
      const { config } = require('../src/config/index');
      
      const config1 = config();
      const config2 = config();
      
      expect(config1).toBe(config2);
    });

    test('should reset with resetConfig', () => {
      process.env.NODE_ENV = 'test';
      process.env.SKIP_ENV_VALIDATION = 'true';
      
      const { config, resetConfig: reset } = require('../src/config/index');
      
      const config1 = config();
      reset();
      const config2 = config();
      
      // Should be different instances (but same values)
      expect(config1).not.toBe(config2);
    });
  });
});

