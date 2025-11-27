# 🚀 Microservice Registration Implementation Prompt

**Instructions for Microservice Development Teams**

This document contains **everything you need** to implement service registration with the Coordinator. Follow these instructions step-by-step to ensure your microservice can register successfully.

---

## 📋 Your Mission

Implement automatic service registration with the Coordinator when your microservice starts up. Your service will be deployed on **Railway** (no Docker needed!).

Your service must:

1. ✅ Start and be accessible via HTTP
2. ✅ Implement a health check endpoint
3. ✅ **Configure Coordinator Railway URL as GitHub Secret**
4. ✅ Wait for the Coordinator to be ready
5. ✅ Register with the Coordinator automatically
6. ✅ Handle registration failures gracefully

**🚂 Railway Deployment:** Both your service and the Coordinator are deployed on Railway. Railway auto-detects Node.js and deploys directly from GitHub. No Dockerfile needed!

**🔐 CRITICAL:** The Coordinator is deployed on Railway. You **MUST** set the `COORDINATOR_URL` as a **GitHub Secret** in your repository settings (Settings → Secrets and variables → Actions).

---

## 🎯 Prerequisites Checklist

Before implementing registration, ensure your service has:

### Required:
- [ ] **HTTP server running** (Express, Fastify, or similar)
- [ ] **Service deployed on Railway** (same platform as Coordinator)
- [ ] **Valid endpoint URL** (Railway provides this: `https://your-service.railway.app` or internal `http://your-service:3000`)
- [ ] **Unique service name** (check with Coordinator first)
- [ ] **Version number** (semantic versioning: `1.0.0`)
- [ ] **COORDINATOR_URL configured as GitHub Secret** (Railway URL - internal or public)

### Recommended:
- [ ] **Health check endpoint** at `/health` (or custom path)
- [ ] **Migration file** prepared (for better AI routing)
- [ ] **All required secrets configured in GitHub** (Settings → Secrets and variables → Actions)
- [ ] **GitHub repository connected to Railway** (for auto-deployment)
- [ ] **Use Railway internal networking** (if services in same Railway project)

---

## 🔐 CRITICAL: Coordinator Railway URL Configuration

**⚠️ IMPORTANT:** The Coordinator is deployed on Railway and has a public Railway URL. You **MUST** configure this URL as a **secret/environment variable** in your microservice.

### Getting the Coordinator Railway URL

1. **Ask your team lead** for the Coordinator Railway URL
2. **Or check Railway dashboard** - Look for the Coordinator service's public URL
3. **Format:** Usually `https://coordinator-[project].railway.app` or similar

### Setting it in GitHub (Recommended)

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name:** `COORDINATOR_URL`
   - **Value:** `https://your-coordinator.railway.app` (actual URL)
5. Click **Add secret**

**Note:** Railway will automatically use GitHub Secrets as environment variables when deploying.

### Setting it in Other Platforms

**Docker Compose:**
```yaml
environment:
  - COORDINATOR_URL=${COORDINATOR_URL}  # Set in .env file
```

**Kubernetes:**
```yaml
env:
  - name: COORDINATOR_URL
    valueFrom:
      secretKeyRef:
        name: coordinator-secrets
        key: railway-url
```

**Local Development (.env file):**
```env
COORDINATOR_URL=https://your-coordinator.railway.app
```

**⚠️ Security:** Never commit the Coordinator URL to version control. Always use secrets/environment variables.

---

## 📦 Step 1: Install Dependencies

Add the required dependency to your `package.json`:

```bash
npm install axios
# or
yarn add axios
```

**package.json:**
```json
{
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

---

## 🏥 Step 2: Implement Health Check Endpoint

**REQUIRED:** Your service must have a health check endpoint.

### Basic Implementation:

```javascript
// Express example
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: process.env.SERVICE_NAME || 'my-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    timestamp: new Date().toISOString()
  });
});
```

### Advanced Implementation (with dependency checks):

```javascript
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    cache: await checkCache(),
    externalApi: await checkExternalApi()
  };
  
  const isHealthy = Object.values(checks).every(check => check === true);
  
  if (isHealthy) {
    res.status(200).json({
      status: 'healthy',
      service: process.env.SERVICE_NAME,
      version: process.env.SERVICE_VERSION,
      checks: checks,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      checks: checks,
      timestamp: new Date().toISOString()
    });
  }
});
```

**Important:**
- Health endpoint must return HTTP 200 when healthy
- Default path is `/health` (or specify custom path in registration)
- Should check critical dependencies

---

## ⚙️ Step 3: Set Up Environment Variables

**IMPORTANT:** The Coordinator is deployed on Railway. You **MUST** configure the Railway URL as a **GitHub Secret**.

### Setting Up GitHub Secrets:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `COORDINATOR_URL` | `https://your-coordinator.railway.app` or `http://coordinator:3000` | Coordinator Railway URL (public URL or internal service name if same project) |
| `SERVICE_NAME` | `your-service-name` | Your unique service name |
| `SERVICE_VERSION` | `1.0.0` | Service version |
| `SERVICE_ENDPOINT` | `https://your-service.railway.app` or `http://your-service:3000` | Your service Railway URL (Railway provides public URL automatically) |
| `MIGRATION_FILE` | `{"schema":"v1","tables":["table1"]}` | Migration file (optional) |

**Note:** 
- If services are in the **same Railway project**, use internal service names: `http://coordinator:3000` and `http://your-service:3000`
- If services are in **different Railway projects**, use public URLs: `https://coordinator.railway.app` and `https://your-service.railway.app`

### Local Development (.env file):

For local testing, create a `.env` file (DO NOT commit):

```env
# Required
SERVICE_NAME=your-service-name
SERVICE_VERSION=1.0.0
SERVICE_ENDPOINT=http://localhost:3000  # Local development

# CRITICAL: Coordinator Railway URL (from GitHub Secrets)
# Use Railway public URL or internal service name
COORDINATOR_URL=https://your-coordinator.railway.app
# OR if in same Railway project:
# COORDINATOR_URL=http://coordinator:3000

# Optional
HEALTH_CHECK_PATH=/health
MIGRATION_FILE={"schema":"v1","tables":["table1"]}
REQUIRE_REGISTRATION=false
```

### 🔐 Setting Coordinator URL as GitHub Secret

**The Coordinator URL is a Railway deployment URL. You MUST configure it as a GitHub Secret:**

#### In GitHub Repository:
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name:** `COORDINATOR_URL`
   - **Value:** `https://your-coordinator.railway.app` (your actual Railway URL)
5. Click **Add secret**

**Note:** Railway will automatically use GitHub Secrets as environment variables when deploying. No need to configure in Railway Variables tab.

#### In Local Development:
```bash
# .env file (DO NOT commit this!)
COORDINATOR_URL=https://your-coordinator.railway.app
```

**⚠️ Security Note:** Never hardcode the Coordinator URL in your code. Always use environment variables or secrets.

**Using GitHub Secrets:**

1. Go to GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `SERVICE_NAME` = `user-service`
   - `SERVICE_VERSION` = `1.0.0`
   - `COORDINATOR_URL` = `https://coordinator.railway.app` (get from team lead)
   - `MIGRATION_FILE` = `{"schema":"v1","tables":["users"]}` (optional)

3. In Railway, these secrets will be available as environment variables automatically, or you can reference them in Railway Variables tab.

---

## 🔧 Step 4: Create Registration Module

Create a file `registration.js` (or `coordinator-client.js`):

```javascript
const axios = require('axios');

class CoordinatorClient {
  constructor(config = {}) {
    // Coordinator URL MUST be provided via environment variable (Railway URL)
    this.coordinatorUrl = config.coordinatorUrl || process.env.COORDINATOR_URL;
    
    if (!this.coordinatorUrl) {
      throw new Error(
        'COORDINATOR_URL environment variable is required. ' +
        'Set it to your Coordinator Railway URL (e.g., https://coordinator.railway.app)'
      );
    }
    this.serviceName = config.serviceName || process.env.SERVICE_NAME;
    this.serviceVersion = config.serviceVersion || process.env.SERVICE_VERSION || '1.0.0';
    this.endpoint = config.endpoint || process.env.SERVICE_ENDPOINT;
    this.healthCheck = config.healthCheck || process.env.HEALTH_CHECK_PATH || '/health';
    this.migrationFile = config.migrationFile || this.parseMigrationFile(process.env.MIGRATION_FILE);
    this.requireRegistration = config.requireRegistration || process.env.REQUIRE_REGISTRATION === 'true';
    this.maxRetries = config.maxRetries || 30;
    this.retryDelay = config.retryDelay || 2000;
  }

  parseMigrationFile(migrationFileString) {
    if (!migrationFileString) return null;
    try {
      return typeof migrationFileString === 'string' 
        ? JSON.parse(migrationFileString) 
        : migrationFileString;
    } catch (error) {
      console.warn('⚠️  Failed to parse MIGRATION_FILE:', error.message);
      return null;
    }
  }

  /**
   * Wait for Coordinator to be healthy
   */
  async waitForCoordinator() {
    console.log('⏳ Waiting for Coordinator to be ready...');
    
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const response = await axios.get(`${this.coordinatorUrl}/health`, {
          timeout: 5000
        });
        
        if (response.data.status === 'healthy') {
          console.log('✅ Coordinator is ready!');
          return true;
        }
      } catch (error) {
        if (i < this.maxRetries - 1) {
          console.log(`   Attempt ${i + 1}/${this.maxRetries} - Coordinator not ready, retrying in ${this.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          throw new Error(`Coordinator not available after ${this.maxRetries} attempts`);
        }
      }
    }
    
    throw new Error('Coordinator health check failed');
  }

  /**
   * Check if service name already exists
   */
  async checkServiceName(serviceName) {
    try {
      const response = await axios.get(`${this.coordinatorUrl}/services`);
      const services = response.data.services || [];
      return services.some(service => service.serviceName === serviceName);
    } catch (error) {
      console.warn('⚠️  Could not check service name availability:', error.message);
      return false;
    }
  }

  /**
   * Register service with Coordinator (Stage 1)
   */
  async registerStage1() {
    if (!this.serviceName || !this.endpoint) {
      throw new Error('SERVICE_NAME and SERVICE_ENDPOINT are required');
    }

    // Check if name already exists
    const exists = await this.checkServiceName(this.serviceName);
    if (exists) {
      throw new Error(`Service name '${this.serviceName}' already exists. Choose a different name.`);
    }

    const registrationData = {
      serviceName: this.serviceName,
      version: this.serviceVersion,
      endpoint: this.endpoint,
      healthCheck: this.healthCheck
    };

    console.log('📝 Registering service with Coordinator...');
    console.log(`   Service: ${this.serviceName}`);
    console.log(`   Version: ${this.serviceVersion}`);
    console.log(`   Endpoint: ${this.endpoint}`);

    const response = await axios.post(
      `${this.coordinatorUrl}/register`,
      registrationData,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Registration failed');
    }

    console.log(`✅ Stage 1 complete! Service ID: ${response.data.serviceId}`);
    return response.data.serviceId;
  }

  /**
   * Upload migration file (Stage 2)
   */
  async registerStage2(serviceId) {
    if (!this.migrationFile) {
      console.log('⚠️  No migration file provided. Service status: pending_migration');
      return null;
    }

    try {
      console.log('📄 Uploading migration file...');
      
      const response = await axios.post(
        `${this.coordinatorUrl}/register/${serviceId}/migration`,
        { migrationFile: this.migrationFile },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        console.log('✅ Stage 2 complete! Service is now ACTIVE');
        return response.data;
      } else {
        throw new Error(response.data.message || 'Migration upload failed');
      }
    } catch (error) {
      console.error('❌ Migration upload failed:', error.message);
      throw error;
    }
  }

  /**
   * Complete registration process
   */
  async register() {
    try {
      // Wait for Coordinator
      await this.waitForCoordinator();

      // Stage 1: Basic registration
      const serviceId = await this.registerStage1();

      // Stage 2: Upload migration (if provided)
      if (this.migrationFile) {
        await this.registerStage2(serviceId);
      }

      console.log('🎉 Service registration complete!');
      return { serviceId, status: 'registered' };
    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      
      if (this.requireRegistration) {
        console.error('💥 REQUIRE_REGISTRATION=true, exiting...');
        process.exit(1);
      } else {
        console.warn('⚠️  Continuing without registration...');
        throw error;
      }
    }
  }

  /**
   * Verify registration by checking if service name exists
   * Note: The /services endpoint doesn't return service IDs, so we verify by service name
   */
  async verifyRegistration(serviceName) {
    try {
      const response = await axios.get(`${this.coordinatorUrl}/services`);
      const services = response.data.services || [];
      const service = services.find(s => s.serviceName === serviceName);
      return service || null;
    } catch (error) {
      console.warn('⚠️  Could not verify registration:', error.message);
      return null;
    }
  }
}

module.exports = CoordinatorClient;
```

---

## 🚀 Step 5: Integrate Registration in Your Service

### Express.js Example:

```javascript
const express = require('express');
const CoordinatorClient = require('./registration');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint (REQUIRED)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: process.env.SERVICE_NAME,
    version: process.env.SERVICE_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Your service routes
app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from service!' });
});

// Start server and register
async function start() {
  // Validate required environment variables
  if (!process.env.SERVICE_NAME) {
    console.error('❌ ERROR: SERVICE_NAME environment variable is required');
    process.exit(1);
  }

  if (!process.env.SERVICE_ENDPOINT) {
    console.error('❌ ERROR: SERVICE_ENDPOINT environment variable is required');
    process.exit(1);
  }

  // Start HTTP server FIRST
  const server = app.listen(PORT, async () => {
    console.log(`🚀 Service running on port ${PORT}`);
    
    // THEN register with Coordinator
    try {
      const coordinator = new CoordinatorClient();
      await coordinator.register();
      console.log('✅ Service fully registered and ready!');
    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      
      if (process.env.REQUIRE_REGISTRATION === 'true') {
        console.error('💥 Exiting due to registration failure...');
        server.close();
        process.exit(1);
      } else {
        console.warn('⚠️  Continuing without registration...');
      }
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

start();
```

### Fastify Example:

```javascript
const fastify = require('fastify')({ logger: true });
const CoordinatorClient = require('./registration');

// Health check
fastify.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    service: process.env.SERVICE_NAME,
    version: process.env.SERVICE_VERSION
  };
});

// Your routes
fastify.get('/api/data', async (request, reply) => {
  return { message: 'Hello from service!' };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    console.log(`🚀 Service running on port ${process.env.PORT || 3000}`);
    
    // Register with Coordinator
    const coordinator = new CoordinatorClient();
    await coordinator.register();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
```

---

## 📝 Step 6: Prepare Migration File (Optional but Recommended)

Create a migration file that describes your service:

```javascript
// migration.json or in environment variable
const migrationFile = {
  schema: "v1",
  tables: ["users", "profiles"],  // Database tables your service uses
  capabilities: [                  // What your service can do
    "create_user",
    "get_user",
    "update_user",
    "delete_user"
  ],
  endpoints: {                     // Your API endpoints
    create: "/api/users",
    get: "/api/users/:id",
    update: "/api/users/:id",
    delete: "/api/users/:id"
  },
  description: "User management service for handling user accounts and profiles"
};
```

**Set as environment variable:**
```bash
MIGRATION_FILE='{"schema":"v1","tables":["users"],"capabilities":["create_user"]}'
```

---

## 🚂 Step 7: Railway Deployment (Primary Method)

**Railway is the primary deployment platform. No Docker needed!** Railway can deploy Node.js services directly from GitHub.

### Railway Setup:

1. **Connect Your Repository:**
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your microservice repository

2. **Configure GitHub Secrets:**
   - Go to your GitHub repository
   - Navigate to **Settings** → **Secrets and variables** → **Actions**
   - Add these required secrets:

| Secret Name | Value | Required |
|------------|-------|----------|
| `COORDINATOR_URL` | `https://your-coordinator.railway.app` | ✅ Yes (get from team lead) |
| `SERVICE_NAME` | `your-service-name` | ✅ Yes |
| `SERVICE_VERSION` | `1.0.0` | ✅ Yes |
| `MIGRATION_FILE` | `{"schema":"v1","tables":["table1"]}` | ❌ Optional |

3. **Railway Environment Variables:**
   - Railway will automatically use GitHub Secrets as environment variables
   - Railway automatically provides:
     - `PORT` = `3000` (Railway auto-detects)
   - **SERVICE_ENDPOINT Options:**
     - **Public URL:** `https://your-service.railway.app` (Railway provides this automatically)
     - **Internal (same project):** `http://your-service:3000` (use if Coordinator is in same Railway project)
   - Set `SERVICE_ENDPOINT` in GitHub Secrets with the appropriate URL
   - Optional: Add in Railway → **Variables** tab if needed:
     - `HEALTH_CHECK_PATH` = `/health`
     - `REQUIRE_REGISTRATION` = `false`

3. **Railway Auto-Detection:**
   - Railway automatically detects Node.js
   - Runs `npm install` automatically
   - Uses `npm start` or `node server.js` as start command
   - No Dockerfile needed!

4. **Service Endpoint:**
   - Railway provides a public URL automatically
   - Use this URL for `SERVICE_ENDPOINT` in GitHub Secrets
   - Format: `https://your-service.railway.app`
   - **OR** if Coordinator is in same Railway project, use internal: `http://your-service:3000`

5. **Deploy:**
   - Push to your GitHub branch
   - Railway automatically deploys
   - Check logs to see registration status

### Railway Configuration File (Optional):

Create `railway.json` for custom configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Railway Internal Networking:

If both services are in the same Railway project, you can use internal service names:

```bash
# For services in same Railway project
COORDINATOR_URL=http://coordinator:3000  # Internal service name
SERVICE_ENDPOINT=http://your-service:3000  # Internal service name
```

**Note:** 
- **Same Railway Project:** Use internal service names (`http://coordinator:3000`, `http://your-service:3000`)
- **Different Railway Projects:** Use public URLs (`https://coordinator.railway.app`, `https://your-service.railway.app`)
- Railway automatically handles networking between services in the same project
- Railway provides public URLs automatically for cross-project communication

---

## 🐳 Step 8: Docker Configuration (Optional - Only if Needed)

**⚠️ Docker is OPTIONAL.** Railway can deploy without Docker. Only use Docker if you need:
- Custom build steps
- Multi-stage builds
- Specific base images
- Local development with Docker Compose

### Dockerfile (Only if needed):

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --production

# Copy application
COPY . .

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "server.js"]
```

### Docker Compose (For Local Development Only):

```yaml
services:
  your-service:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - SERVICE_NAME=your-service
      - SERVICE_VERSION=1.0.0
      - SERVICE_ENDPOINT=http://localhost:3000
      - COORDINATOR_URL=${COORDINATOR_URL}
      - MIGRATION_FILE=${MIGRATION_FILE}
```

---

## ☸️ Step 9: Kubernetes Configuration (Optional - Advanced)

### Deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: your-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: your-service
  template:
    metadata:
      labels:
        app: your-service
    spec:
      initContainers:
      - name: wait-for-coordinator
        image: busybox:1.35
        command: ['sh', '-c']
        args:
        - |
          until wget -q --spider http://coordinator:3000/health; do
            echo "Waiting for coordinator..."
            sleep 2
          done
      containers:
      - name: your-service
        image: your-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: PORT
          value: "3000"
        - name: SERVICE_NAME
          value: "your-service"
        - name: SERVICE_VERSION
          value: "1.0.0"
        - name: SERVICE_ENDPOINT
          value: "http://your-service:3000"
        # CRITICAL: Coordinator Railway URL from secret
        - name: COORDINATOR_URL
          valueFrom:
            secretKeyRef:
              name: coordinator-config
              key: railway-url
        # OR use ConfigMap:
        # - name: COORDINATOR_URL
        #   valueFrom:
        #     configMapKeyRef:
        #       name: app-config
        #       key: coordinator-url
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## ✅ Step 9: Testing Your Implementation

### Local Testing:

```bash
# 1. Get Coordinator Railway URL
# The Coordinator URL should be provided by your team lead
# Example: https://coordinator-production.railway.app

# 2. Set environment variables
export SERVICE_NAME=test-service
export SERVICE_VERSION=1.0.0
export SERVICE_ENDPOINT=http://localhost:3001
export COORDINATOR_URL=https://your-coordinator.railway.app  # Use actual Railway URL

# 3. Start your service
npm start

# 4. Verify registration
curl https://your-coordinator.railway.app/services | grep test-service
```

**⚠️ Important:** For local testing, you can use the Railway URL directly. The Coordinator is accessible via HTTPS.

### Test Registration Manually:

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test registration
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "test-service",
    "version": "1.0.0",
    "endpoint": "http://localhost:3001",
    "healthCheck": "/health"
  }'
```

---

## 🚨 Common Issues and Solutions

### Issue 1: "Coordinator not available" or "COORDINATOR_URL is required"

**Solution:** 
1. Ensure `COORDINATOR_URL` environment variable is set
2. Verify the Railway URL is correct:
```bash
# Test Coordinator Railway URL
curl https://your-coordinator.railway.app/health

# Should return: {"status":"healthy",...}
```

**Common causes:**
- Missing `COORDINATOR_URL` environment variable
- Incorrect Railway URL
- Network/firewall blocking access to Railway

### Issue 2: "Service name already exists"

**Solution:** Choose a different service name or check existing services:
```bash
curl http://coordinator:3000/services
```

### Issue 3: "Invalid endpoint URL format"

**Solution:** Ensure endpoint includes protocol:
```javascript
// ❌ Wrong
"endpoint": "localhost:3000"

// ✅ Correct
"endpoint": "http://localhost:3000"
```

### Issue 4: "Service not reachable from Coordinator"

**Solution:** 
Since both services are on Railway, use the appropriate URL format:

```javascript
// ❌ Wrong
"endpoint": "http://localhost:3000"

// ✅ Correct (Railway public URL - different projects or external access)
"endpoint": "https://your-service.railway.app"

// ✅ Correct (Railway internal - same Railway project)
"endpoint": "http://your-service:3000"
```

**Choose based on your setup:**
- **Same Railway Project:** Use internal service names (`http://your-service:3000`)
- **Different Railway Projects:** Use public URLs (`https://your-service.railway.app`)
- Railway provides public URLs automatically - check your Railway service dashboard

### Issue 5: Registration happens before service starts

**Solution:** Register AFTER server starts listening:
```javascript
// ❌ Wrong
await register();
app.listen(PORT);

// ✅ Correct
app.listen(PORT, async () => {
  await register();
});
```

---

## 📊 Complete Example: Full Service Implementation

Here's a complete, production-ready example:

```javascript
// server.js
const express = require('express');
const CoordinatorClient = require('./registration');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check (REQUIRED)
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    service: process.env.SERVICE_NAME,
    version: process.env.SERVICE_VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
  res.status(200).json(health);
});

// Your API routes
app.get('/api/status', (req, res) => {
  res.json({ message: 'Service is running!' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  // Validate environment
  const required = ['SERVICE_NAME', 'SERVICE_ENDPOINT', 'COORDINATOR_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error(`   COORDINATOR_URL should be set to the Coordinator Railway URL`);
    console.error(`   Example: https://coordinator.railway.app`);
    process.exit(1);
  }
  
  // Validate COORDINATOR_URL format
  if (!process.env.COORDINATOR_URL.startsWith('http://') && 
      !process.env.COORDINATOR_URL.startsWith('https://')) {
    console.error('❌ COORDINATOR_URL must start with http:// or https://');
    console.error(`   Current value: ${process.env.COORDINATOR_URL}`);
    process.exit(1);
  }

  // Start server
  const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 ${process.env.SERVICE_NAME} running on port ${PORT}`);
    console.log(`📡 Health check: http://0.0.0.0:${PORT}/health`);
    
    // Register with Coordinator
    try {
      const coordinator = new CoordinatorClient();
      const result = await coordinator.register();
      
      if (result) {
        console.log(`✅ Registered with Coordinator (ID: ${result.serviceId})`);
      }
    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      
      if (process.env.REQUIRE_REGISTRATION === 'true') {
        console.error('💥 Exiting due to registration requirement...');
        server.close();
        process.exit(1);
      }
    }
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
```

---

## 📋 Final Checklist

Before deploying to Railway, verify:

- [ ] Health endpoint implemented and working
- [ ] **COORDINATOR_URL set as GitHub Secret** (Settings → Secrets and variables → Actions)
- [ ] **SERVICE_NAME set as GitHub Secret**
- [ ] **SERVICE_VERSION set as GitHub Secret**
- [ ] **SERVICE_ENDPOINT** (Railway provides this automatically)
- [ ] All required secrets configured in GitHub
- [ ] Registration module created
- [ ] Registration called AFTER server starts
- [ ] Error handling implemented
- [ ] Migration file prepared (optional)
- [ ] Tested locally with Railway URL
- [ ] Service name is unique
- [ ] Repository connected to Railway
- [ ] Coordinator Railway URL is accessible from your service

---

## 🎯 Quick Start Summary

1. **Install:** `npm install axios`
2. **Create:** `registration.js` with CoordinatorClient class
3. **Implement:** Health check endpoint at `/health`
4. **Configure:** Environment variables in Railway
5. **Integrate:** Call `coordinator.register()` after server starts
6. **Test:** Verify registration works locally
7. **Deploy:** Push to GitHub → Railway auto-deploys (no Docker needed!)

---

## 📚 Additional Resources

- **Registration API:** `POST /register`
- **Migration Upload:** `POST /register/:serviceId/migration`
- **Service Discovery:** `GET /services`
- **Health Check:** `GET /health`

---

## 💡 Pro Tips

1. **Always wait for Coordinator** - Don't register immediately, wait for it to be healthy
2. **Use GitHub Secrets** - Set `COORDINATOR_URL` and other secrets in GitHub (Settings → Secrets and variables → Actions)
3. **Railway auto-deploys** - Just push to GitHub, no Docker needed!
4. **Choose the right URL format:**
   - **Same Railway Project:** Use internal service names (`http://coordinator:3000`, `http://your-service:3000`)
   - **Different Projects:** Use public URLs (`https://coordinator.railway.app`, `https://your-service.railway.app`)
5. **Railway provides public URLs** - Check your Railway dashboard for your service's public URL
6. **Handle failures gracefully** - Don't crash if registration fails (unless required)
7. **Include migration file** - Better AI routing and service discovery
8. **Test locally first** - Verify everything works before deploying to Railway
9. **Monitor registration** - Check Railway logs to see registration status
10. **Never hardcode URLs** - Always use GitHub Secrets or environment variables
11. **Railway internal networking** - Faster and more secure when services are in same project

---

## 🆘 Need Help?

If you encounter issues:

1. **Check Coordinator health:** 
   ```bash
   curl https://your-coordinator.railway.app/health
   ```
   (Replace with your actual Railway URL)

2. **Verify COORDINATOR_URL is set:**
   ```bash
   echo $COORDINATOR_URL
   # Should show: https://your-coordinator.railway.app
   ```

3. **Check environment variables are set** (especially `COORDINATOR_URL`)

4. **Check service logs** for registration errors

5. **Verify endpoint URL** is reachable from Coordinator

6. **Ensure service name is unique**

7. **Contact your team lead** to get the correct Coordinator Railway URL

---

**Follow these instructions step-by-step and your microservice will register successfully!** 🚀

---

**Last Updated:** 2024  
**Version:** 1.0.0

