# ☁️ Cloud Key Storage for Production

## ✅ Yes, Keys Should Be in the Cloud!

For **production**, keys should be stored in:
- ☁️ **Cloud Database** (AWS RDS, Azure Database, MongoDB Atlas, etc.)
- 🔐 **Cloud Key Management Service** (AWS KMS, Azure Key Vault, HashiCorp Vault, etc.)
- 💾 **Cloud Storage** with encryption (AWS S3, Azure Blob Storage, etc.)

---

## 🚨 Current Implementation (Development Only)

**Current:** Keys stored in RAM (in-memory only)
- ❌ Lost on server restart
- ❌ Not shared across instances
- ❌ No backup
- ❌ Not suitable for production

**For Production:** Must use cloud storage!

---

## ☁️ Cloud Storage Options

### Option 1: Cloud Database (Recommended)

#### AWS RDS (PostgreSQL/MySQL)

```javascript
// Example: AWS RDS PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,        // e.g., mydb.xxxxx.us-east-1.rds.amazonaws.com
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false } // Required for AWS RDS
});

async function storeKeys(serviceId, keyPair) {
  await pool.query(
    `INSERT INTO service_keys 
     (service_id, service_name, public_key, private_key, algorithm, key_size, created_at) 
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (service_id) DO UPDATE SET
       public_key = EXCLUDED.public_key,
       private_key = EXCLUDED.private_key,
       updated_at = NOW()`,
    [
      serviceId,
      keyPair.serviceName,
      keyPair.publicKey,
      keyPair.privateKey,
      keyPair.algorithm,
      keyPair.keySize,
      new Date()
    ]
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

**Database Schema:**
```sql
CREATE TABLE service_keys (
  service_id VARCHAR(255) PRIMARY KEY,
  service_name VARCHAR(255) NOT NULL,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  algorithm VARCHAR(50) DEFAULT 'RS256',
  key_size INTEGER DEFAULT 2048,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX idx_service_keys_service_id ON service_keys(service_id);
```

#### MongoDB Atlas (Cloud MongoDB)

```javascript
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);

async function storeKeys(serviceId, keyPair) {
  await client.db('coordinator').collection('service_keys').updateOne(
    { serviceId },
    {
      $set: {
        serviceId,
        serviceName: keyPair.serviceName,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        algorithm: keyPair.algorithm,
        keySize: keyPair.keySize,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
}

async function getPublicKey(serviceId) {
  const doc = await client.db('coordinator')
    .collection('service_keys')
    .findOne({ serviceId });
  return doc?.publicKey || null;
}
```

---

### Option 2: Cloud Key Management Service (Most Secure)

#### AWS KMS (Key Management Service)

```javascript
const { KMSClient, CreateKeyCommand, GetPublicKeyCommand } = require('@aws-sdk/client-kms');

const kmsClient = new KMSClient({ region: process.env.AWS_REGION });

async function generateAndStoreKeys(serviceId, serviceName) {
  // Create a new key in AWS KMS
  const createKeyResponse = await kmsClient.send(
    new CreateKeyCommand({
      Description: `Key for service: ${serviceName}`,
      KeyUsage: 'SIGN_VERIFY',
      KeySpec: 'RSA_2048'
    })
  );

  const keyId = createKeyResponse.KeyMetadata.KeyId;

  // Get public key
  const publicKeyResponse = await kmsClient.send(
    new GetPublicKeyCommand({ KeyId: keyId })
  );

  // Store key ID in database (not the actual keys)
  await storeKeyMetadata(serviceId, {
    keyId,
    publicKey: publicKeyResponse.PublicKey.toString('base64'),
    algorithm: 'RS256',
    keySize: 2048
  });

  return {
    keyId, // Services use this to sign with KMS
    publicKey: publicKeyResponse.PublicKey.toString('base64')
  };
}
```

#### Azure Key Vault

```javascript
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

const credential = new DefaultAzureCredential();
const client = new SecretClient(
  process.env.AZURE_KEY_VAULT_URL,
  credential
);

async function storeKeys(serviceId, keyPair) {
  // Store private key as secret
  await client.setSecret(
    `service-${serviceId}-private-key`,
    keyPair.privateKey
  );

  // Store public key (can be public)
  await client.setSecret(
    `service-${serviceId}-public-key`,
    keyPair.publicKey
  );
}

async function getPublicKey(serviceId) {
  const secret = await client.getSecret(`service-${serviceId}-public-key`);
  return secret.value;
}
```

#### HashiCorp Vault (Cloud or Self-Hosted)

```javascript
const vault = require('node-vault')({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

async function storeKeys(serviceId, keyPair) {
  await vault.write(`secret/data/service-keys/${serviceId}`, {
    data: {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      algorithm: keyPair.algorithm,
      keySize: keyPair.keySize
    }
  });
}

async function getPublicKey(serviceId) {
  const result = await vault.read(`secret/data/service-keys/${serviceId}`);
  return result.data.data.publicKey;
}
```

---

### Option 3: Cloud Storage with Encryption

#### AWS S3 (Encrypted)

```javascript
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Encryption key (store in AWS Secrets Manager or KMS)
const encryptionKey = process.env.ENCRYPTION_KEY;

function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encrypted) {
  const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function storeKeys(serviceId, keyPair) {
  // Encrypt private key before storing
  const encryptedPrivateKey = encrypt(keyPair.privateKey);

  // Store in S3
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `service-keys/${serviceId}/private-key`,
    Body: encryptedPrivateKey,
    ServerSideEncryption: 'AES256'
  }));

  // Public key doesn't need encryption
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `service-keys/${serviceId}/public-key`,
    Body: keyPair.publicKey,
    ServerSideEncryption: 'AES256'
  }));
}

async function getPublicKey(serviceId) {
  const result = await s3Client.send(new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `service-keys/${serviceId}/public-key`
  }));
  
  return await result.Body.transformToString();
}
```

---

## 🔄 Migration: In-Memory to Cloud

### Step 1: Create Cloud Storage Adapter

Create `src/security/cloudKeyStore.js`:

```javascript
/**
 * Cloud Key Store Adapter
 * 
 * Replace in-memory storage with cloud storage
 */

// Example: PostgreSQL adapter
const { Pool } = require('pg');

class CloudKeyStore {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async generateAndStoreKeys(serviceId, serviceName, options = {}) {
    const { generateKeyPair } = require('./keyPairGenerator');
    const keyPair = await generateKeyPair(options);

    await this.pool.query(
      `INSERT INTO service_keys 
       (service_id, service_name, public_key, private_key, algorithm, key_size) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (service_id) DO UPDATE SET
         public_key = EXCLUDED.public_key,
         private_key = EXCLUDED.private_key`,
      [
        serviceId,
        serviceName,
        keyPair.publicKey,
        keyPair.privateKey,
        keyPair.algorithm,
        keyPair.keySize
      ]
    );

    return { ...keyPair, isNew: true };
  }

  async getPublicKey(serviceId) {
    const result = await this.pool.query(
      'SELECT public_key FROM service_keys WHERE service_id = $1',
      [serviceId]
    );
    return result.rows[0]?.public_key || null;
  }

  async getPrivateKey(serviceId) {
    const result = await this.pool.query(
      'SELECT private_key FROM service_keys WHERE service_id = $1',
      [serviceId]
    );
    return result.rows[0]?.private_key || null;
  }

  // ... implement other methods
}

module.exports = new CloudKeyStore();
```

### Step 2: Update serviceKeyStore.js

```javascript
// src/security/serviceKeyStore.js

// Use cloud storage if DATABASE_URL is set, otherwise use in-memory
const useCloudStorage = !!process.env.DATABASE_URL;

let keyStore;
if (useCloudStorage) {
  keyStore = require('./cloudKeyStore');
} else {
  // Fallback to in-memory for development
  keyStore = require('./inMemoryKeyStore');
}

module.exports = keyStore;
```

---

## 🎯 Recommended Cloud Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Production Environment (Cloud)                        │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Coordinator Service (Multiple Instances)        │  │
│  │  - Instance 1                                    │  │
│  │  - Instance 2                                    │  │
│  │  - Instance 3                                    │  │
│  └──────────────────────────────────────────────────┘  │
│           │                                             │
│           │ (Shared Access)                             │
│           ▼                                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Cloud Database (AWS RDS / Azure DB)            │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │  service_keys table                       │ │  │
│  │  │  - Encrypted at rest                      │ │  │
│  │  │  - Backed up daily                        │ │  │
│  │  │  - Accessible by all instances            │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  OR                                                     │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Key Management Service (AWS KMS / Vault)        │  │
│  │  - Hardware Security Modules (HSM)             │  │
│  │  - Automatic key rotation                       │  │
│  │  - Audit logging                                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Benefits of Cloud Storage

1. **Persistence**: Keys survive server restarts
2. **Scalability**: Multiple instances can share keys
3. **Backup**: Automatic backups and recovery
4. **Security**: Encrypted at rest and in transit
5. **Audit**: Cloud services provide audit logs
6. **High Availability**: Cloud services are highly available
7. **Compliance**: Meet security compliance requirements

---

## 🚀 Quick Start: AWS RDS Example

### 1. Create RDS Database

```bash
# Using AWS CLI
aws rds create-db-instance \
  --db-instance-identifier coordinator-keys \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourPassword123 \
  --allocated-storage 20
```

### 2. Create Table

```sql
CREATE TABLE service_keys (
  service_id VARCHAR(255) PRIMARY KEY,
  service_name VARCHAR(255) NOT NULL,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  algorithm VARCHAR(50) DEFAULT 'RS256',
  key_size INTEGER DEFAULT 2048,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Set Environment Variable

```bash
export DATABASE_URL="postgresql://admin:password@coordinator-keys.xxxxx.us-east-1.rds.amazonaws.com:5432/postgres"
```

### 4. Update Code

Replace in-memory storage with database storage (see migration steps above).

---

## 📝 Summary

**Current (Development):**
- ❌ In-memory only (RAM)
- ❌ Lost on restart
- ❌ Not suitable for production

**Production (Cloud):**
- ✅ Cloud Database (AWS RDS, Azure DB, MongoDB Atlas)
- ✅ Key Management Service (AWS KMS, Azure Key Vault, Vault)
- ✅ Cloud Storage with encryption (AWS S3, Azure Blob)
- ✅ Persistent, secure, scalable

**For your hackathon:** Current in-memory storage is fine for demo/testing, but for production deployment, you should migrate to cloud storage!


