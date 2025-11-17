#!/usr/bin/env node

/**
 * JWT Generation Script
 * 
 * Generates a JWT token for service-to-service authentication using RS256/ES256.
 * 
 * Usage:
 *   node scripts/generateServiceJwt.js <service-id> [options]
 * 
 * Options:
 *   --role <role>     Service role (optional)
 *   --scope <scope>   Service scope (optional, comma-separated)
 *   --exp <minutes>   Token expiration in minutes (default: 60)
 * 
 * Environment Variables:
 *   SERVICE_JWT_PRIVATE_KEY - Private key for signing (required)
 *   SERVICE_JWT_ISSUER      - Token issuer (required)
 *   SERVICE_JWT_AUDIENCE    - Token audience (optional)
 * 
 * Example:
 *   SERVICE_JWT_PRIVATE_KEY="..." SERVICE_JWT_ISSUER="coordinator" \
 *   node scripts/generateServiceJwt.js my-service --role admin
 */

const jwt = require('jsonwebtoken');
const { getConfig } = require('../src/config');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    serviceId: null,
    role: null,
    scope: null,
    expMinutes: 60,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--role' && i + 1 < args.length) {
      options.role = args[++i];
    } else if (arg === '--scope' && i + 1 < args.length) {
      options.scope = args[i + 1].split(',').map(s => s.trim());
      i++;
    } else if (arg === '--exp' && i + 1 < args.length) {
      options.expMinutes = parseInt(args[++i], 10);
      if (isNaN(options.expMinutes) || options.expMinutes < 1) {
        console.error('Error: --exp must be a positive number');
        process.exit(1);
      }
    } else if (!arg.startsWith('--') && !options.serviceId) {
      options.serviceId = arg;
    }
  }

  if (!options.serviceId) {
    options.serviceId = 'default-service';
  }

  return options;
}

/**
 * Generate JWT token
 * @param {Object} options - Token generation options
 * @returns {string} JWT token
 */
function generateServiceJwt(options) {
  const config = getConfig('development'); // Use development config for script

  if (!config.jwt.privateKey) {
    throw new Error('SERVICE_JWT_PRIVATE_KEY environment variable is required');
  }

  if (!config.jwt.issuer) {
    throw new Error('SERVICE_JWT_ISSUER environment variable is required');
  }

  // Build token payload
  const payload = {
    sub: options.serviceId,
    service_id: options.serviceId, // Also include for compatibility
    iss: config.jwt.issuer,
    iat: Math.floor(Date.now() / 1000), // Issued at
    exp: Math.floor(Date.now() / 1000) + (options.expMinutes * 60), // Expiration
  };

  // Add optional claims
  if (options.role) {
    payload.role = options.role;
  }

  if (options.scope && options.scope.length > 0) {
    payload.scope = options.scope;
  }

  // Add audience if configured
  if (config.jwt.audience) {
    payload.aud = config.jwt.audience;
  }

  // Sign token with RS256 (or ES256 if configured)
  const signOptions = {
    algorithm: 'RS256', // Default to RS256
  };

  const token = jwt.sign(payload, config.jwt.privateKey, signOptions);

  return token;
}

// Main execution
if (require.main === module) {
  try {
    const options = parseArgs();
    const token = generateServiceJwt(options);

    // Print token to stdout
    console.log(token);

    // Optionally print token info (for debugging)
    if (process.env.DEBUG === 'true') {
      const decoded = jwt.decode(token, { complete: true });
      console.error('\nToken Info:');
      console.error('  Service ID:', options.serviceId);
      console.error('  Issuer:', decoded.payload.iss);
      console.error('  Expires:', new Date(decoded.payload.exp * 1000).toISOString());
      if (decoded.payload.role) {
        console.error('  Role:', decoded.payload.role);
      }
      if (decoded.payload.scope) {
        console.error('  Scope:', decoded.payload.scope);
      }
    }
  } catch (error) {
    console.error('Error generating JWT:', error.message);
    process.exit(1);
  }
}

// Export for testing
module.exports = { generateServiceJwt, parseArgs };

