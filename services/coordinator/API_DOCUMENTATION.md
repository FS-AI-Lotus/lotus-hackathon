# Coordinator Microservice - API Documentation

## Overview

The Coordinator Microservice serves as the central registry and intelligent routing hub for the microservices ecosystem. It provides advanced features including two-stage service registration, AI-powered routing, schema management, and comprehensive monitoring.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, authentication is optional and controlled by the `JWT_ENABLED` environment variable. When enabled, include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

---

## Service Registration

### Two-Stage Registration Process

The registration process has been enhanced to support a two-stage approach for better service management.

#### Stage 1: Basic Registration

**Endpoint:** `POST /register`

**Purpose:** Register basic service information and receive a service ID.

**Request Body:**
```json
{
  "serviceName": "string (required, unique)",
  "version": "string (required, semver format)",
  "endpoint": "string (required, full URL)",
  "healthCheck": "string (required, path like /health)",
  "description": "string (optional)",
  "metadata": {
    "team": "string",
    "owner": "string",
    "capabilities": ["array", "of", "capabilities"]
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Service registered successfully. Please upload migration file.",
  "serviceId": "uuid",
  "status": "pending_migration",
  "nextStep": {
    "action": "POST",
    "endpoint": "/register/{serviceId}/migration",
    "description": "Upload your migration file to complete registration"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "payment-service",
    "version": "1.0.0",
    "endpoint": "http://payment-service:4000",
    "healthCheck": "/health",
    "description": "Payment processing service",
    "metadata": {
      "team": "Team 5",
      "capabilities": ["payments", "refunds"]
    }
  }'
```

#### Stage 2: Migration Upload

**Endpoint:** `POST /register/:serviceId/migration`

**Purpose:** Upload migration/schema file to complete service registration.

**Request Body:**
```json
{
  "migrationFile": {
    "version": "1.0.0",
    "database": {
      "tables": [
        {
          "name": "users",
          "schema": {}
        }
      ],
      "migrations": []
    },
    "api": {
      "endpoints": [
        {
          "path": "/api/users",
          "method": "GET",
          "description": "Get all users",
          "requestSchema": {},
          "responseSchema": {}
        }
      ]
    },
    "dependencies": ["service-name-1", "service-name-2"],
    "events": {
      "publishes": ["user.created", "user.updated"],
      "subscribes": ["payment.completed"]
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Migration file uploaded successfully. Service is now active.",
  "serviceId": "uuid",
  "status": "active",
  "registeredAt": "ISO timestamp"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/register/{serviceId}/migration \
  -H "Content-Type: application/json" \
  -d '{
    "migrationFile": {
      "version": "1.0.0",
      "api": {
        "endpoints": [
          {
            "path": "/api/payment/process",
            "method": "POST"
          }
        ]
      },
      "events": {
        "publishes": ["payment.completed"],
        "subscribes": ["order.created"]
      }
    }
  }'
```

#### Update Migration

**Endpoint:** `PUT /register/:serviceId/migration`

**Purpose:** Update existing migration file.

---

## AI-Powered Routing

### Route Request

**Endpoint:** `POST /route`

**Purpose:** Use AI to intelligently route data/requests to appropriate microservice(s).

**Request Body:**
```json
{
  "data": {
    "type": "string (e.g., 'user_query', 'transaction', 'notification')",
    "payload": {},
    "context": {}
  },
  "routing": {
    "strategy": "single|multiple|broadcast",
    "priority": "speed|accuracy|cost"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "routing": {
    "targetServices": [
      {
        "serviceName": "payment-service",
        "endpoint": "http://payment-service:4000/api/process",
        "confidence": 0.95,
        "reasoning": "Payment-related keywords detected in payload"
      }
    ],
    "strategy": "single",
    "processingTime": "45ms",
    "method": "ai"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/route \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "type": "payment_request",
      "payload": {
        "amount": 100,
        "currency": "USD"
      }
    },
    "routing": {
      "strategy": "single"
    }
  }'
```

### Get Routing Context

**Endpoint:** `GET /route/context`

**Purpose:** Get current routing context for debugging.

**Response (200 OK):**
```json
{
  "success": true,
  "context": {
    "aiEnabled": true,
    "fallbackEnabled": true,
    "totalServices": 5,
    "activeServices": 4,
    "services": [...]
  }
}
```

---

## Service Discovery

### List Services

**Endpoint:** `GET /services`

**Query Parameters:**
- `includeAll` (boolean): Include services in all statuses (default: false, only active)

**Response (200 OK):**
```json
{
  "success": true,
  "services": [
    {
      "serviceName": "payment-service",
      "version": "1.0.0",
      "endpoint": "http://payment-service:4000",
      "status": "active",
      "registeredAt": "ISO timestamp"
    }
  ],
  "total": 1
}
```

### Get Service Details

**Endpoint:** `GET /services/:serviceId`

**Response (200 OK):**
```json
{
  "success": true,
  "service": {
    "serviceId": "uuid",
    "serviceName": "payment-service",
    "version": "1.0.0",
    "endpoint": "http://payment-service:4000",
    "status": "active",
    "registeredAt": "ISO timestamp",
    "migrationFile": {},
    "capabilities": [],
    "dependencies": [],
    "events": {
      "publishes": [],
      "subscribes": []
    },
    "health": {
      "lastCheck": "ISO timestamp",
      "status": "healthy"
    }
  }
}
```

---

## Schema Registry

### List All Schemas

**Endpoint:** `GET /schemas`

**Response (200 OK):**
```json
{
  "success": true,
  "schemas": [
    {
      "serviceId": "uuid",
      "serviceName": "payment-service",
      "schemaTypes": ["api_endpoints", "database_tables", "events"],
      "schemaCount": 3
    }
  ],
  "totalServices": 1
}
```

### Get Service Schemas

**Endpoint:** `GET /schemas/:serviceId`

**Response (200 OK):**
```json
{
  "success": true,
  "serviceId": "uuid",
  "serviceName": "payment-service",
  "currentSchemas": {},
  "versions": [
    {
      "version": "1.0.0",
      "timestamp": "ISO timestamp",
      "schemaTypes": ["api_endpoints"]
    }
  ]
}
```

### Validate Data Against Schema

**Endpoint:** `POST /schemas/:serviceId/validate`

**Request Body:**
```json
{
  "data": {},
  "schemaType": "api_request|api_response|event_payload|database",
  "schemaName": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "schemaType": "api_request",
  "schemaName": "POST_/api/payment/process"
}
```

---

## System Changelog

### Get Changelog

**Endpoint:** `GET /changelog`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50, max: 100)
- `type` (string): Filter by change type

**Response (200 OK):**
```json
{
  "success": true,
  "changes": [
    {
      "id": "uuid",
      "type": "service_registered",
      "details": {
        "serviceName": "payment-service",
        "serviceId": "uuid"
      },
      "timestamp": "ISO timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 45,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Get Changelog Statistics

**Endpoint:** `GET /changelog/stats`

**Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "totalChanges": 45,
    "recentChanges": 12,
    "typeStats": {
      "service_registered": 10,
      "migration_uploaded": 8,
      "routing_performed": 25
    }
  }
}
```

### Search Changelog

**Endpoint:** `GET /changelog/search`

**Query Parameters:**
- `q` or `query` (string): Search query
- `limit` (number): Max results (default: 20, max: 50)

---

## Knowledge Graph

### Get Knowledge Graph

**Endpoint:** `GET /knowledge-graph`

**Query Parameters:**
- `serviceId` (string): Get graph for specific service
- `depth` (number): Dependency depth levels

**Response (200 OK):**
```json
{
  "nodes": [
    {
      "id": "service-1",
      "name": "payment-service",
      "type": "service",
      "status": "active",
      "capabilities": []
    }
  ],
  "edges": [
    {
      "source": "service-1",
      "target": "service-2",
      "type": "depends_on"
    }
  ]
}
```

---

## UI/UX Configuration

### Get UI/UX Config

**Endpoint:** `GET /uiux`

### Update UI/UX Config

**Endpoint:** `POST /uiux`

---

## Monitoring & Metrics

### Prometheus Metrics

**Endpoint:** `GET /metrics`

**Response:** Prometheus format metrics

### JSON Metrics

**Endpoint:** `GET /metrics/json`

**Response (200 OK):**
```json
{
  "success": true,
  "metrics": {
    "uptime": 3600,
    "timestamp": "ISO timestamp",
    "metricsEnabled": true
  }
}
```

---

## Health Check

### Health Status

**Endpoint:** `GET /health`

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "coordinator"
}
```

---

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": ["Missing required field: serviceName"]
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Service not found"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "error": "Service with name 'payment-service' already exists"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. This can be added by Team 4 as part of security enhancements.

---

## Versioning

The API currently uses implicit versioning. All endpoints are considered v1. Future versions may include explicit versioning in the URL path.

---

## Environment Variables

See `.env.example` for all available configuration options including AI routing, metrics, and feature toggles.

