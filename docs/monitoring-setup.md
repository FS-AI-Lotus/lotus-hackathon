# Monitoring Setup - Prometheus Metrics

This document describes the Prometheus metrics implementation for the Coordinator service.

## Overview

The monitoring system uses `prom-client` to expose Prometheus-formatted metrics via a `/metrics` endpoint. Metrics are automatically collected via HTTP middleware and can also be manually incremented for business events.

## Metrics Exposed

### HTTP Metrics

- **`http_requests_total`**: Total number of HTTP requests
  - Labels: `service`, `route`, `method`, `status`
  - Example: `http_requests_total{service="coordinator",route="/health",method="GET",status="200"} 42`

- **`http_request_duration_seconds`**: Request duration histogram (for p95 latency)
  - Labels: `service`, `route`, `method`
  - Buckets: 0.1s, 0.5s, 1s, 2s, 5s, 10s
  - Example: `http_request_duration_seconds_bucket{le="0.5",service="coordinator",route="/health",method="GET"} 38`

- **`http_errors_total`**: Total number of HTTP errors (5xx status codes)
  - Labels: `service`, `route`, `method`, `status`
  - Example: `http_errors_total{service="coordinator",route="/error",method="GET",status="500"} 3`

### Business Metrics

- **`coordinator_service_registrations_total`**: Service registration counter
  - Labels: `status` ("success" or "failed")
  - Example: `coordinator_service_registrations_total{status="success"} 15`

- **`coordinator_routing_operations_total`**: Routing operation counter
  - Labels: `status` ("success" or "failed")
  - Example: `coordinator_routing_operations_total{status="success"} 120`

### System Metrics

- **`process_start_time_seconds`**: Process start time (from default metrics)
  - Used for calculating uptime
  - Example: `process_start_time_seconds 1763374340`

Additional default metrics are also exposed (CPU, memory, event loop lag, etc.) via `collectDefaultMetrics()`.

## Usage

### 1. HTTP Metrics Middleware

Add the middleware to your Express app to automatically record HTTP metrics:

```javascript
const express = require('express');
const httpMetricsMiddleware = require('./src/monitoring/httpMetricsMiddleware');

const app = express();

// Add metrics middleware early in the stack
app.use(httpMetricsMiddleware);

// Your routes...
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
```

### 2. Metrics Endpoint

Add the `/metrics` endpoint to expose Prometheus metrics:

```javascript
const metricsEndpoint = require('./src/monitoring/metricsEndpoint');

app.get('/metrics', metricsEndpoint);
```

### 3. Business Metrics

Manually increment business metrics:

```javascript
const {
  incrementServiceRegistration,
  incrementRoutingResult,
} = require('./src/monitoring/metrics');

// On successful service registration
incrementServiceRegistration('success');

// On failed service registration
incrementServiceRegistration('failed');

// On successful routing
incrementRoutingResult('success');

// On failed routing
incrementRoutingResult('failed');
```

### 4. Manual Error Tracking

If you need to manually track errors:

```javascript
const { incrementError } = require('./src/monitoring/metrics');

incrementError('/custom-route', 'POST', 500);
```

## Integration with Coordinator

Once the Coordinator service is available, integrate the monitoring as follows:

1. **Add middleware to Coordinator app:**
   ```javascript
   // In coordinator/app.js or coordinator/server.js
   const httpMetricsMiddleware = require('../src/monitoring/httpMetricsMiddleware');
   app.use(httpMetricsMiddleware);
   ```

2. **Add metrics endpoint:**
   ```javascript
   const metricsEndpoint = require('../src/monitoring/metricsEndpoint');
   app.get('/metrics', metricsEndpoint);
   ```

3. **Add business metrics to route handlers:**
   ```javascript
   const { incrementServiceRegistration } = require('../src/monitoring/metrics');
   
   app.post('/register', async (req, res) => {
     try {
       // Registration logic...
       incrementServiceRegistration('success');
       res.status(201).json({ id: serviceId });
     } catch (error) {
       incrementServiceRegistration('failed');
       res.status(500).json({ error: error.message });
     }
   });
   ```

## Prometheus Configuration

Example Prometheus `scrape_configs` for scraping Coordinator metrics:

```yaml
scrape_configs:
  - job_name: 'coordinator'
    scrape_interval: 15s
    static_configs:
      - targets: ['coordinator:3000']  # Update with actual host:port
        labels:
          service: 'coordinator'
```

**Note**: The actual hostname and port will be configured by Team 1 (Terraform/Infrastructure) or via environment variables.

## Testing

All metrics functionality is covered by comprehensive tests:

```bash
# Run all metrics tests
npm test -- tests/metrics

# Run specific test suites
npm test -- tests/metrics.unit.test.js
npm test -- tests/metrics.middleware.test.js
npm test -- tests/metrics.endpoint.test.js
```

## Files

- `src/monitoring/metrics.js` - Core metrics module
- `src/monitoring/httpMetricsMiddleware.js` - Express middleware for HTTP metrics
- `src/monitoring/metricsEndpoint.js` - `/metrics` endpoint handler
- `tests/metrics.unit.test.js` - Unit tests for metrics module
- `tests/metrics.middleware.test.js` - Tests for HTTP middleware
- `tests/metrics.endpoint.test.js` - Tests for `/metrics` endpoint

## Next Steps

- **Iteration 6**: Create Prometheus config and Grafana dashboards
- **Integration**: Wire monitoring into Coordinator service once available

