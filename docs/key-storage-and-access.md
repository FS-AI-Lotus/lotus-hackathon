# Key Storage and Access Guide

## 📍 Where Keys Are Stored

### Current Implementation (Development/Testing)

**Storage Location:** In-memory JavaScript `Map` object

**File:** `src/security/serviceKeyStore.js`

```javascript
const serviceKeys = new Map(); // serviceId -> { publicKey, privateKey, ... }
```

**Storage Structure:**
```javascript
serviceKeys = {
  "service-1234567890": {
    publicKey: "-----BEGIN PUBLIC KEY-----\n...",
    privateKey: "-----BEGIN PRIVATE KEY-----\n...",
    algorithm: "RS256",
    keySize: 2048,
    generatedAt: "2024-01-15T10:30:00.000Z",
    serviceName: "my-service",
    serviceId: "service-1234567890"
  },
  "service-9876543210": { ... }
}
```

### ⚠️ Important Notes

1. **In-Memory Only**: Keys are stored in RAM, not on disk
2. **Lost on Restart**: All keys are lost when the server restarts
3. **Not Persistent**: This is for development/testing only
4. **Production Warning**: For production, use a database or key management service

---

## 🔑 How to Access Keys

### Method 1: During Service Registration (Automatic)

When a service registers via `POST /register`, keys are automatically generated and returned:

```bash
curl -X POST http://localhost:3000/register \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-service",
    "url": "http://localhost:3001",
    "schema": {}
  }'
```

**Response:**
```json
{
  "id": "service-1234567890",
  "name": "my-service",
  "url": "http://localhost:3001",
  "registeredAt": "2024-01-15T10:30:00.000Z",
  "privateKey": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----",
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----",
  "algorithm": "RS256",
  "keySize": 2048,
  "message": "Service registered successfully. Store your private key securely!"
}
```

**⚠️ Security Note**: Store the private key securely! It's only returned once during registration.

---

### Method 2: Programmatic Access (From Code)

#### Get Public Key (for JWT verification)

```javascript
const { getPublicKey } = require('./src/security/serviceKeyStore');

// Get public key for a service
const serviceId = 'service-1234567890';
const publicKey = getPublicKey(serviceId);

if (publicKey) {
  console.log('Public Key:', publicKey);
  // Use publicKey to verify JWTs signed by this service
} else {
  console.log('Service not found or has no keys');
}
```

#### Get Private Key (⚠️ Use with caution!)

```javascript
const { getPrivateKey } = require('./src/security/serviceKeyStore');

// Get private key for a service
const serviceId = 'service-1234567890';
const privateKey = getPrivateKey(serviceId);

if (privateKey) {
  // WARNING: Private key access is logged as a security event!
  console.log('Private Key:', privateKey);
  // Use privateKey to sign JWTs
} else {
  console.log('Service not found or has no keys');
}
```

**⚠️ Security Warning**: Accessing private keys logs a security event. Only do this if absolutely necessary!

#### Get Key Metadata (Safe - no private key exposed)

```javascript
const { getKeyMetadata } = require('./src/security/serviceKeyStore');

const serviceId = 'service-1234567890';
const metadata = getKeyMetadata(serviceId);

if (metadata) {
  console.log('Key Metadata:', {
    serviceId: metadata.serviceId,
    serviceName: metadata.serviceName,
    algorithm: metadata.algorithm,
    keySize: metadata.keySize,
    generatedAt: metadata.generatedAt,
    hasPublicKey: metadata.hasPublicKey,
    hasPrivateKey: metadata.hasPrivateKey
  });
}
```

#### List All Services with Keys

```javascript
const { getAllServiceIds } = require('./src/security/serviceKeyStore');

const serviceIds = getAllServiceIds();
console.log('Services with keys:', serviceIds);
// Output: ['service-1234567890', 'service-9876543210', ...]
```

#### Check if Service Has Keys

```javascript
const { hasKeys } = require('./src/security/serviceKeyStore');

const serviceId = 'service-1234567890';
if (hasKeys(serviceId)) {
  console.log('Service has keys');
} else {
  console.log('Service has no keys');
}
```

---

### Method 3: Create an Admin Endpoint (Optional)

You can create an admin endpoint to view keys (for debugging/management):

```javascript
// Add to test-server.js or your main app

const { getKeyMetadata, getAllServiceIds, getPublicKey } = require('./src/security/serviceKeyStore');

// Admin endpoint to list all services with keys (metadata only, no private keys)
app.get('/admin/keys', (req, res) => {
  const serviceIds = getAllServiceIds();
  const keysMetadata = serviceIds.map(serviceId => getKeyMetadata(serviceId));
  
  res.json({
    count: keysMetadata.length,
    services: keysMetadata
  });
});

// Admin endpoint to get public key for a service
app.get('/admin/keys/:serviceId/public', (req, res) => {
  const { serviceId } = req.params;
  const publicKey = getPublicKey(serviceId);
  
  if (!publicKey) {
    return res.status(404).json({ error: 'Service not found or has no keys' });
  }
  
  res.json({
    serviceId,
    publicKey,
    algorithm: 'RS256',
    keySize: 2048
  });
});
```

---

## 🔐 Key Access Functions Reference

### Available Functions

| Function | Purpose | Returns Private Key? | Logs Security Event? |
|----------|---------|---------------------|---------------------|
| `getPublicKey(serviceId)` | Get public key for JWT verification | ❌ No | ❌ No |
| `getPrivateKey(serviceId)` | Get private key (⚠️ use carefully) | ✅ Yes | ✅ Yes |
| `getKeyMetadata(serviceId)` | Get key info without exposing keys | ❌ No | ❌ No |
| `hasKeys(serviceId)` | Check if service has keys | ❌ No | ❌ No |
| `getAllServiceIds()` | List all service IDs with keys | ❌ No | ❌ No |
| `removeKeys(serviceId)` | Delete keys for a service | ❌ No | ✅ Yes (audit) |
| `clearAllKeys()` | Clear all keys (testing only) | ❌ No | ❌ No |

---

## 📦 Key Storage Location Details

### In-Memory Map Structure

```javascript
// Location: src/security/serviceKeyStore.js, line 17
const serviceKeys = new Map();

// Key format: serviceId (string)
// Value format: {
//   publicKey: string (PEM format),
//   privateKey: string (PEM format),
//   algorithm: "RS256",
//   keySize: 2048,
//   generatedAt: ISO timestamp,
//   serviceName: string,
//   serviceId: string
// }
```

### When Keys Are Created

1. **During Service Registration**: When `POST /register` is called
2. **Automatic**: Keys are generated automatically, no manual step needed
3. **One-time**: Keys are generated once per service (unless service is removed)

### When Keys Are Used

1. **JWT Verification**: Coordinator uses public keys to verify incoming JWTs
2. **JWT Signing**: Services use private keys to sign outgoing JWTs
3. **Automatic Lookup**: JWT middleware automatically looks up public keys by service ID

---

## 🚀 Production Considerations

### Current Limitations

1. **Not Persistent**: Keys are lost on server restart
2. **Single Instance**: Won't work with multiple server instances
3. **No Backup**: No backup or recovery mechanism
4. **In-Memory Only**: Not suitable for production

### Production Solutions

#### Option 1: Database Storage

```javascript
// Example: Store in PostgreSQL
const { Pool } = require('pg');
const pool = new Pool();

async function storeKeys(serviceId, keyPair) {
  await pool.query(
    'INSERT INTO service_keys (service_id, public_key, private_key, created_at) VALUES ($1, $2, $3, $4)',
    [serviceId, keyPair.publicKey, keyPair.privateKey, new Date()]
  );
}

async function getPublicKey(serviceId) {
  const result = await pool.query(
    'SELECT public_key FROM service_keys WHERE service_id = $1',
    [serviceId]
  );
  return result.rows[0]?.public_key || null;
}
```

#### Option 2: Key Management Service

- **AWS KMS**: AWS Key Management Service
- **HashiCorp Vault**: Secret management
- **Azure Key Vault**: Azure key management
- **Google Cloud KMS**: GCP key management

#### Option 3: Redis (for multi-instance)

```javascript
const redis = require('redis');
const client = redis.createClient();

async function storeKeys(serviceId, keyPair) {
  await client.set(
    `service:${serviceId}:publicKey`,
    keyPair.publicKey
  );
  await client.set(
    `service:${serviceId}:privateKey`,
    keyPair.privateKey
  );
}
```

---

## 📝 Example: Complete Key Access Workflow

```javascript
// 1. Import the key store module
const {
  generateAndStoreKeys,
  getPublicKey,
  getKeyMetadata,
  getAllServiceIds
} = require('./src/security/serviceKeyStore');

// 2. Generate keys for a new service
async function registerService() {
  const serviceId = 'service-1234567890';
  const serviceName = 'my-service';
  
  const keyPair = await generateAndStoreKeys(serviceId, serviceName, {
    modulusLength: 2048
  });
  
  console.log('Keys generated:', {
    hasPublicKey: !!keyPair.publicKey,
    hasPrivateKey: !!keyPair.privateKey,
    algorithm: keyPair.algorithm,
    keySize: keyPair.keySize
  });
  
  return keyPair;
}

// 3. Retrieve public key for JWT verification
function verifyJWT(serviceId, token) {
  const publicKey = getPublicKey(serviceId);
  if (!publicKey) {
    throw new Error('Service not found');
  }
  
  // Use publicKey to verify JWT
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, publicKey);
}

// 4. List all services with keys
function listAllServices() {
  const serviceIds = getAllServiceIds();
  const services = serviceIds.map(id => getKeyMetadata(id));
  return services;
}

// 5. Usage
(async () => {
  // Register a service
  const keyPair = await registerService();
  
  // List all services
  const services = listAllServices();
  console.log('All services:', services);
  
  // Get public key for verification
  const publicKey = getPublicKey('service-1234567890');
  console.log('Public key:', publicKey);
})();
```

---

## 🔍 Debugging: View Keys in Console

Add this to your code temporarily for debugging:

```javascript
// In test-server.js or your app
const { getAllServiceIds, getKeyMetadata, getPublicKey } = require('./src/security/serviceKeyStore');

// Log all keys (metadata only)
console.log('=== All Services with Keys ===');
const serviceIds = getAllServiceIds();
serviceIds.forEach(serviceId => {
  const metadata = getKeyMetadata(serviceId);
  console.log(`Service: ${metadata.serviceName} (${serviceId})`);
  console.log(`  Algorithm: ${metadata.algorithm}`);
  console.log(`  Key Size: ${metadata.keySize} bits`);
  console.log(`  Generated: ${metadata.generatedAt}`);
  console.log(`  Public Key: ${getPublicKey(serviceId).substring(0, 50)}...`);
});
```

---

## ✅ Summary

1. **Storage**: In-memory `Map` in `serviceKeyStore.js`
2. **Access**: Use exported functions from `serviceKeyStore.js`
3. **Registration**: Keys automatically returned in `/register` response
4. **Verification**: Public keys automatically looked up during JWT verification
5. **Production**: Replace with database or key management service

**Remember**: Private keys are sensitive! Only access them when absolutely necessary, and always use HTTPS in production.


