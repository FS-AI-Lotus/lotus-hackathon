/**
 * HTTP Metrics Middleware Tests
 * 
 * Tests for src/monitoring/httpMetricsMiddleware.js
 * Ensures middleware correctly records metrics for HTTP requests.
 */

const express = require('express');
const request = require('supertest');
const httpMetricsMiddleware = require('../src/monitoring/httpMetricsMiddleware');
const { getMetrics, resetMetrics } = require('../src/monitoring/metrics');

describe('HTTP Metrics Middleware', () => {
  let app;

  beforeEach(() => {
    // Reset metrics before each test
    resetMetrics();
    
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use(httpMetricsMiddleware);
  });

  test('should record metrics for successful GET request', async () => {
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    await request(app)
      .get('/health')
      .expect(200);

    const metrics = await getMetrics();
    expect(metrics).toContain('http_requests_total');
    expect(metrics).toMatch(/http_requests_total.*route="\/health"/);
    expect(metrics).toMatch(/http_requests_total.*method="GET"/);
    expect(metrics).toMatch(/http_requests_total.*status="200"/);
    expect(metrics).toContain('http_request_duration_seconds');
  });

  test('should record metrics for POST request', async () => {
    app.post('/register', (req, res) => {
      res.status(201).json({ id: '123' });
    });

    await request(app)
      .post('/register')
      .send({ name: 'test-service' })
      .expect(201);

    const metrics = await getMetrics();
    expect(metrics).toMatch(/http_requests_total.*route="\/register"/);
    expect(metrics).toMatch(/http_requests_total.*method="POST"/);
    expect(metrics).toMatch(/http_requests_total.*status="201"/);
  });

  test('should record error metrics for 5xx status codes', async () => {
    app.get('/error', (req, res) => {
      res.status(500).json({ error: 'Internal server error' });
    });

    await request(app)
      .get('/error')
      .expect(500);

    const metrics = await getMetrics();
    expect(metrics).toContain('http_errors_total');
    expect(metrics).toMatch(/http_errors_total.*status="500"/);
  });

  test('should not record error metrics for 4xx status codes', async () => {
    app.get('/notfound', (req, res) => {
      res.status(404).json({ error: 'Not found' });
    });

    await request(app)
      .get('/notfound')
      .expect(404);

    const metrics = await getMetrics();
    // Error counter should not be incremented for 4xx
    const errorMatch = metrics.match(/http_errors_total\{[^}]*status="404"/);
    expect(errorMatch).toBeNull();
  });

  test('should record request duration', async () => {
    app.get('/slow', (req, res) => {
      setTimeout(() => {
        res.status(200).json({ message: 'delayed response' });
      }, 50);
    });

    await request(app)
      .get('/slow')
      .expect(200);

    const metrics = await getMetrics();
    expect(metrics).toContain('http_request_duration_seconds');
    expect(metrics).toMatch(/http_request_duration_seconds.*route="\/slow"/);
  });

  test('should handle different HTTP methods', async () => {
    app.get('/test', (req, res) => res.status(200).send('GET'));
    app.post('/test', (req, res) => res.status(200).send('POST'));
    app.put('/test', (req, res) => res.status(200).send('PUT'));
    app.delete('/test', (req, res) => res.status(200).send('DELETE'));

    await request(app).get('/test').expect(200);
    await request(app).post('/test').expect(200);
    await request(app).put('/test').expect(200);
    await request(app).delete('/test').expect(200);

    const metrics = await getMetrics();
    expect(metrics).toMatch(/http_requests_total.*method="GET"/);
    expect(metrics).toMatch(/http_requests_total.*method="POST"/);
    expect(metrics).toMatch(/http_requests_total.*method="PUT"/);
    expect(metrics).toMatch(/http_requests_total.*method="DELETE"/);
  });

  test('should handle routes with query parameters', async () => {
    app.get('/search', (req, res) => {
      res.status(200).json({ results: [] });
    });

    await request(app)
      .get('/search?q=test&page=1')
      .expect(200);

    const metrics = await getMetrics();
    // Should record the route path, not the full URL with query
    expect(metrics).toMatch(/http_requests_total.*route="\/search"/);
  });

  test('should work with async route handlers', async () => {
    app.get('/async', async (req, res) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      res.status(200).json({ async: true });
    });

    await request(app)
      .get('/async')
      .expect(200);

    const metrics = await getMetrics();
    expect(metrics).toMatch(/http_requests_total.*route="\/async"/);
    expect(metrics).toMatch(/http_requests_total.*status="200"/);
  });

  test('should record metrics for all status codes', async () => {
    const statusCodes = [200, 201, 400, 401, 403, 404, 500, 502, 503];
    
    statusCodes.forEach((status, index) => {
      app.get(`/status${index}`, (req, res) => {
        res.status(status).json({ status });
      });
    });

    // Make requests for all status codes
    for (let i = 0; i < statusCodes.length; i++) {
      await request(app)
        .get(`/status${i}`)
        .expect(statusCodes[i]);
    }

    const metrics = await getMetrics();
    statusCodes.forEach(status => {
      expect(metrics).toMatch(new RegExp(`http_requests_total.*status="${status}"`));
    });
  });

  test('should not interfere with response', async () => {
    const responseBody = { message: 'test response', data: [1, 2, 3] };
    
    app.get('/response', (req, res) => {
      res.status(200).json(responseBody);
    });

    const response = await request(app)
      .get('/response')
      .expect(200);

    expect(response.body).toEqual(responseBody);
  });
});

