# 🔐 Railway Secrets Management Guide

## Overview

Railway provides secure environment variable management with a **"Seal"** feature for sensitive data. This guide shows you how to securely store your application secrets, including JWT keys, database credentials, and API keys.

---

## 🎯 Railway Secrets Features

### Key Features:
- ✅ **Environment Variables**: Store configuration values
- ✅ **Sealed Variables**: Encrypt and hide sensitive values
- ✅ **Service-Level**: Variables scoped to specific services
- ✅ **Project-Level**: Shared variables across services
- ✅ **Automatic Injection**: Available as `process.env` in your app

---

## 📋 Step-by-Step: Adding Secrets to Railway

### Method 1: Via Railway Dashboard (Recommended)

#### Step 1: Access Your Project
1. Go to [Railway Dashboard](https://railway.app)
2. Select your project
3. Click on your service (e.g., "coordinator")

#### Step 2: Open Variables Tab
1. Click on the **"Variables"** tab in your service
2. You'll see a list of existing variables (if any)

#### Step 3: Add a New Variable
1. Click **"New Variable"** button
2. Enter variable name (e.g., `SERVICE_JWT_PUBLIC_KEY`)
3. Enter the value (paste your key/secret)
4. Click **"Add"**

#### Step 4: Seal Sensitive Variables ⚠️ IMPORTANT
1. Find the variable you just added
2. Click the **three-dot menu** (⋯) next to it
3. Select **"Seal"**
4. Confirm the action

**What Sealing Does:**
- ✅ Encrypts the variable value
- ✅ Hides value in UI (shows as `••••••••`)
- ✅ Prevents retrieval via API
- ✅ Still available to your app at runtime
- ⚠️ **Cannot be unsealed** (one-way operation)

---

## 🔑 Variables to Store for Your Application

### Required Variables

#### JWT Configuration
```
SERVICE_JWT_PUBLIC_KEY
SERVICE_JWT_ISSUER
SERVICE_JWT_AUDIENCE (optional)
```

#### Service Configuration
```
PORT=3000
NODE_ENV=production
```

#### Database (if using cloud database)
```
DATABASE_URL
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

#### Monitoring
```
COORDINATOR_HOST
ENVIRONMENT
GRAFANA_CLOUD_TOKEN (if using Grafana Cloud)
```

---

## 📝 Example: Adding JWT Keys to Railway

### Step 1: Generate Keys Locally

```bash
# Generate RSA key pair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Or use Node.js
node -e "const crypto = require('crypto'); const {publicKey, privateKey} = crypto.generateKeyPairSync('rsa', {modulusLength: 2048, publicKeyEncoding: {type: 'spki', format: 'pem'}, privateKeyEncoding: {type: 'pkcs8', format: 'pem'}}); console.log('PUBLIC:\n', publicKey, '\n\nPRIVATE:\n', privateKey);"
```

### Step 2: Add to Railway

1. **Public Key:**
   - Variable Name: `SERVICE_JWT_PUBLIC_KEY`
   - Value: Paste the entire public key (including `-----BEGIN PUBLIC KEY-----` and `-----END PUBLIC KEY-----`)
   - **Seal it** ✅

2. **Issuer:**
   - Variable Name: `SERVICE_JWT_ISSUER`
   - Value: `coordinator` (or your issuer name)
   - Seal it ✅

3. **Audience (optional):**
   - Variable Name: `SERVICE_JWT_AUDIENCE`
   - Value: `coordinator-api`
   - Seal it ✅

### Step 3: Verify in Your Code

Your code already reads from environment variables:

```javascript
// src/config/index.js
const config = {
  jwt: {
    publicKey: process.env.SERVICE_JWT_PUBLIC_KEY,  // ✅ Automatically available
    issuer: process.env.SERVICE_JWT_ISSUER,          // ✅ Automatically available
    audience: process.env.SERVICE_JWT_AUDIENCE,      // ✅ Automatically available
  }
};
```

---

## 🔒 Security Best Practices

### ✅ DO:

1. **Seal All Sensitive Variables**
   - Private keys
   - Database passwords
   - API keys
   - Tokens
   - Any credentials

2. **Use Descriptive Names**
   - `SERVICE_JWT_PUBLIC_KEY` ✅
   - Not `KEY1` ❌

3. **Store Keys as Multi-Line Strings**
   - Railway supports multi-line values
   - Include full PEM format with headers/footers

4. **Never Commit Secrets**
   - Use `.env` file locally (add to `.gitignore`)
   - Use Railway Variables in production

5. **Rotate Keys Regularly**
   - Update sealed variables when rotating keys
   - Old values are automatically replaced

### ❌ DON'T:

1. **Don't Store Secrets in Code**
   ```javascript
   // ❌ BAD
   const API_KEY = "sk_live_1234567890";
   
   // ✅ GOOD
   const API_KEY = process.env.API_KEY;
   ```

2. **Don't Log Secrets**
   ```javascript
   // ❌ BAD
   console.log('Key:', process.env.PRIVATE_KEY);
   
   // ✅ GOOD
   console.log('Key configured:', !!process.env.PRIVATE_KEY);
   ```

3. **Don't Share Sealed Variables**
   - Sealed variables can't be viewed after sealing
   - Keep backups in secure password manager

---

## 🚀 Railway CLI (Alternative Method)

### Install Railway CLI

```bash
# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex

# Mac/Linux
curl -fsSL https://railway.app/install.sh | sh
```

### Login

```bash
railway login
```

### Link Project

```bash
railway link
```

### Set Variables via CLI

**Note:** Railway CLI doesn't directly support setting variables, but you can use the Railway API or dashboard.

**Alternative:** Use Railway API:

```bash
# Get your Railway token from dashboard
export RAILWAY_TOKEN="your-token"

# Set variable via API
curl -X POST \
  "https://api.railway.app/v1/variables" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "your-service-id",
    "name": "SERVICE_JWT_PUBLIC_KEY",
    "value": "-----BEGIN PUBLIC KEY-----\n...",
    "sealed": true
  }'
```

---

## 📦 Complete Example: Setting Up Your App on Railway

### 1. Prepare Your Variables

Create a list of all variables you need:

```bash
# Required
SERVICE_JWT_PUBLIC_KEY=<your-public-key>
SERVICE_JWT_ISSUER=coordinator
PORT=3000
NODE_ENV=production

# Optional
SERVICE_JWT_AUDIENCE=coordinator-api
COORDINATOR_HOST=your-app.railway.app:3000
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### 2. Add to Railway Dashboard

1. Go to Railway → Your Project → Your Service
2. Click "Variables" tab
3. Add each variable
4. **Seal all sensitive ones** (keys, passwords, tokens)

### 3. Deploy

Railway automatically:
- ✅ Injects variables as environment variables
- ✅ Makes them available to your app
- ✅ Keeps sealed variables encrypted

### 4. Verify in Your App

```javascript
// Your app code
const { config } = require('./src/config');

console.log('JWT Issuer:', config().jwt.issuer);
console.log('Public Key configured:', !!config().jwt.publicKey);
// ✅ Variables are automatically available!
```

---

## 🔍 Accessing Variables in Your Application

### Node.js (Your Current Setup)

```javascript
// Already implemented in src/config/index.js
const publicKey = process.env.SERVICE_JWT_PUBLIC_KEY;
const issuer = process.env.SERVICE_JWT_ISSUER;
const port = process.env.PORT || 3000;
```

### Multi-Line Values (PEM Keys)

Railway handles multi-line values correctly. Your PEM keys will work as-is:

```javascript
// Railway automatically handles newlines in sealed variables
const publicKey = process.env.SERVICE_JWT_PUBLIC_KEY;
// Contains:
// -----BEGIN PUBLIC KEY-----
// MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
// -----END PUBLIC KEY-----
```

---

## 🛡️ Sealed Variables: Important Notes

### What Happens When You Seal:

1. **Value is Encrypted**
   - Stored securely in Railway's infrastructure
   - Encrypted at rest

2. **Hidden in UI**
   - Shows as `••••••••` in dashboard
   - Cannot see actual value

3. **Not Retrievable via API**
   - API calls return `null` for sealed values
   - Prevents accidental exposure

4. **Still Available to App**
   - Your app receives the actual value at runtime
   - Works exactly like unsealed variables

5. **Cannot Be Unsealed**
   - One-way operation
   - If you need to see value, you must:
     - Have a backup
     - Re-add the variable (unsealed)
     - Delete and recreate

### When to Seal:

✅ **Seal These:**
- Private keys
- Database passwords
- API keys
- Tokens
- Any credentials

❌ **Don't Seal These:**
- Non-sensitive config (PORT, NODE_ENV)
- Public information
- Values you need to see/edit frequently

---

## 📋 Checklist: Setting Up Secrets on Railway

- [ ] Generate all required keys/secrets locally
- [ ] Create Railway project and service
- [ ] Add `SERVICE_JWT_PUBLIC_KEY` → **Seal it** ✅
- [ ] Add `SERVICE_JWT_ISSUER` → **Seal it** ✅
- [ ] Add `SERVICE_JWT_AUDIENCE` (if needed) → **Seal it** ✅
- [ ] Add `PORT=3000` (no need to seal)
- [ ] Add `NODE_ENV=production` (no need to seal)
- [ ] Add `DATABASE_URL` (if using database) → **Seal it** ✅
- [ ] Add any other API keys/tokens → **Seal them** ✅
- [ ] Deploy your application
- [ ] Verify variables are accessible in your app
- [ ] Test that JWT authentication works

---

## 🔄 Updating Sealed Variables

### To Update a Sealed Variable:

1. Go to Variables tab
2. Find the sealed variable
3. Click three-dot menu (⋯)
4. Select **"Edit"** or **"Delete"**
5. If editing:
   - Enter new value
   - **Seal it again** (if sensitive)
6. Railway will redeploy with new values

### Important:
- Old value is immediately replaced
- No downtime (Railway handles updates gracefully)
- Your app will use new values on next request

---

## 🚨 Security Considerations

### Environment Variable Security:

1. **Access Control**
   - Variables are accessible to your app process
   - Any library/dependency can read `process.env`
   - Only use trusted dependencies

2. **Logging**
   - Never log environment variables
   - Be careful with error messages
   - Filter sensitive data in logs

3. **Backup**
   - Keep backups of sealed variables in secure password manager
   - You can't retrieve sealed values later

4. **Rotation**
   - Rotate keys regularly (every 90 days)
   - Update sealed variables when rotating

---

## 📚 Railway Documentation Links

- [Railway Variables Guide](https://docs.railway.com/guides/variables)
- [Railway Security](https://docs.railway.com/guides/security)
- [Railway CLI](https://docs.railway.com/reference/cli)

---

## ✅ Summary

**For Your Application:**

1. **Add Variables in Railway Dashboard:**
   - Go to Service → Variables tab
   - Add each required variable
   - **Seal sensitive ones** (keys, passwords, tokens)

2. **Variables Automatically Available:**
   - Your code already reads from `process.env`
   - No code changes needed!

3. **Seal Sensitive Data:**
   - JWT keys → Seal ✅
   - Database passwords → Seal ✅
   - API tokens → Seal ✅
   - Non-sensitive config → Don't seal

4. **Deploy:**
   - Railway automatically injects variables
   - Your app works immediately

**Your current code is already Railway-ready!** Just add the variables in Railway dashboard and seal the sensitive ones. 🚀


