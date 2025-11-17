/**
 * Metrics Module Unit Tests
 * 
 * Tests for src/monitoring/metrics.js
 * Ensures all metrics are properly registered and updated.
 */

const {
  startTimer,
  incrementError,
  incrementServiceRegistration,
  incrementRoutingResult,
  getMetrics,
  resetMetrics,
  httpRequestsTotal,
  httpRequestDuration,
  httpErrorsTotal,
  serviceRegistrationsTotal,
  routingOperationsTotal,
} = require('../src/monitoring/metrics');

describe('Metrics Module', () => {
  beforeEach(() => {
    // Reset metrics before each test
    resetMetrics();
  });

  describe('startTimer', () => {
    test('should return a stopTimer function', () => {
      const stopTimer = startTimer('/test', 'GET');
      expect(typeof stopTimer).toBe('function');
    });

    test('should record request duration and increment request counter', async () => {
      const stopTimer = startTimer('/health', 'GET');
      
      // Simulate some delay
      await new Promise(resolve => setTimeout(resolve, 10));
      
      stopTimer(200);

      // Check that metrics were recorded
      const metrics = await getMetrics();
      expect(metrics).toContain('http_requests_total');
      expect(metrics).toContain('http_request_duration_seconds');
      expect(metrics).toContain('service="coordinator"');
      expect(metrics).toContain('route="/health"');
      expect(metrics).toContain('method="GET"');
      expect(metrics).toContain('status="200"');
    });

    test('should increment error counter for 5xx status codes', async () => {
      const stopTimer = startTimer('/test', 'POST');
      stopTimer(500);

      const metrics = await getMetrics();
      expect(metrics).toContain('http_errors_total');
      expect(metrics).toMatch(/http_errors_total.*status="500"/);
    });

    test('should not increment error counter for 4xx status codes', async () => {
      const stopTimer = startTimer('/test', 'GET');
      stopTimer(404);

      const metrics = await getMetrics();
      // Error counter should not be incremented for 4xx
      const errorMatch = metrics.match(/http_errors_total\{[^}]*status="404"/);
      expect(errorMatch).toBeNull();
    });

    test('should handle missing route and method gracefully', () => {
      const stopTimer = startTimer(null, null);
      expect(() => stopTimer(200)).not.toThrow();
    });
  });

  describe('incrementError', () => {
    test('should increment error counter', async () => {
      incrementError('/test', 'POST', 500);
      
      const metrics = await getMetrics();
      expect(metrics).toContain('http_errors_total');
      expect(metrics).toMatch(/http_errors_total.*route="\/test"/);
      expect(metrics).toMatch(/http_errors_total.*method="POST"/);
      expect(metrics).toMatch(/http_errors_total.*status="500"/);
    });

    test('should handle missing parameters', () => {
      expect(() => incrementError(null, null, null)).not.toThrow();
    });
  });

  describe('incrementServiceRegistration', () => {
    test('should increment registration counter for success', async () => {
      incrementServiceRegistration('success');
      
      const metrics = await getMetrics();
      expect(metrics).toContain('coordinator_service_registrations_total');
      expect(metrics).toMatch(/coordinator_service_registrations_total.*status="success"/);
    });

    test('should increment registration counter for failed', async () => {
      incrementServiceRegistration('failed');
      
      const metrics = await getMetrics();
      expect(metrics).toContain('coordinator_service_registrations_total');
      expect(metrics).toMatch(/coordinator_service_registrations_total.*status="failed"/);
    });

    test('should default to failed for invalid status', async () => {
      incrementServiceRegistration('invalid');
      
      const metrics = await getMetrics();
      expect(metrics).toMatch(/coordinator_service_registrations_total.*status="failed"/);
    });
  });

  describe('incrementRoutingResult', () => {
    test('should increment routing counter for success', async () => {
      incrementRoutingResult('success');
      
      const metrics = await getMetrics();
      expect(metrics).toContain('coordinator_routing_operations_total');
      expect(metrics).toMatch(/coordinator_routing_operations_total.*status="success"/);
    });

    test('should increment routing counter for failed', async () => {
      incrementRoutingResult('failed');
      
      const metrics = await getMetrics();
      expect(metrics).toContain('coordinator_routing_operations_total');
      expect(metrics).toMatch(/coordinator_routing_operations_total.*status="failed"/);
    });
  });

  describe('getMetrics', () => {
    test('should return Prometheus-formatted metrics string', async () => {
      const metrics = await getMetrics();
      
      expect(typeof metrics).toBe('string');
      expect(metrics).toContain('# HELP');
      expect(metrics).toContain('# TYPE');
    });

    test('should include all registered metrics', async () => {
      // Trigger some metrics
      const stopTimer = startTimer('/test', 'GET');
      stopTimer(200);
      incrementServiceRegistration('success');
      incrementRoutingResult('success');

      const metrics = await getMetrics();
      
      expect(metrics).toContain('http_requests_total');
      expect(metrics).toContain('http_request_duration_seconds');
      expect(metrics).toContain('coordinator_service_registrations_total');
      expect(metrics).toContain('coordinator_routing_operations_total');
      expect(metrics).toContain('process_start_time_seconds');
    });
  });

  describe('process_start_time_seconds', () => {
    test('should be included in default metrics', async () => {
      const metrics = await getMetrics();
      expect(metrics).toContain('process_start_time_seconds');
    });
  });

  describe('resetMetrics', () => {
    test('should reset all metrics', async () => {
      // Create some metrics
      const stopTimer = startTimer('/test', 'GET');
      stopTimer(200);
      incrementServiceRegistration('success');

      // Reset
      resetMetrics();

      // Metrics should still be in format but counters should be reset
      const metrics = await getMetrics();
      expect(metrics).toContain('http_requests_total');
      // After reset, the counter should be 0 or not present
      expect(metrics).toContain('# TYPE http_requests_total counter');
    });
  });

  describe('Label combinations', () => {
    test('should handle different route and method combinations', async () => {
      const routes = ['/health', '/register', '/route'];
      const methods = ['GET', 'POST', 'PUT'];

      routes.forEach(route => {
        methods.forEach(method => {
          const stopTimer = startTimer(route, method);
          stopTimer(200);
        });
      });

      const metrics = await getMetrics();
      
      routes.forEach(route => {
        expect(metrics).toContain(`route="${route}"`);
      });
      
      methods.forEach(method => {
        expect(metrics).toContain(`method="${method}"`);
      });
    });
  });
});
