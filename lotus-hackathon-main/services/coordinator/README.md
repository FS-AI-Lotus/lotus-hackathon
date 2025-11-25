# Coordinator Microservice

A Node.js/Express-based microservice that acts as a central registry and configuration hub for other microservices in the distributed system.

## Features

- ✅ Service Registration (`POST /register`)
- ✅ UI/UX Configuration Management (`GET /uiux`, `POST /uiux`)
- ✅ Service Discovery (`GET /services`, `GET /registry`)
- ✅ Health Check (`GET /health`)
- ✅ Prometheus Metrics (`GET /metrics`)
- ✅ Structured Logging (Winston)
- ✅ Request Validation
- ✅ Error Handling

## Quick Start

### Prerequisites

- Node.js v18 or higher
- npm or yarn

### Installation

```bash
cd services/coordinator
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### Running the Service

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The service will start on `http://localhost:3000` (or the port specified in `.env`).

## API Documentation

### 1. AI-Based Routing (NEW!)

**Endpoint:** `POST /route` or `GET /route?q=<query>`

**Purpose:** Intelligently route requests to the appropriate microservice using OpenAI.

**Request Body (POST):**
```json
{
  "query": "I need to get user profile information",
  "method": "GET",
  "path": "/api/users/123",
  "body": {}
}
```

**Query Parameters (GET):**
- `q` or `query` or `intent` - The user's query/intent

**Response:**
```json
{
  "success": true,
  "routing": {
    "serviceName": "user-service",
    "confidence": 0.95,
    "reasoning": "The query is about user profiles, which matches the user-service",
    "service": {
      "endpoint": "http://localhost:3001",
      "version": "1.0.0",
      "status": "active"
    }
  }
}
```

**Setup:** See [OPENAI_SETUP.md](./OPENAI_SETUP.md) for OpenAI API configuration.

**Note:** Falls back to rule-based routing if OpenAI is unavailable.

### 2. Service Registration

**Endpoint:** `POST /register`

**Purpose:** Register a new microservice with the Coordinator.

**Request Body:**
```json
{
  "serviceName": "user-service",
  "version": "1.0.0",
  "endpoint": "http://user-service:3001",
  "healthCheck": "/health",
  "migrationFile": {
    "schema": "v1",
    "tables": ["users", "profiles"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Service registered successfully",
  "serviceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["serviceName is required and must be a non-empty string"]
}
```

### 3. UI/UX Configuration

#### Upload/Update Configuration

**Endpoint:** `POST /uiux`

**Request Body:**
```json
{
  "config": {
    "theme": {
      "primaryColor": "#007bff",
      "secondaryColor": "#6c757d"
    },
    "components": {
      "button": {
        "style": "rounded",
        "size": "medium"
      }
    },
    "layouts": {
      "sidebar": true,
      "header": true
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "UI/UX configuration updated successfully",
  "version": 1,
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

#### Retrieve Configuration

**Endpoint:** `GET /uiux`

**Response:**
```json
{
  "success": true,
  "config": {
    "theme": { ... },
    "components": { ... },
    "layouts": { ... }
  },
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "version": 1
}
```

### 4. Service Discovery

**Endpoint:** `GET /services` or `GET /registry`

**Response:**
```json
{
  "success": true,
  "services": [
    {
      "serviceName": "user-service",
      "version": "1.0.0",
      "endpoint": "http://user-service:3001",
      "status": "active",
      "registeredAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

### 5. Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "registeredServices": 5
}
```

### 6. Prometheus Metrics

**Endpoint:** `GET /metrics`

**Response:** (Prometheus format)
```
# HELP coordinator_registered_services_total Total number of registered services
# TYPE coordinator_registered_services_total gauge
coordinator_registered_services_total 5

# HELP coordinator_registration_requests_total Total number of registration requests
# TYPE coordinator_registration_requests_total counter
coordinator_registration_requests_total 10

# HELP coordinator_registration_failures_total Total number of failed registration attempts
# TYPE coordinator_registration_failures_total counter
coordinator_registration_failures_total 2

# HELP coordinator_uiux_config_fetches_total Total number of UI/UX config fetch requests
# TYPE coordinator_uiux_config_fetches_total counter
coordinator_uiux_config_fetches_total 15

# HELP coordinator_uptime_seconds Service uptime in seconds
# TYPE coordinator_uptime_seconds gauge
coordinator_uptime_seconds 3600
```

## Testing

### Using cURL

#### Register a Service
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "test-service",
    "version": "1.0.0",
    "endpoint": "http://test.com",
    "healthCheck": "/health",
    "migrationFile": {}
  }'
```

#### Upload UI/UX Config
```bash
curl -X POST http://localhost:3000/uiux \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "theme": "dark"
    }
  }'
```

#### Fetch UI/UX Config
```bash
curl http://localhost:3000/uiux
```

#### Get All Services
```bash
curl http://localhost:3000/services
```

#### Health Check
```bash
curl http://localhost:3000/health
```

#### Get Metrics
```bash
curl http://localhost:3000/metrics
```

## Project Structure

```
coordinator/
├── src/
│   ├── index.js                 # Main entry point
│   ├── routes/
│   │   ├── register.js          # Registration endpoint
│   │   ├── uiux.js              # UI/UX endpoints
│   │   ├── services.js          # Service discovery
│   │   ├── health.js            # Health check
│   │   └── metrics.js           # Prometheus metrics
│   ├── services/
│   │   ├── registryService.js   # Service registry logic
│   │   ├── uiuxService.js       # UI/UX config management
│   │   └── metricsService.js    # Metrics collection
│   ├── middleware/
│   │   ├── validation.js        # Request validation
│   │   ├── errorHandler.js      # Error handling
│   │   ├── logger.js            # Request logging
│   │   └── jwt.js               # JWT placeholder (Team 4)
│   └── utils/
│       └── logger.js            # Winston logger config
├── package.json
├── .env.example
└── README.md
```

## Data Models

### Service Registry Entry
```javascript
{
  id: "uuid",
  serviceName: "string",
  version: "string",
  endpoint: "string",
  healthCheck: "string",
  migrationFile: {},
  registeredAt: "ISO timestamp",
  lastHealthCheck: "ISO timestamp",
  status: "active"
}
```

### UI/UX Configuration
```javascript
{
  config: {},
  updatedAt: "ISO timestamp",
  version: "number"
}
```

## Logging

The service uses Winston for structured logging. All key events are logged with timestamps:

- Service registrations
- UI/UX configuration updates
- Failed registration attempts
- Health check calls
- Errors and exceptions

Log levels can be configured via `LOG_LEVEL` environment variable (default: `info`).

## Security Considerations

- Input validation on all endpoints
- Input sanitization to prevent injection attacks
- JWT authentication placeholder (to be implemented by Team 4)
- CORS enabled (can be restricted by Team 4)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | `info` |
| `OPENAI_API_KEY` | OpenAI API key (for AI routing) | - |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-3.5-turbo` |
| `OPENAI_API_URL` | OpenAI API endpoint | `https://api.openai.com/v1/chat/completions` |

## Dependencies

- **express**: Web framework
- **winston**: Logging library
- **dotenv**: Environment variable management
- **uuid**: UUID generation for service IDs

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` for auto-reload on file changes.

## Notes

- Service registry is stored in-memory (will be lost on restart)
- For production, consider persisting to a database
- JWT authentication is a placeholder - Team 4 will implement actual validation
- All endpoints are designed to accept JWT tokens in `Authorization: Bearer <token>` header

## License

ISC

