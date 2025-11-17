/**
 * Correlation ID Middleware Tests
 * 
 * Tests for src/middleware/correlationId.js
 * Ensures correlation IDs are generated or read from headers correctly.
 */

const express = require('express');
const request = require('supertest');
const correlationIdMiddleware = require('../src/middleware/correlationId');
const { randomUUID } = require('crypto');

describe('Correlation ID Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(correlationIdMiddleware);
    app.get('/test', (req, res) => {
      res.json({ correlationId: req.correlationId });
    });
  });

  describe('Correlation ID generation', () => {
    test('should generate new correlation ID when header is missing', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body).toHaveProperty('correlationId');
      expect(response.body.correlationId).toBeDefined();
      
      // Should be a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.body.correlationId).toMatch(uuidRegex);
    });

    test('should use correlation ID from X-Request-Id header', async () => {
      const providedId = randomUUID();
      
      const response = await request(app)
        .get('/test')
        .set('X-Request-Id', providedId)
        .expect(200);

      expect(response.body.correlationId).toBe(providedId);
    });

    test('should add correlation ID to response headers', async () => {
      const providedId = randomUUID();
      
      const response = await request(app)
        .get('/test')
        .set('X-Request-Id', providedId)
        .expect(200);

      expect(response.headers['x-request-id']).toBe(providedId);
    });

    test('should generate different IDs for different requests', async () => {
      const response1 = await request(app).get('/test');
      const response2 = await request(app).get('/test');

      expect(response1.body.correlationId).not.toBe(response2.body.correlationId);
    });

    test('should use same ID when header is provided', async () => {
      const providedId = randomUUID();
      
      const response1 = await request(app)
        .get('/test')
        .set('X-Request-Id', providedId);
      
      const response2 = await request(app)
        .get('/test')
        .set('X-Request-Id', providedId);

      expect(response1.body.correlationId).toBe(providedId);
      expect(response2.body.correlationId).toBe(providedId);
    });
  });

  describe('UUID validation', () => {
    test('should generate valid UUIDs', async () => {
      for (let i = 0; i < 10; i++) {
        const response = await request(app).get('/test');
        const correlationId = response.body.correlationId;
        
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(correlationId).toMatch(uuidRegex);
      }
    });
  });
});

