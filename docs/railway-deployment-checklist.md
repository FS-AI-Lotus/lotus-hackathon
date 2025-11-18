# 🚂 Railway Deployment Checklist

## Quick Reference: Variables to Add in Railway

### 🔐 Required Sealed Variables (Sensitive - Must Seal!)

| Variable Name | Description | Example Value | Seal? |
|--------------|-------------|---------------|-------|
| `SERVICE_JWT_PUBLIC_KEY` | Public key for JWT verification | `-----BEGIN PUBLIC KEY-----\n...` | ✅ **YES** |
| `SERVICE_JWT_ISSUER` | JWT issuer identifier | `coordinator` | ✅ **YES** |
| `SERVICE_JWT_AUDIENCE` | JWT audience (optional) | `coordinator-api` | ✅ **YES** |
| `DATABASE_URL` | Database connection string (if using) | `postgresql://user:pass@host:5432/db` | ✅ **YES** |

### 📝 Non-Sensitive Variables (Don't Need to Seal)

| Variable Name | Description | Example Value | Seal? |
|--------------|-------------|---------------|-------|
| `PORT` | Service port | `3000` | ❌ No |
| `NODE_ENV` | Environment | `production` | ❌ No |
| `COORDINATOR_HOST` | Coordinator hostname | `your-app.railway.app:3000` | ❌ No |
| `ENVIRONMENT` | Environment name | `production` | ❌ No |

---

## 🎯 Step-by-Step: Add Variables to Railway

### Step 1: Generate Keys (If Not Already Done)

```bash
# Generate RSA key pair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# View public key (copy this)
cat public.pem

# View private key (keep this secure, but you'll use it for services)
cat private.pem
```

### Step 2: Add Variables in Railway

1. **Go to Railway Dashboard**
   - https://railway.app
   - Select your project
   - Click on your service

2. **Click "Variables" Tab**

3. **Add Each Variable:**

   **a. SERVICE_JWT_PUBLIC_KEY**
   - Click "New Variable"
   - Name: `SERVICE_JWT_PUBLIC_KEY`
   - Value: Paste entire public key (including BEGIN/END lines)
   - Click "Add"
   - Click three-dot menu → **"Seal"** ✅

   **b. SERVICE_JWT_ISSUER**
   - Name: `SERVICE_JWT_ISSUER`
   - Value: `coordinator`
   - Click "Add"
   - Click three-dot menu → **"Seal"** ✅

   **c. PORT**
   - Name: `PORT`
   - Value: `3000`
   - Click "Add"
   - Don't seal (not sensitive)

   **d. NODE_ENV**
   - Name: `NODE_ENV`
   - Value: `production`
   - Click "Add"
   - Don't seal (not sensitive)

### Step 3: Verify Variables

After adding, your variables should look like:

```
SERVICE_JWT_PUBLIC_KEY    ••••••••  [Sealed] ✅
SERVICE_JWT_ISSUER        ••••••••  [Sealed] ✅
PORT                      3000
NODE_ENV                  production
```

---

## 🔍 How Your App Accesses Variables

Your code already reads from environment variables:

```javascript
// src/config/index.js automatically reads:
process.env.SERVICE_JWT_PUBLIC_KEY  // ✅ Available
process.env.SERVICE_JWT_ISSUER      // ✅ Available
process.env.PORT                     // ✅ Available
```

**No code changes needed!** Railway automatically injects variables as `process.env`.

---

## 📋 Complete Variable List for Your App

### Minimum Required (For Basic Deployment)

```bash
SERVICE_JWT_PUBLIC_KEY=<your-public-key>     # Seal ✅
SERVICE_JWT_ISSUER=coordinator                # Seal ✅
PORT=3000                                     # Don't seal
NODE_ENV=production                           # Don't seal
```

### Full Production Setup (If Using Database)

```bash
# JWT Configuration
SERVICE_JWT_PUBLIC_KEY=<your-public-key>     # Seal ✅
SERVICE_JWT_ISSUER=coordinator                # Seal ✅
SERVICE_JWT_AUDIENCE=coordinator-api          # Seal ✅

# Service Configuration
PORT=3000                                     # Don't seal
NODE_ENV=production                           # Don't seal

# Database (if using)
DATABASE_URL=postgresql://...                 # Seal ✅

# Monitoring
COORDINATOR_HOST=your-app.railway.app:3000   # Don't seal
ENVIRONMENT=production                         # Don't seal
```

---

## ✅ Pre-Deployment Checklist

- [ ] Generated RSA key pair
- [ ] Added `SERVICE_JWT_PUBLIC_KEY` to Railway → **Sealed** ✅
- [ ] Added `SERVICE_JWT_ISSUER` to Railway → **Sealed** ✅
- [ ] Added `PORT=3000` to Railway
- [ ] Added `NODE_ENV=production` to Railway
- [ ] Verified all sealed variables show `••••••••`
- [ ] Deployed application
- [ ] Tested that app starts successfully
- [ ] Verified JWT authentication works

---

## 🚨 Important Security Notes

1. **Always Seal Sensitive Variables**
   - Keys, passwords, tokens → Seal ✅
   - Config values → Don't seal

2. **Multi-Line Values Work**
   - PEM keys with newlines work fine
   - Paste entire key including BEGIN/END lines

3. **Can't Retrieve Sealed Values**
   - Keep backups in secure password manager
   - You can't "unseal" to see the value

4. **Automatic Injection**
   - Variables are available as `process.env.VARIABLE_NAME`
   - No code changes needed
   - Works immediately after deployment

---

## 🎯 Quick Start Commands

### Generate Keys Locally

```bash
# Generate keys
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# View public key (copy this to Railway)
cat public.pem
```

### Add to Railway

1. Railway Dashboard → Your Service → Variables
2. Add `SERVICE_JWT_PUBLIC_KEY` → Paste public key → **Seal** ✅
3. Add `SERVICE_JWT_ISSUER` → `coordinator` → **Seal** ✅
4. Add `PORT` → `3000`
5. Add `NODE_ENV` → `production`
6. Deploy!

---

## 📚 Related Documentation

- Full guide: `docs/railway-secrets-guide.md`
- Railway docs: https://docs.railway.com/guides/variables
- Your config: `src/config/index.js`

---

**Your app is Railway-ready!** Just add the variables and seal the sensitive ones. 🚀


