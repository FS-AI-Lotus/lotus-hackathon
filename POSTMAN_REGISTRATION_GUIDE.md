# Postman Guide: Register a Service

## 📋 Basic Registration (Stage 1)

### Request Setup

**Method:** `POST`  
**URL:** `http://your-coordinator-url:3000/register`  
*(Replace with your actual coordinator URL)*

### Headers

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

### Body (raw JSON)

**Required Fields:**
- `serviceName` (string) - Name of your microservice
- `version` (string) - Version number
- `endpoint` (string) - Full URL where service is accessible

**Optional Fields:**
- `healthCheck` (string) - Health check endpoint path (default: `/health`)
- `migrationFile` (object) - Migration schema (can be added in Stage 2)
- `description` (string) - Service description
- `metadata` (object) - Additional metadata

### Example 1: Minimal Registration

```json
{
  "serviceName": "user-service",
  "version": "1.0.0",
  "endpoint": "http://user-service:3000"
}
```

### Example 2: Full Registration

```json
{
  "serviceName": "user-service",
  "version": "1.0.0",
  "endpoint": "http://user-service:3000",
  "healthCheck": "/health",
  "description": "User management microservice",
  "metadata": {
    "capabilities": ["user-crud", "authentication"],
    "team": "backend-team"
  }
}
```

### Example 3: With Migration File (Stage 1 + 2 Combined)

```json
{
  "serviceName": "user-service",
  "version": "1.0.0",
  "endpoint": "http://user-service:3000",
  "healthCheck": "/health",
  "migrationFile": {
    "schema": "v1",
    "tables": ["users", "profiles"],
    "api": {
      "endpoints": [
        {
          "method": "GET",
          "path": "/api/users",
          "description": "Get all users"
        },
        {
          "method": "POST",
          "path": "/api/users",
          "description": "Create user"
        }
      ]
    },
    "events": {
      "publishes": ["user.created", "user.updated"],
      "subscribes": ["auth.verified"]
    }
  }
}
```

---

## 📋 Stage 2: Complete Migration (Activate Service)

After Stage 1, you'll get a `serviceId`. Use it to complete migration and activate the service.

### Request Setup

**Method:** `POST`  
**URL:** `http://your-coordinator-url:3000/register/{serviceId}/migration`  
*(Replace `{serviceId}` with the ID from Stage 1 response)*

### Headers

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

### Body (raw JSON)

```json
{
  "migrationFile": {
    "schema": "v1",
    "tables": ["users", "profiles"],
    "api": {
      "endpoints": [
        {
          "method": "GET",
          "path": "/api/users",
          "description": "Get all users"
        },
        {
          "method": "POST",
          "path": "/api/users",
          "description": "Create user"
        }
      ]
    },
    "events": {
      "publishes": ["user.created", "user.updated"],
      "subscribes": ["auth.verified"]
    }
  }
}
```

---

## ✅ Expected Responses

### Success (Stage 1)
```json
{
  "success": true,
  "message": "Service registered successfully",
  "serviceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Success (Stage 2)
```json
{
  "success": true,
  "message": "Migration file uploaded successfully",
  "serviceId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active"
}
```

### Error (Validation Failed)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "serviceName is required and must be a non-empty string",
    "endpoint must be a valid URL"
  ]
}
```

### Error (Service Already Exists)
```json
{
  "success": false,
  "message": "Service with name 'user-service' already exists"
}
```

---

## 🎯 Step-by-Step in Postman

### Step 1: Create New Request
1. Click **New** → **HTTP Request**
2. Set method to **POST**
3. Enter URL: `http://your-coordinator-url:3000/register`

### Step 2: Set Headers
1. Go to **Headers** tab
2. Add header:
   - Key: `Content-Type`
   - Value: `application/json`

### Step 3: Set Body
1. Go to **Body** tab
2. Select **raw**
3. Select **JSON** from dropdown
4. Paste JSON body (use examples above)

### Step 4: Send Request
1. Click **Send**
2. Check response for `serviceId`
3. Save `serviceId` for Stage 2

### Step 5: Complete Migration (Optional)
1. Create new request: `POST /register/{serviceId}/migration`
2. Use same headers
3. Send migration file in body
4. Service becomes `active`

---

## 📝 Common Endpoint Formats

### Local Development
```
http://localhost:3000/register
```

### Docker Network
```
http://coordinator:3000/register
```

### Railway/Cloud
```
https://your-coordinator.railway.app/register
```

---

## ⚠️ Important Notes

1. **Endpoint URL must be valid** - Must include protocol (`http://` or `https://`)
2. **Service must be reachable** - Coordinator will try to connect to your service
3. **Service becomes active after Stage 2** - Only `active` services can receive routed requests
4. **Service name must be unique** - Cannot register duplicate service names

---

## 🔍 Verify Registration

After registering, check if service is registered:

**GET** `http://your-coordinator-url:3000/services`

Response:
```json
{
  "success": true,
  "services": [
    {
      "serviceName": "user-service",
      "version": "1.0.0",
      "endpoint": "http://user-service:3000",
      "status": "active",
      "registeredAt": "2025-11-27T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

## 🎯 Quick Copy-Paste Examples

### Minimal Registration
```json
{
  "serviceName": "my-service",
  "version": "1.0.0",
  "endpoint": "http://my-service:3000"
}
```

### With Description
```json
{
  "serviceName": "my-service",
  "version": "1.0.0",
  "endpoint": "http://my-service:3000",
  "description": "My awesome microservice"
}
```

### Complete with Migration
```json
{
  "serviceName": "my-service",
  "version": "1.0.0",
  "endpoint": "http://my-service:3000",
  "migrationFile": {
    "schema": "v1",
    "tables": ["items"]
  }
}
```

