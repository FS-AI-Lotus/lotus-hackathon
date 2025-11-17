/**
 * Validation Schemas Tests
 * 
 * Tests for src/validation/schemas.js and src/validation/index.js
 * Ensures validation schemas correctly validate and reject payloads.
 */

const { registerServiceSchema, routeRequestSchema } = require('../src/validation/schemas');
const { validateRegisterService, validateRouteRequest, formatValidationError } = require('../src/validation/index');
const { ZodError } = require('zod');

describe('Validation Schemas', () => {
  describe('registerServiceSchema', () => {
    test('should accept valid registration payload', () => {
      const payload = {
        name: 'test-service',
        url: 'http://localhost:3001',
      };

      const result = registerServiceSchema.parse(payload);

      expect(result.name).toBe('test-service');
      expect(result.url).toBe('http://localhost:3001');
    });

    test('should accept payload with optional schema field', () => {
      const payload = {
        name: 'test-service',
        url: 'https://example.com',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };

      const result = registerServiceSchema.parse(payload);

      expect(result.schema).toBeDefined();
      expect(result.schema.type).toBe('object');
    });

    test('should trim name and url', () => {
      const payload = {
        name: '  test-service  ',
        url: '  http://localhost:3001  ',
      };

      const result = registerServiceSchema.parse(payload);

      expect(result.name).toBe('test-service');
      expect(result.url).toBe('http://localhost:3001');
    });

    test('should reject missing name', () => {
      const payload = {
        url: 'http://localhost:3001',
      };

      expect(() => {
        registerServiceSchema.parse(payload);
      }).toThrow();
    });

    test('should reject missing url', () => {
      const payload = {
        name: 'test-service',
      };

      expect(() => {
        registerServiceSchema.parse(payload);
      }).toThrow();
    });

    test('should reject empty name', () => {
      const payload = {
        name: '',
        url: 'http://localhost:3001',
      };

      expect(() => {
        registerServiceSchema.parse(payload);
      }).toThrow('at least 1 character');
    });

    test('should reject name longer than 100 characters', () => {
      const payload = {
        name: 'a'.repeat(101),
        url: 'http://localhost:3001',
      };

      expect(() => {
        registerServiceSchema.parse(payload);
      }).toThrow('at most 100 characters');
    });

    test('should reject invalid URL format', () => {
      const payload = {
        name: 'test-service',
        url: 'not-a-url',
      };

      expect(() => {
        registerServiceSchema.parse(payload);
      }).toThrow();
    });

    test('should reject URL without http:// or https://', () => {
      const payload = {
        name: 'test-service',
        url: 'ftp://example.com',
      };

      expect(() => {
        registerServiceSchema.parse(payload);
      }).toThrow('must start with http:// or https://');
    });

    test('should accept https:// URLs', () => {
      const payload = {
        name: 'test-service',
        url: 'https://example.com',
      };

      expect(() => {
        registerServiceSchema.parse(payload);
      }).not.toThrow();
    });

    test('should reject non-string name', () => {
      const payload = {
        name: 123,
        url: 'http://localhost:3001',
      };

      expect(() => {
        registerServiceSchema.parse(payload);
      }).toThrow();
    });

    test('should reject non-string url', () => {
      const payload = {
        name: 'test-service',
        url: 123,
      };

      expect(() => {
        registerServiceSchema.parse(payload);
      }).toThrow();
    });

    test('should reject non-object schema', () => {
      const payload = {
        name: 'test-service',
        url: 'http://localhost:3001',
        schema: 'not-an-object',
      };

      expect(() => {
        registerServiceSchema.parse(payload);
      }).toThrow();
    });
  });

  describe('routeRequestSchema', () => {
    test('should accept valid routing payload', () => {
      const payload = {
        origin: 'client',
        destination: 'service-123',
        data: { key: 'value' },
      };

      const result = routeRequestSchema.parse(payload);

      expect(result.origin).toBe('client');
      expect(result.destination).toBe('service-123');
      expect(result.data).toEqual({ key: 'value' });
    });

    test('should accept payload without data field (defaults to empty object)', () => {
      const payload = {
        origin: 'client',
        destination: 'service-123',
      };

      const result = routeRequestSchema.parse(payload);

      expect(result.data).toEqual({});
    });

    test('should accept payload with metadata', () => {
      const payload = {
        origin: 'client',
        destination: 'service-123',
        data: {},
        metadata: { timestamp: '2024-01-01' },
      };

      const result = routeRequestSchema.parse(payload);

      expect(result.metadata).toEqual({ timestamp: '2024-01-01' });
    });

    test('should trim origin and destination', () => {
      const payload = {
        origin: '  client  ',
        destination: '  service-123  ',
        data: {},
      };

      const result = routeRequestSchema.parse(payload);

      expect(result.origin).toBe('client');
      expect(result.destination).toBe('service-123');
    });

    test('should reject missing origin', () => {
      const payload = {
        destination: 'service-123',
        data: {},
      };

      expect(() => {
        routeRequestSchema.parse(payload);
      }).toThrow();
    });

    test('should reject missing destination', () => {
      const payload = {
        origin: 'client',
        data: {},
      };

      expect(() => {
        routeRequestSchema.parse(payload);
      }).toThrow();
    });

    test('should reject empty origin', () => {
      const payload = {
        origin: '',
        destination: 'service-123',
        data: {},
      };

      expect(() => {
        routeRequestSchema.parse(payload);
      }).toThrow('at least 1 character');
    });

    test('should reject origin longer than 200 characters', () => {
      const payload = {
        origin: 'a'.repeat(201),
        destination: 'service-123',
        data: {},
      };

      expect(() => {
        routeRequestSchema.parse(payload);
      }).toThrow('at most 200 characters');
    });

    test('should reject non-string origin', () => {
      const payload = {
        origin: 123,
        destination: 'service-123',
        data: {},
      };

      expect(() => {
        routeRequestSchema.parse(payload);
      }).toThrow();
    });

    test('should reject non-object data', () => {
      const payload = {
        origin: 'client',
        destination: 'service-123',
        data: 'not-an-object',
      };

      expect(() => {
        routeRequestSchema.parse(payload);
      }).toThrow();
    });

    test('should accept empty data object', () => {
      const payload = {
        origin: 'client',
        destination: 'service-123',
        data: {},
      };

      expect(() => {
        routeRequestSchema.parse(payload);
      }).not.toThrow();
    });
  });
});

describe('Validation Helpers', () => {
  describe('validateRegisterService', () => {
    test('should return validated payload for valid input', () => {
      const payload = {
        name: 'test-service',
        url: 'http://localhost:3001',
      };

      const result = validateRegisterService(payload);

      expect(result.name).toBe('test-service');
      expect(result.url).toBe('http://localhost:3001');
    });

    test('should throw ValidationError for invalid input', () => {
      const payload = {
        name: '',
        url: 'http://localhost:3001',
      };

      expect(() => {
        validateRegisterService(payload);
      }).toThrow('Invalid registration payload');
    });

    test('should include error details', () => {
      const payload = {
        name: '',
        url: 'http://localhost:3001',
      };

      try {
        validateRegisterService(payload);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.details).toBeDefined();
        expect(Array.isArray(error.details)).toBe(true);
      }
    });
  });

  describe('validateRouteRequest', () => {
    test('should return validated payload for valid input', () => {
      const payload = {
        origin: 'client',
        destination: 'service-123',
        data: { key: 'value' },
      };

      const result = validateRouteRequest(payload);

      expect(result.origin).toBe('client');
      expect(result.destination).toBe('service-123');
    });

    test('should throw ValidationError for invalid input', () => {
      const payload = {
        origin: '',
        destination: 'service-123',
      };

      expect(() => {
        validateRouteRequest(payload);
      }).toThrow('Invalid routing payload');
    });

    test('should include error details', () => {
      const payload = {
        origin: '',
        destination: 'service-123',
      };

      try {
        validateRouteRequest(payload);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.details).toBeDefined();
      }
    });
  });

  describe('formatValidationError', () => {
    test('should format ZodError correctly', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number',
        },
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['url'],
          message: 'Required',
        },
      ]);

      const formatted = formatValidationError(zodError);

      expect(formatted).toContain('name:');
      expect(formatted).toContain('url:');
    });

    test('should handle non-ZodError', () => {
      const error = new Error('Some error');

      const formatted = formatValidationError(error);

      expect(formatted).toBe('Some error');
    });
  });
});

