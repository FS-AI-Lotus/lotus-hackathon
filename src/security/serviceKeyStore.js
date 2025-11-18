/**
 * Service Key Store
 * 
 * Manages RSA key pairs for registered microservices.
 * Stores public keys for verification and manages private key distribution.
 * 
 * In production, this should be replaced with a proper database or key management service.
 */

const { generateKeyPair } = require('./keyPairGenerator');
const { audit, security } = require('../logger');

/**
 * In-memory key store (for testing/development)
 * In production, use a database or key management service
 */
const serviceKeys = new Map(); // serviceId -> { publicKey, privateKey, ... }

/**
 * Generate and store key pair for a service (asynchronous, non-blocking)
 * 
 * @param {string} serviceId - Unique service identifier
 * @param {string} serviceName - Human-readable service name
 * @param {Object} options - Key generation options
 * @returns {Promise<Object>} Promise resolving to key pair with publicKey and privateKey
 */
async function generateAndStoreKeys(serviceId, serviceName, options = {}) {
  // Check if service already has keys
  if (serviceKeys.has(serviceId)) {
    const existing = serviceKeys.get(serviceId);
    audit(
      { serviceId, serviceName, reason: 'key_regeneration_skipped' },
      `Service ${serviceName} (${serviceId}) already has keys. Returning existing keys.`
    );
    return {
      publicKey: existing.publicKey,
      privateKey: existing.privateKey,
      algorithm: existing.algorithm,
      keySize: existing.keySize,
      generatedAt: existing.generatedAt,
      isNew: false,
    };
  }

  // Generate new key pair asynchronously (non-blocking)
  const keyPair = await generateKeyPair(options);

  // Store keys
  serviceKeys.set(serviceId, {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    algorithm: keyPair.algorithm,
    keySize: keyPair.keySize,
    generatedAt: keyPair.generatedAt,
    serviceName,
    serviceId,
  });

  audit(
    { serviceId, serviceName, keySize: keyPair.keySize },
    `Generated RSA key pair for service: ${serviceName} (${serviceId})`
  );

  return {
    ...keyPair,
    isNew: true,
  };
}

/**
 * Get public key for a service (for JWT verification)
 * 
 * @param {string} serviceId - Service identifier
 * @returns {string|null} Public key in PEM format, or null if not found
 */
function getPublicKey(serviceId) {
  const keys = serviceKeys.get(serviceId);
  return keys ? keys.publicKey : null;
}

/**
 * Get private key for a service (for JWT signing)
 * WARNING: Private keys should only be returned during initial registration
 * 
 * @param {string} serviceId - Service identifier
 * @returns {string|null} Private key in PEM format, or null if not found
 */
function getPrivateKey(serviceId) {
  const keys = serviceKeys.get(serviceId);
  if (!keys) {
    return null;
  }

  security(
    { serviceId, reason: 'private_key_accessed' },
    `Private key accessed for service: ${serviceId}`
  );

  return keys.privateKey;
}

/**
 * Check if service has keys
 * 
 * @param {string} serviceId - Service identifier
 * @returns {boolean} True if service has keys
 */
function hasKeys(serviceId) {
  return serviceKeys.has(serviceId);
}

/**
 * Remove keys for a service (e.g., when service is deregistered)
 * 
 * @param {string} serviceId - Service identifier
 * @returns {boolean} True if keys were removed, false if service had no keys
 */
function removeKeys(serviceId) {
  if (serviceKeys.has(serviceId)) {
    const keys = serviceKeys.get(serviceId);
    serviceKeys.delete(serviceId);
    
    audit(
      { serviceId, serviceName: keys.serviceName, reason: 'keys_removed' },
      `Removed keys for service: ${keys.serviceName} (${serviceId})`
    );
    
    return true;
  }
  return false;
}

/**
 * Get all se.vice IDs that have keys
 * 
 * @returns {string[]} Array of service IDs
 */
function getAllServiceIds() {
  return Array.from(serviceKeys.keys());
}

/**
 * Get key metadata for a service (without exposing private key)
 * 
 * @param {string} serviceId - Service identifier
 * @returns {Object|null} Key metadata or null if not found
 */
function getKeyMetadata(serviceId) {
  const keys = serviceKeys.get(serviceId);
  if (!keys) {
    return null;
  }

  return {
    serviceId: keys.serviceId,
    serviceName: keys.serviceName,
    algorithm: keys.algorithm,
    keySize: keys.keySize,
    generatedAt: keys.generatedAt,
    hasPublicKey: !!keys.publicKey,
    hasPrivateKey: !!keys.privateKey,
  };
}

/**
 * Clear all keys (useful for testing)
 */
function clearAllKeys() {
  const count = serviceKeys.size;
  serviceKeys.clear();
  return count;
}

module.exports = {
  generateAndStoreKeys, // Asynchronous (non-blocking)
  getPublicKey,
  getPrivateKey,
  hasKeys,
  removeKeys,
  getAllServiceIds,
  getKeyMetadata,
  clearAllKeys,
};

