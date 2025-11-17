/**
 * Prometheus Metrics Module
 * 
 * This module provides Prometheus metrics instrumentation for the Coordinator service.
 * Uses prom-client to expose metrics in Prometheus format.
 * 
 * Metrics exposed:
 * - http_requests_total: Total HTTP requests with labels (service, route, method, status)
 * - http_request_duration_seconds: Request duration histogram for p95 latency
 * - http_errors_total: Total HTTP errors (5xx status codes)
 * - process_start_time_seconds: Process start time for uptime calculation
 * - coordinator_service_registrations_total: Service registration counter
 * - coordinator_routing_operations_total: Routing operation counter
 */

const client = require('prom-client');

// Create a shared registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Service name constant
const SERVICE_NAME = 'coordinator';

/**
 * HTTP Requests Counter
 * Tracks total number of HTTP requests
 */
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['service', 'route', 'method', 'status'],
  registers: [register],
});

/**
 * HTTP Request Duration Histogram
 * Tracks request latency for p95 calculations
 */
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['service', 'route', 'method'],
  buckets: [0.1, 0.5, 1, 2, 5, 10], // Buckets in seconds
  registers: [register],
});

/**
 * HTTP Errors Counter
 * Tracks total number of HTTP errors (5xx status codes)
 */
const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors (5xx status codes)',
  labelNames: ['service', 'route', 'method', 'status'],
  registers: [register],
});

/**
 * Process Start Time
 * Note: process_start_time_seconds is already included in default metrics
 * from collectDefaultMetrics(). We don't need to create it separately.
 */

/**
 * Service Registrations Counter
 * Tracks successful and failed service registrations
 */
const serviceRegistrationsTotal = new client.Counter({
  name: 'coordinator_service_registrations_total',
  help: 'Total number of service registrations',
  labelNames: ['status'], // 'success' or 'failed'
  registers: [register],
});

/**
 * Routing Operations Counter
 * Tracks successful and failed routing operations
 */
const routingOperationsTotal = new client.Counter({
  name: 'coordinator_routing_operations_total',
  help: 'Total number of routing operations',
  labelNames: ['status'], // 'success' or 'failed'
  registers: [register],
});

/**
 * Start a timer for request duration measurement
 * @param {string} route - The route path (e.g., '/register', '/route')
 * @param {string} method - HTTP method (e.g., 'GET', 'POST')
 * @returns {Function} A function to call when the request completes: stopTimer(statusCode)
 */
function startTimer(route, method) {
  const labels = {
    service: SERVICE_NAME,
    route: route || 'unknown',
    method: method || 'unknown',
  };

  const end = httpRequestDuration.startTimer(labels);

  return function stopTimer(statusCode) {
    end();
    
    // Increment request counter
    httpRequestsTotal.inc({
      ...labels,
      status: statusCode || 'unknown',
    });

    // Increment error counter if status is 5xx
    if (statusCode >= 500 && statusCode < 600) {
      httpErrorsTotal.inc({
        ...labels,
        status: statusCode,
      });
    }
  };
}

/**
 * Increment error counter manually (if needed)
 * @param {string} route - The route path
 * @param {string} method - HTTP method
 * @param {number} statusCode - HTTP status code
 */
function incrementError(route, method, statusCode) {
  httpErrorsTotal.inc({
    service: SERVICE_NAME,
    route: route || 'unknown',
    method: method || 'unknown',
    status: statusCode || 'unknown',
  });
}

/**
 * Increment service registration counter
 * @param {string} status - 'success' or 'failed'
 */
function incrementServiceRegistration(status) {
  serviceRegistrationsTotal.inc({
    status: status === 'success' ? 'success' : 'failed',
  });
}

/**
 * Increment routing operation counter
 * @param {string} status - 'success' or 'failed'
 */
function incrementRoutingResult(status) {
  routingOperationsTotal.inc({
    status: status === 'success' ? 'success' : 'failed',
  });
}

/**
 * Get metrics in Prometheus text format
 * @returns {Promise<string>} Prometheus-formatted metrics string
 */
async function getMetrics() {
  return register.metrics();
}

/**
 * Reset all metrics (useful for testing)
 */
function resetMetrics() {
  register.resetMetrics();
}

module.exports = {
  register,
  startTimer,
  incrementError,
  incrementServiceRegistration,
  incrementRoutingResult,
  getMetrics,
  resetMetrics,
  // Expose metrics for testing
  httpRequestsTotal,
  httpRequestDuration,
  httpErrorsTotal,
  serviceRegistrationsTotal,
  routingOperationsTotal,
};

