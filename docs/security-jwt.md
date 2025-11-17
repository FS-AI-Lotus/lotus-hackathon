# JWT Security - Asymmetric Authentication

This document describes the JWT (JSON Web Token) authentication implementation for service-to-service communication in the Coordinator service.

## Overview

We use **asymmetric JWT** (RS256) for service-to-service authentication. This means:

- **Verifiers** (Coordinator service) only need the **public key** to verify tokens
- **Issuers** (services generating tokens) need the **private key** to sign tokens
- **No symmetric secrets** (HS256) are used - this is more secure and scalable

### Key Principle

> **We use asymmetric JWT (RS256). Verifiers only use the public key; only the issuer holds the private key. No symmetric HS256 secrets.**

## Architecture

```
┌─────────────────┐                    ┌──────────────────┐
│  Service A      │                    │  Coordinator      │
│  (Issuer)       │                    │  (Verifier)       │
│                 │                    │                   │
│  Private Key    │───Signs Token─────▶│  Public Key       │
│  (RS256)        │                    │  (RS256)          │
│                 │                    │                   │
│  Generates JWT  │                    │  Verifies JWT    │
└─────────────────┘                    └──────────────────┘
```

## Environment Variables

### Required (Production/Development)

- **`SERVICE_JWT_PUBLIC_KEY`**: Public key (PEM format) for verifying JWT tokens
  - Used by Coordinator to verify incoming tokens
  - Can be safely shared across services
  - Example: RSA public key in PEM format

- **`SERVICE_JWT_ISSUER`**: Expected issuer (`iss` claim) in JWT tokens
  - All tokens must have this issuer to be accepted
  - Example: `"coordinator"` or `"service-registry"`

### Optional

- **`SERVICE_JWT_AUDIENCE`**: Expected audience (`aud` claim) in JWT tokens
  - If set, tokens must include this audience
  - Example: `"coordinator-api"`

### For JWT Generation (Issuer/Dev Scripts Only)

- **`SERVICE_JWT_PRIVATE_KEY`**: Private key (PEM format) for signing JWT tokens
  - **NEVER** commit this to version control
  - **NEVER** share this with verifiers
  - Only needed by services that generate tokens
  - Example: RSA private key in PEM format

## JWT Token Structure

### Required Claims

- **`sub`** or **`service_id`**: Service identifier (required)
  - Identifies which service is making the request
  - Example: `"my-service"` or `"user-service-v1"`

- **`iss`**: Issuer (required)
  - Must match `SERVICE_JWT_ISSUER` environment variable
  - Example: `"coordinator"`

- **`iat`**: Issued at (automatically set)
  - Unix timestamp when token was created

- **`exp`**: Expiration (automatically set)
  - Unix timestamp when token expires
  - Default: 60 minutes from issue time

### Optional Claims

- **`aud`**: Audience (optional)
  - Must match `SERVICE_JWT_AUDIENCE` if configured
  - Example: `"coordinator-api"`

- **`role`**: Service role (optional)
  - For future RBAC implementation
  - Example: `"admin"`, `"readonly"`

- **`scope`**: Service scopes (optional)
  - Array of permissions/scopes
  - Example: `["read", "write"]`

### Example Token Payload

```json
{
  "sub": "my-service",
  "service_id": "my-service",
  "iss": "coordinator",
  "aud": "coordinator-api",
  "role": "admin",
  "scope": ["read", "write"],
  "iat": 1704067200,
  "exp": 1704070800
}
```

## Usage

### Generating JWT Tokens

Use the provided script to generate tokens for testing:

```bash
# Basic usage
SERVICE_JWT_PRIVATE_KEY="..." SERVICE_JWT_ISSUER="coordinator" \
  node scripts/generateServiceJwt.js my-service

# With role and scope
SERVICE_JWT_PRIVATE_KEY="..." SERVICE_JWT_ISSUER="coordinator" \
  node scripts/generateServiceJwt.js my-service --role admin --scope read,write

# Custom expiration (30 minutes)
SERVICE_JWT_PRIVATE_KEY="..." SERVICE_JWT_ISSUER="coordinator" \
  node scripts/generateServiceJwt.js my-service --exp 30
```

### Using JWT Tokens in Requests

Include the token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/register
```

### Verifying Tokens (Middleware)

The JWT middleware automatically verifies tokens on protected routes:

```javascript
const authServiceJwtMiddleware = require('./src/security/authServiceJwtMiddleware');

// Apply to protected routes
app.use('/register', authServiceJwtMiddleware);
app.use('/route', authServiceJwtMiddleware);
```

### Accessing Service Context

After successful verification, the service context is available in `req.serviceContext`:

```javascript
app.post('/register', authServiceJwtMiddleware, (req, res) => {
  const serviceId = req.serviceContext.serviceId;
  const role = req.serviceContext.role;
  const claims = req.serviceContext.claims;
  
  // Use service context...
});
```

## Security Considerations

### Algorithm Restrictions

- **Only RS256/ES256** are allowed (asymmetric algorithms)
- **HS256 is rejected** (symmetric algorithm - not secure for distributed systems)
- Algorithm is enforced in middleware configuration

### Token Validation

The middleware validates:

1. **Token format**: Must be valid JWT structure
2. **Signature**: Must be signed with matching public key
3. **Algorithm**: Must be RS256 or ES256
4. **Issuer**: Must match `SERVICE_JWT_ISSUER`
5. **Audience**: Must match `SERVICE_JWT_AUDIENCE` (if configured)
6. **Expiration**: Token must not be expired
7. **Claims**: Must have `sub` or `service_id` claim

### Error Responses

- **401 Unauthorized**: Invalid token, expired token, missing token, wrong algorithm
- **403 Forbidden**: Wrong issuer/audience (authorization failure)
- **500 Internal Server Error**: Configuration error (missing public key)

## Key Management

### Generating RSA Key Pair

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem
```

### Best Practices

1. **Never commit private keys** to version control
2. **Use environment variables** or secrets management (e.g., Kubernetes secrets, HashiCorp Vault)
3. **Rotate keys regularly** (e.g., every 90 days)
4. **Use different keys** for different environments (dev, staging, production)
5. **Monitor key usage** and revoke compromised keys immediately
6. **Use strong key sizes** (2048 bits minimum for RSA)

## Testing

### Test Key Generation

For testing, you can generate a test key pair:

```javascript
const crypto = require('crypto');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
```

### Test Token Generation

```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    sub: 'test-service',
    iss: 'test-issuer',
  },
  privateKey,
  { algorithm: 'RS256' }
);
```

## Integration with Coordinator

The JWT middleware is ready to be integrated into Coordinator routes in Iteration 3:

```javascript
// In coordinator/app.js
const authServiceJwtMiddleware = require('../src/security/authServiceJwtMiddleware');

// Protect routes
app.post('/register', authServiceJwtMiddleware, registerHandler);
app.post('/route', authServiceJwtMiddleware, routeHandler);
```

## Files

- **`src/security/authServiceJwtMiddleware.js`**: JWT verification middleware
- **`scripts/generateServiceJwt.js`**: JWT generation script
- **`tests/authServiceJwtMiddleware.test.js`**: Middleware tests
- **`tests/generateServiceJwt.test.js`**: Generation script tests

## Next Steps

- **Iteration 3**: Attach JWT middleware to protected routes
- **Iteration 4**: Add audit logging for authentication events
- **Future**: Implement RBAC using `role` and `scope` claims

---

**Remember**: Asymmetric JWT (RS256) is more secure than symmetric (HS256) because verifiers don't need the signing secret. Only the issuer holds the private key! 🔐

