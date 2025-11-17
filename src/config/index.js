/**
 * Configuration Module
 * 
 * Centralized configuration management with environment variable validation.
 * Validates required values and provides typed config object.
 * 
 * Environment Variables:
 * - SERVICE_JWT_PRIVATE_KEY: Private key for JWT signing (issuer/dev script only)
 * - SERVICE_JWT_PUBLIC_KEY: Public key for JWT verification (required in production)
 * - SERVICE_JWT_ISSUER: Expected JWT issuer (required)
 * - SERVICE_JWT_AUDIENCE: Optional JWT audience
 * - PORT: Service port (default: 3000)
 * - NODE_ENV: Environment (development, production, test)
 * - COORDINATOR_HOST: Coordinator hostname:port for Prometheus (default: localhost:3000)
 * - METRICS_PORT: Optional separate port for metrics (if not provided, uses PORT)
 */

const requiredEnvVars = {
  production: [
    'SERVICE_JWT_PUBLIC_KEY',
    'SERVICE_JWT_ISSUER',
  ],
  development: [
    'SERVICE_JWT_PUBLIC_KEY',
    'SERVICE_JWT_ISSUER',
  ],
  test: [], // Allow overrides in test environment
};

/**
 * Validates that required environment variables are present
 * @param {string} env - Environment name (production, development, test)
 * @throws {Error} If required env vars are missing
 */
function validateEnv(env = process.env.NODE_ENV || 'development') {
  const required = requiredEnvVars[env] || requiredEnvVars.development;
  const missing = [];

  for (const varName of required) {
    if (!process.env[varName] || process.env[varName].trim() === '') {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for ${env} environment: ${missing.join(', ')}`
    );
  }
}

/**
 * Get configuration object with validated environment variables
 * @param {string} env - Environment name (optional, defaults to NODE_ENV)
 * @returns {Object} Configuration object
 */
function getConfig(env = process.env.NODE_ENV || 'development') {
  // Validate required env vars (skip in test if explicitly allowed)
  if (env !== 'test' || process.env.SKIP_ENV_VALIDATION !== 'true') {
    validateEnv(env);
  }

  const config = {
    // Service configuration
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: env,
    
    // JWT Configuration
    jwt: {
      privateKey: process.env.SERVICE_JWT_PRIVATE_KEY || null,
      publicKey: process.env.SERVICE_JWT_PUBLIC_KEY || null,
      issuer: process.env.SERVICE_JWT_ISSUER || null,
      audience: process.env.SERVICE_JWT_AUDIENCE || null,
    },
    
    // Monitoring configuration
    monitoring: {
      coordinatorHost: process.env.COORDINATOR_HOST || 'localhost:3000',
      metricsPort: process.env.METRICS_PORT 
        ? parseInt(process.env.METRICS_PORT, 10)
        : null, // If not set, metrics use main PORT
    },
  };

  // Validate port is a valid number
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid PORT value: ${process.env.PORT}. Must be a number between 1 and 65535.`);
  }

  if (config.monitoring.metricsPort !== null) {
    if (isNaN(config.monitoring.metricsPort) || config.monitoring.metricsPort < 1 || config.monitoring.metricsPort > 65535) {
      throw new Error(`Invalid METRICS_PORT value: ${process.env.METRICS_PORT}. Must be a number between 1 and 65535.`);
    }
  }

  return config;
}

// Export singleton config instance
let configInstance = null;

/**
 * Get or create config instance (singleton pattern)
 * @returns {Object} Configuration object
 */
function config() {
  if (!configInstance) {
    configInstance = getConfig();
  }
  return configInstance;
}

/**
 * Reset config instance (useful for testing)
 */
function resetConfig() {
  configInstance = null;
}

module.exports = {
  config,
  getConfig,
  validateEnv,
  resetConfig,
};

