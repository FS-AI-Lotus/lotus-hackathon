/**
 * Metrics Endpoint Tests
 * 
 * Tests for src/monitoring/metricsEndpoint.js
 * Ensures /metrics endpoint returns Prometheus-formatted metrics.
 */

const express = require('express');
const request = require('supertest');
const metricsEndpoint = require('../src/monitoring/metricsEndpoint');
const { startTimer, incrementServiceRegistration, incrementRoutingResult, resetMetrics } = require('../src/monitoring/metrics');

describe('Metrics Endpoint', () => {
  let app;

  beforeEach(() => {
    resetMetrics();
    app = express();
    app.get('/metrics', metricsEndpoint);
  });

  test('GET /metrics returns 200 status', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect(200);
    
    expect(response.status).toBe(200);
  });

  test('GET /metrics returns Prometheus format', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect(200)
      .expect('Content-Type', /text\/plain/);
    
    const text = response.text;
    expect(text).toContain('# HELP');
    expect(text).toContain('# TYPE');
  });

  test('GET /metrics includes expected metric names', async () => {
    // Generate some metrics
    const stopTimer = startTimer('/test', 'GET');
    stopTimer(200);
    incrementServiceRegistration('success');
    incrementRoutingResult('success');

    const response = await request(app)
      .get('/metrics')
      .expect(200);
    
    const text = response.text;
    
    // Check for required metrics
    expect(text).toMatch(/http_requests_total/);
    expect(text).toMatch(/http_request_duration_seconds/);
    expect(text).toMatch(/coordinator_service_registrations_total/);
    expect(text).toMatch(/coordinator_routing_operations_total/);
    expect(text).toMatch(/process_start_time_seconds/);
  });

  test('GET /metrics includes correct Content-Type header', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect(200);
    
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.headers['content-type']).toContain('version=0.0.4');
  });

  test('GET /metrics returns valid Prometheus format structure', async () => {
    // Generate metrics with known values
    const stopTimer1 = startTimer('/health', 'GET');
    stopTimer1(200);
    
    const stopTimer2 = startTimer('/register', 'POST');
    stopTimer2(201);

    const response = await request(app)
      .get('/metrics')
      .expect(200);
    
    const text = response.text;
    
    // Should have HELP and TYPE for each metric
    expect(text).toMatch(/# HELP http_requests_total/);
    expect(text).toMatch(/# TYPE http_requests_total counter/);
    expect(text).toMatch(/# HELP http_request_duration_seconds/);
    expect(text).toMatch(/# TYPE http_request_duration_seconds histogram/);
    
    // Should have metric values
    expect(text).toMatch(/http_requests_total\{/);
    // Histograms have bucket format, not direct metric format
    expect(text).toMatch(/http_request_duration_seconds_bucket/);
  });

  test('GET /metrics includes labels correctly', async () => {
    const stopTimer = startTimer('/test', 'POST');
    stopTimer(200);

    const response = await request(app)
      .get('/metrics')
      .expect(200);
    
    const text = response.text;
    
    // Check for service label
    expect(text).toMatch(/service="coordinator"/);
    // Check for route label
    expect(text).toMatch(/route="\/test"/);
    // Check for method label
    expect(text).toMatch(/method="POST"/);
    // Check for status label
    expect(text).toMatch(/status="200"/);
  });

  test('GET /metrics includes default metrics', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect(200);
    
    const text = response.text;
    
    // Default metrics from collectDefaultMetrics
    expect(text).toMatch(/process_cpu_user_seconds_total/);
    expect(text).toMatch(/process_resident_memory_bytes/);
  });

  test('GET /metrics handles empty metrics gracefully', async () => {
    // Reset all metrics
    resetMetrics();
    
    const response = await request(app)
      .get('/metrics')
      .expect(200);
    
    // Should still return valid Prometheus format
    const text = response.text;
    expect(text).toContain('# HELP');
    expect(text).toContain('# TYPE');
  });

  test('GET /metrics is parseable as Prometheus format', async () => {
    // Generate various metrics
    const stopTimer1 = startTimer('/health', 'GET');
    stopTimer1(200);
    
    const stopTimer2 = startTimer('/register', 'POST');
    stopTimer2(201);
    
    const stopTimer3 = startTimer('/error', 'GET');
    stopTimer3(500);

    incrementServiceRegistration('success');
    incrementServiceRegistration('failed');
    incrementRoutingResult('success');

    const response = await request(app)
      .get('/metrics')
      .expect(200);
    
    const text = response.text;
    
    // Basic Prometheus format validation
    // Each line should be either:
    // - Comment (# HELP or # TYPE)
    // - Empty line
    // - Metric line (metric_name{labels} value)
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.startsWith('#')) {
        // Comment line
        expect(line).toMatch(/^# (HELP|TYPE)/);
      } else {
        // Metric line - should have format: name{labels} value
        // Value can be a number, NaN, or +Inf
        expect(line).toMatch(/^[a-zA-Z_:][a-zA-Z0-9_:]*(\{[^}]*\})? ([\d.]+|Nan|NaN|\+Inf|-Inf)/);
      }
    });
  });
});

