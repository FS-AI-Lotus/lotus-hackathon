/**
 * Key Pair Generator
 * 
 * Generates RSA key pairs for microservice authentication.
 * Each service gets its own public/private key pair for JWT signing.
 * 
 * All key generation is asynchronous (non-blocking) to avoid blocking the event loop.
 */

const crypto = require('crypto');

/**
 * Generate RSA key pair for a service (asynchronous, non-blocking)
 * 
 * @param {Object} options - Key generation options
 * @param {number} options.modulusLength - RSA key size in bits (default: 2048)
 * @returns {Promise<Object>} Promise resolving to key pair object with publicKey and privateKey (both in PEM format)
 */
function generateKeyPair(options = {}) {
  return new Promise((resolve, reject) => {
    const {
      modulusLength = 2048, // 2048 bits is secure and standard
    } = options;

    crypto.generateKeyPair(
      'rsa',
      {
        modulusLength,
        publicKeyEncoding: {
          type: 'spki',      // SubjectPublicKeyInfo format
          format: 'pem',     // PEM format (text)
        },
        privateKeyEncoding: {
          type: 'pkcs8',     // PKCS#8 format
          format: 'pem',     // PEM format (text)
        },
      },
      (err, publicKey, privateKey) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            publicKey,
            privateKey,
            algorithm: 'RS256',
            keySize: modulusLength,
            generatedAt: new Date().toISOString(),
          });
        }
      }
    );
  });
}

module.exports = {
  generateKeyPair,
};

