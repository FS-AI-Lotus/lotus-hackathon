# Centralized Audit Logging & Correlation IDs

## Overview

The Coordinator service implements structured logging with correlation IDs for request tracing and audit logging for critical security and business events.

## Logger Module (`src/logger.js`)

The logger uses Winston with custom log levels for security and audit events.

### Log Levels

- **error**: Critical errors that require immediate attention
- **warn**: Warning messages for potential issues
- **info**: General informational messages
- **security**: Security events (auth failures, attacks, rate limits)
- **audit**: Important business/security actions (registrations, routing, schema changes)

### Log Format

All logs are structured JSON with the following fields:

```json
{
  "timestamp": "2024-01-15 10:30:45.123",
  "level": "audit",
  "service": "coordinator",
  "route": "/register",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "serviceId": "test-service",
  "message": "Service registered successfully: my-service",
  "registeredService": {
    "id": "service-123",
    "name": "my-service",
    "url": "http://localhost:3001"
  }
}
```

### Usage

```javascript
const { info, warn, error, security, audit } = require('./src/logger');

// Info log
info({ req, key: 'value' }, 'Informational message');

// Warning log
warn({ req, reason: 'low_memory' }, 'Memory usage is high');

// Error log
error({ req, error: err }, 'An error occurred');

// Security log
security({ req, reason: 'auth_failure' }, 'Authentication failed');

// Audit log
audit({ req, serviceId: 'test-service', action: 'register' }, 'Service registered');
```

### Request Context

When a request object (`req`) is provided in metadata, the logger automatically extracts:
- `correlationId`: Request correlation ID
- `serviceId`: Service ID from JWT (if available)
- `route`: HTTP route path
- `method`: HTTP method
- `ip`: Client IP address

### Sensitive Data Filtering

The logger automatically filters out sensitive information:
- `password`
- `token`
- `authorization`
- `privateKey`

## Correlation ID Middleware (`src/middleware/correlationId.js`)

The correlation ID middleware generates or reads correlation IDs for request tracing.

### Features

- Reads `X-Request-Id` header if present
- Generates new UUID if header is missing
- Attaches correlation ID to `req.correlationId`
- Adds correlation ID to response headers (`X-Request-Id`)

### Usage

```javascript
const correlationIdMiddleware = require('./src/middleware/correlationId');

app.use(correlationIdMiddleware);
```

### Example

```bash
# Request with correlation ID
curl -H "X-Request-Id: my-correlation-id" http://localhost:3000/register

# Response includes correlation ID
X-Request-Id: my-correlation-id
```

## Audit Logging

### Service Registrations

**Success:**
```javascript
audit({ req, serviceId, registeredService: { id, name, url } }, 
  `Service registered successfully: ${name}`);
```

**Failure:**
```javascript
audit({ req, error: err }, `Service registration failed: ${err.message}`);
```

### Schema Changes

When a service schema is updated:
```javascript
audit({ 
  req, 
  serviceId, 
  registeredService: { id, name },
  oldSchema: '...',
  newSchema: '...',
}, 
`Schema updated for service: ${name}`);
```

### Routing Operations

**Success:**
```javascript
audit({ 
  req, 
  serviceId, 
  origin, 
  destination,
  dataSize 
}, 
`Data routed successfully from ${origin} to ${destination}`);
```

**Failure:**
```javascript
audit({ req, serviceId, destination }, 
  `Routing failed: destination service not found: ${destination}`);
```

## Security Logging

### Authentication Failures

All authentication failures are logged with the `security` level:

```javascript
security({ req, reason: 'missing_authorization_header' }, 
  'Authentication failed: Missing Authorization header');

security({ req, reason: 'invalid_token', errorType: 'JsonWebTokenError' }, 
  'Authentication failed: Invalid token');

security({ req, reason: 'token_expired' }, 
  'Authentication failed: Token has expired');
```

### Rate Limiting

When rate limits are exceeded:
```javascript
security({ 
  req, 
  reason: 'rate_limit_exceeded',
  limit: 10,
  windowMs: 900000,
  identifier: 'service-id-or-ip'
}, 
`Rate limit exceeded: ${identifier} exceeded limit of ${limit} requests per ${window}s`);
```

### Injection Attempts

**SQL Injection:**
```javascript
security({ req, reason: 'sql_injection_attempt', input: '...' }, 
  'SQL injection attempt detected in request body');
```

**Prompt Injection:**
```javascript
security({ req, reason: 'prompt_injection_attempt', input: '...' }, 
  'Prompt injection attempt detected in request body');
```

## Configuration

### Environment Variables

- `LOG_LEVEL`: Minimum log level (default: `info`)
  - Options: `error`, `warn`, `info`, `security`, `audit`

### Example

```bash
LOG_LEVEL=audit node test-server.js
```

## Best Practices

1. **Always include `req` in metadata** for automatic context extraction
2. **Use appropriate log levels**:
   - `audit` for business-critical actions
   - `security` for security events
   - `error` for errors that need attention
   - `warn` for potential issues
   - `info` for general information
3. **Never log sensitive data** - the logger filters common sensitive fields, but be careful with custom fields
4. **Use correlation IDs** - always include `req` to get automatic correlation ID tracking
5. **Structured metadata** - use objects for metadata to enable easy filtering and searching

## Log Analysis

Logs are structured JSON, making them easy to parse and analyze:

```bash
# Filter security events
cat logs/app.log | jq 'select(.level == "security")'

# Find all events for a specific correlation ID
cat logs/app.log | jq 'select(.correlationId == "550e8400-...")'

# Find all audit events for service registrations
cat logs/app.log | jq 'select(.level == "audit" and .message | contains("registered"))'
```

## Integration with Monitoring

Logs can be integrated with monitoring systems:
- **Prometheus**: Extract metrics from logs (e.g., count of security events)
- **Grafana**: Visualize log patterns and trends
- **ELK Stack**: Centralized log aggregation and analysis
- **Alertmanager**: Trigger alerts based on log patterns

