/**
 * Health Endpoint Tests
 * 
 * Tests for the Coordinator service health endpoint.
 * Uses the test coordinator (test-server.js) for integration testing.
 */

const request = require('supertest');
const app = require('../test-server');

describe('Health Endpoint', () => {
  test('GET /health returns 200 status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.status).toBe(200);
  });

  test('GET /health returns expected response shape', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body).toBeDefined();
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('service');
    expect(response.body).toHaveProperty('uptime');
    expect(typeof response.body.uptime).toBe('number');
  });

  test('GET /health includes registered services count', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('registeredServices');
    expect(typeof response.body.registeredServices).toBe('number');
  });
});

