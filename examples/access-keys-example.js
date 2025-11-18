#!/usr/bin/env node

/**
 * Example: How to Access Generated Keys
 * 
 * This script demonstrates how to access keys stored in the serviceKeyStore.
 * 
 * Usage:
 *   node examples/access-keys-example.js
 */

const {
  generateAndStoreKeys,
  getPublicKey,
  getPrivateKey,
  getKeyMetadata,
  getAllServiceIds,
  hasKeys,
  removeKeys,
} = require('../src/security/serviceKeyStore');

async function demonstrateKeyAccess() {
  console.log('=== Key Storage and Access Demo ===\n');

  // 1. Generate keys for a service
  console.log('1. Generating keys for a service...');
  const serviceId = 'example-service-123';
  const serviceName = 'example-service';
  
  const keyPair = await generateAndStoreKeys(serviceId, serviceName, {
    modulusLength: 2048,
  });
  
  console.log('✅ Keys generated successfully!');
  console.log(`   Algorithm: ${keyPair.algorithm}`);
  console.log(`   Key Size: ${keyPair.keySize} bits`);
  console.log(`   Generated At: ${keyPair.generatedAt}`);
  console.log(`   Is New: ${keyPair.isNew}`);
  console.log();

  // 2. Check if service has keys
  console.log('2. Checking if service has keys...');
  if (hasKeys(serviceId)) {
    console.log(`✅ Service ${serviceId} has keys stored`);
  }
  console.log();

  // 3. Get public key (safe, no security logging)
  console.log('3. Getting public key...');
  const publicKey = getPublicKey(serviceId);
  if (publicKey) {
    console.log('✅ Public key retrieved:');
    console.log(`   ${publicKey.substring(0, 50)}...`);
    console.log(`   Full length: ${publicKey.length} characters`);
  }
  console.log();

  // 4. Get key metadata (safe, no private key exposed)
  console.log('4. Getting key metadata...');
  const metadata = getKeyMetadata(serviceId);
  if (metadata) {
    console.log('✅ Key metadata:');
    console.log(`   Service ID: ${metadata.serviceId}`);
    console.log(`   Service Name: ${metadata.serviceName}`);
    console.log(`   Algorithm: ${metadata.algorithm}`);
    console.log(`   Key Size: ${metadata.keySize} bits`);
    console.log(`   Generated At: ${metadata.generatedAt}`);
    console.log(`   Has Public Key: ${metadata.hasPublicKey}`);
    console.log(`   Has Private Key: ${metadata.hasPrivateKey}`);
  }
  console.log();

  // 5. Get private key (⚠️ logs security event)
  console.log('5. Getting private key (⚠️ this logs a security event)...');
  const privateKey = getPrivateKey(serviceId);
  if (privateKey) {
    console.log('✅ Private key retrieved:');
    console.log(`   ${privateKey.substring(0, 50)}...`);
    console.log(`   Full length: ${privateKey.length} characters`);
    console.log('   ⚠️  Security event logged for this access!');
  }
  console.log();

  // 6. List all services with keys
  console.log('6. Listing all services with keys...');
  const allServiceIds = getAllServiceIds();
  console.log(`✅ Found ${allServiceIds.length} service(s) with keys:`);
  allServiceIds.forEach(id => {
    const meta = getKeyMetadata(id);
    console.log(`   - ${meta.serviceName} (${id})`);
  });
  console.log();

  // 7. Try to get keys for non-existent service
  console.log('7. Trying to get keys for non-existent service...');
  const nonExistentId = 'non-existent-service';
  const nonExistentPublicKey = getPublicKey(nonExistentId);
  if (!nonExistentPublicKey) {
    console.log(`✅ Correctly returned null for non-existent service`);
  }
  console.log();

  // 8. Cleanup (optional - remove keys)
  console.log('8. Cleaning up (removing keys)...');
  const removed = removeKeys(serviceId);
  if (removed) {
    console.log(`✅ Keys removed for service ${serviceId}`);
  }
  console.log();

  console.log('=== Demo Complete ===');
}

// Run the demo
if (require.main === module) {
  demonstrateKeyAccess()
    .then(() => {
      console.log('\n✅ All operations completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { demonstrateKeyAccess };


