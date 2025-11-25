# Coordinator Integration Guide

## Quick Start for Microservice Developers

This guide helps you integrate your microservice with the Coordinator using the new two-stage registration process and advanced features.

---

## Prerequisites

1. Your microservice should be running and accessible
2. Your service should have a health check endpoint
3. You should have your migration/schema file ready
4. Basic understanding of REST APIs and JSON

---

## Step-by-Step Integration Process

### Step 1: Prepare Your Service Information

Before registering, gather the following information:

```javascript
const serviceInfo = {
  serviceName: "your-service-name",        // Unique name
  version: "1.0.0",                       // Semver format
  endpoint: "http://your-service:port",    // Full URL
  healthCheck: "/health",                  // Health check path
  description: "What your service does",   // Optional description
  metadata: {
    team: "Your Team Name",
    owner: "team@company.com",
    capabilities: ["capability1", "capability2"]  // What your service can do
  }
};
```

### Step 2: Stage 1 Registration (Basic Info)

Register your service with basic information:

```javascript
// Node.js example
const axios = require('axios');

async function registerService() {
  try {
    const response = await axios.post('http://coordinator:3000/register', {
      serviceName: "payment-service",
      version: "1.0.0",
      endpoint: "http://payment-service:4000",
      healthCheck: "/health",
      description: "Handles payment processing and refunds",
      metadata: {
        team: "Payments Team",
        owner: "payments@company.com",
        capabilities: ["payments", "refunds", "transactions"]
      }
    });

    console.log('Service registered:', response.data);
    
    // Save the service ID for Step 2
    const serviceId = response.data.serviceId;
    return serviceId;
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
    throw error;
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Service registered successfully. Please upload migration file.",
  "serviceId": "abc-123-def-456",
  "status": "pending_migration",
  "nextStep": {
    "action": "POST",
    "endpoint": "/register/abc-123-def-456/migration",
    "description": "Upload your migration file to complete registration"
  }
}
```

### Step 3: Prepare Your Migration File

Create a comprehensive migration file describing your service:

```javascript
const migrationFile = {
  version: "1.0.0",
  database: {
    tables: [
      {
        name: "payments",
        schema: {
          id: "uuid PRIMARY KEY",
          amount: "decimal(10,2) NOT NULL",
          currency: "varchar(3) NOT NULL",
          status: "varchar(20) NOT NULL",
          created_at: "timestamp DEFAULT CURRENT_TIMESTAMP"
        }
      },
      {
        name: "transactions",
        schema: {
          id: "uuid PRIMARY KEY",
          payment_id: "uuid REFERENCES payments(id)",
          type: "varchar(50) NOT NULL",
          amount: "decimal(10,2) NOT NULL"
        }
      }
    ],
    migrations: [
      "001_create_payments_table",
      "002_create_transactions_table",
      "003_add_payment_indexes"
    ]
  },
  api: {
    endpoints: [
      {
        path: "/api/payment/process",
        method: "POST",
        description: "Process a new payment",
        requestSchema: {
          type: "object",
          required: ["amount", "currency", "paymentMethod"],
          properties: {
            amount: { type: "number", minimum: 0.01 },
            currency: { type: "string", pattern: "^[A-Z]{3}$" },
            paymentMethod: { type: "string" },
            description: { type: "string" }
          }
        },
        responseSchema: {
          type: "object",
          properties: {
            paymentId: { type: "string" },
            status: { type: "string", enum: ["pending", "completed", "failed"] },
            amount: { type: "number" },
            currency: { type: "string" }
          }
        }
      },
      {
        path: "/api/payment/refund",
        method: "POST",
        description: "Process a refund",
        requestSchema: {
          type: "object",
          required: ["paymentId", "amount"],
          properties: {
            paymentId: { type: "string" },
            amount: { type: "number", minimum: 0.01 },
            reason: { type: "string" }
          }
        }
      },
      {
        path: "/api/payment/{id}",
        method: "GET",
        description: "Get payment details"
      }
    ]
  },
  dependencies: [
    "notification-service",  // Services you depend on
    "audit-service",
    "user-service"
  ],
  events: {
    publishes: [
      "payment.created",
      "payment.completed",
      "payment.failed",
      "refund.processed"
    ],
    subscribes: [
      "order.created",
      "user.verified",
      "fraud.detected"
    ]
  }
};
```

### Step 4: Stage 2 Registration (Upload Migration)

Upload your migration file to complete registration:

```javascript
async function uploadMigration(serviceId, migrationFile) {
  try {
    const response = await axios.post(
      `http://coordinator:3000/register/${serviceId}/migration`,
      { migrationFile }
    );

    console.log('Migration uploaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('Migration upload failed:', error.response?.data || error.message);
    throw error;
  }
}
```

### Step 5: Verify Registration

Check that your service is now active:

```javascript
async function verifyRegistration(serviceId) {
  try {
    const response = await axios.get(`http://coordinator:3000/services/${serviceId}`);
    
    if (response.data.service.status === 'active') {
      console.log('✅ Service is now active and discoverable');
      return true;
    } else {
      console.log('⚠️ Service status:', response.data.service.status);
      return false;
    }
  } catch (error) {
    console.error('Verification failed:', error.message);
    return false;
  }
}
```

---

## Complete Integration Example

Here's a complete Node.js example:

```javascript
const axios = require('axios');

class CoordinatorClient {
  constructor(coordinatorUrl = 'http://coordinator:3000') {
    this.baseUrl = coordinatorUrl;
  }

  async registerService(serviceInfo, migrationFile) {
    try {
      // Stage 1: Basic registration
      console.log('🚀 Starting service registration...');
      const stage1Response = await axios.post(`${this.baseUrl}/register`, serviceInfo);
      
      const serviceId = stage1Response.data.serviceId;
      console.log(`✅ Stage 1 complete. Service ID: ${serviceId}`);

      // Stage 2: Migration upload
      console.log('📄 Uploading migration file...');
      const stage2Response = await axios.post(
        `${this.baseUrl}/register/${serviceId}/migration`,
        { migrationFile }
      );

      console.log('✅ Stage 2 complete. Service is now active!');
      
      return {
        serviceId,
        status: stage2Response.data.status,
        registeredAt: stage2Response.data.registeredAt
      };

    } catch (error) {
      console.error('❌ Registration failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateMigration(serviceId, migrationFile) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/register/${serviceId}/migration`,
        { migrationFile }
      );
      
      console.log('✅ Migration updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Migration update failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async getServiceDetails(serviceId) {
    try {
      const response = await axios.get(`${this.baseUrl}/services/${serviceId}`);
      return response.data.service;
    } catch (error) {
      console.error('❌ Failed to get service details:', error.message);
      throw error;
    }
  }

  async testAIRouting(requestData) {
    try {
      const response = await axios.post(`${this.baseUrl}/route`, requestData);
      return response.data.routing;
    } catch (error) {
      console.error('❌ AI routing failed:', error.message);
      throw error;
    }
  }
}

// Usage example
async function main() {
  const coordinator = new CoordinatorClient();

  const serviceInfo = {
    serviceName: "my-awesome-service",
    version: "1.0.0",
    endpoint: "http://my-service:3000",
    healthCheck: "/health",
    description: "My awesome microservice",
    metadata: {
      team: "My Team",
      owner: "myteam@company.com",
      capabilities: ["data-processing", "analytics"]
    }
  };

  const migrationFile = {
    version: "1.0.0",
    // ... your migration file content
  };

  try {
    const result = await coordinator.registerService(serviceInfo, migrationFile);
    console.log('Registration result:', result);

    // Test AI routing
    const routingResult = await coordinator.testAIRouting({
      data: {
        type: "data_processing_request",
        payload: { dataType: "analytics" }
      },
      routing: { strategy: "single" }
    });
    
    console.log('AI routing result:', routingResult);

  } catch (error) {
    console.error('Integration failed:', error.message);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main();
}

module.exports = CoordinatorClient;
```

---

## Common Integration Patterns

### 1. Startup Registration

Register your service when it starts up:

```javascript
// In your main application file
const CoordinatorClient = require('./coordinator-client');

async function startService() {
  // Start your service first
  const app = express();
  // ... configure your app
  
  const server = app.listen(PORT, async () => {
    console.log(`Service running on port ${PORT}`);
    
    // Register with coordinator
    try {
      const coordinator = new CoordinatorClient();
      await coordinator.registerService(serviceInfo, migrationFile);
      console.log('✅ Successfully registered with coordinator');
    } catch (error) {
      console.error('❌ Failed to register with coordinator:', error.message);
      // Decide whether to exit or continue without registration
    }
  });
}
```

### 2. Health Check Integration

Ensure your health check endpoint works with the coordinator:

```javascript
app.get('/health', (req, res) => {
  // Perform any necessary health checks
  const isHealthy = checkDatabaseConnection() && checkExternalServices();
  
  if (isHealthy) {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'my-service',
      version: '1.0.0'
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString()
    });
  }
});
```

### 3. Event Publishing Integration

If your service publishes events, integrate with the coordinator's routing:

```javascript
class EventPublisher {
  constructor(coordinatorClient) {
    this.coordinator = coordinatorClient;
  }

  async publishEvent(eventType, payload) {
    // Publish to your event system (Kafka, RabbitMQ, etc.)
    await this.publishToEventBus(eventType, payload);

    // Optionally use coordinator for intelligent routing
    try {
      const routingResult = await this.coordinator.testAIRouting({
        data: {
          type: 'event_notification',
          payload: { eventType, ...payload }
        },
        routing: { strategy: 'broadcast' }
      });

      console.log('Event routing suggestions:', routingResult.targetServices);
    } catch (error) {
      console.warn('Event routing failed:', error.message);
    }
  }
}
```

---

## Troubleshooting

### Common Issues

1. **Service Name Already Exists**
   ```json
   {
     "success": false,
     "error": "Service with name 'my-service' already exists"
   }
   ```
   **Solution:** Use a unique service name or check existing services with `GET /services`

2. **Invalid Version Format**
   ```json
   {
     "success": false,
     "error": "version must be in semver format (e.g., 1.0.0)"
   }
   ```
   **Solution:** Use semantic versioning (major.minor.patch)

3. **Migration Upload to Non-existent Service**
   ```json
   {
     "success": false,
     "error": "Service not found"
   }
   ```
   **Solution:** Ensure you're using the correct service ID from Stage 1

4. **Service Stuck in pending_migration**
   - Check that you completed Stage 2 (migration upload)
   - Verify the migration file format is correct
   - Check coordinator logs for validation errors

### Debugging Tips

1. **Check Service Status:**
   ```bash
   curl http://coordinator:3000/services/{serviceId}
   ```

2. **View System Changelog:**
   ```bash
   curl http://coordinator:3000/changelog?type=service_registered
   ```

3. **Test AI Routing:**
   ```bash
   curl -X POST http://coordinator:3000/route \
     -H "Content-Type: application/json" \
     -d '{"data":{"type":"test"},"routing":{"strategy":"single"}}'
   ```

4. **Check Coordinator Health:**
   ```bash
   curl http://coordinator:3000/health
   ```

---

## Best Practices

1. **Service Naming:** Use descriptive, kebab-case names (e.g., `user-management-service`)

2. **Version Management:** Follow semantic versioning strictly

3. **Health Checks:** Implement comprehensive health checks that verify dependencies

4. **Migration Files:** Keep migration files comprehensive and up-to-date

5. **Error Handling:** Always handle registration failures gracefully

6. **Monitoring:** Use the coordinator's metrics endpoints for monitoring

7. **Documentation:** Keep your API documentation in sync with your migration file

---

## Next Steps

After successful integration:

1. Monitor your service through coordinator metrics
2. Use AI routing for intelligent request distribution
3. Leverage the knowledge graph for dependency management
4. Set up alerts based on coordinator health checks
5. Explore schema validation for API contracts

For more advanced features, see the [API Documentation](API_DOCUMENTATION.md) and [AI Routing Guide](AI_ROUTING_GUIDE.md).

