/**
 * Rate Limiter Tests
 * 
 * Tests for rate limiting middleware.
 * Ensures rate limits are enforced correctly.
 */

const express = require('express');
const request = require('supertest');
const { createRateLimiter } = require('../src/security/rateLimiter');

describe('Rate Limiter', () => {
  describe('strictRateLimiter', () => {
    let app;
    let testRateLimiter;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      
      // Create a test rate limiter with consistent key for testing
      testRateLimiter = createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10,
        message: 'Too many registration requests. Please try again in 15 minutes.',
        keyGenerator: () => 'test-client', // Use consistent key for testing
      });
      
      app.post('/register', testRateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    test('should allow requests within limit', async () => {
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/register')
          .send({ test: 'data' })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      }
    });

    test('should reject requests exceeding limit', async () => {
      // Make 10 requests (at limit) - need to await each
      for (let i = 0; i < 10; i++) {
        await request(app).post('/register').send({ test: 'data' }).expect(200);
      }

      // 11th request should be rate limited
      const response = await request(app)
        .post('/register')
        .send({ test: 'data' })
        .expect(429);

      expect(response.body).toHaveProperty('error', 'Too Many Requests');
      expect(response.body).toHaveProperty('retryAfter');
    });

    test('should include retryAfter in response', async () => {
      // Exceed limit
      for (let i = 0; i < 11; i++) {
        await request(app).post('/register').send({ test: 'data' });
      }

      const response = await request(app)
        .post('/register')
        .send({ test: 'data' })
        .expect(429);

      expect(response.body.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('moderateRateLimiter', () => {
    let app;
    let testRateLimiter;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      
      // Create a test rate limiter with consistent key for testing
      testRateLimiter = createRateLimiter({
        windowMs: 60 * 1000, // 1 minute
        max: 100,
        message: 'Too many routing requests. Please try again in a minute.',
        keyGenerator: () => 'test-client', // Use consistent key for testing
      });
      
      app.post('/route', testRateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    test('should allow requests within limit', async () => {
      for (let i = 0; i < 100; i++) {
        const response = await request(app)
          .post('/route')
          .send({ test: 'data' })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      }
    });

    test('should reject requests exceeding limit', async () => {
      // Make 100 requests (at limit) - need to await each
      for (let i = 0; i < 100; i++) {
        await request(app).post('/route').send({ test: 'data' }).expect(200);
      }

      // 101st request should be rate limited
      const response = await request(app)
        .post('/route')
        .send({ test: 'data' })
        .expect(429);

      expect(response.body).toHaveProperty('error', 'Too Many Requests');
    });
  });

  describe('generalRateLimiter', () => {
    let app;
    let testRateLimiter;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      
      // Create a test rate limiter with consistent key for testing
      testRateLimiter = createRateLimiter({
        windowMs: 60 * 1000, // 1 minute
        max: 200,
        message: 'Too many requests. Please try again in a minute.',
        keyGenerator: () => 'test-client', // Use consistent key for testing
      });
      
      app.post('/other', testRateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    test('should allow requests within limit', async () => {
      for (let i = 0; i < 200; i++) {
        const response = await request(app)
          .post('/other')
          .send({ test: 'data' })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      }
    });

    test('should reject requests exceeding limit', async () => {
      // Make 200 requests (at limit) - need to await each
      for (let i = 0; i < 200; i++) {
        await request(app).post('/other').send({ test: 'data' }).expect(200);
      }

      // 201st request should be rate limited
      const response = await request(app)
        .post('/other')
        .send({ test: 'data' })
        .expect(429);

      expect(response.body).toHaveProperty('error', 'Too Many Requests');
    });
  });
});

