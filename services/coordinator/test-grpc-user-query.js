#!/usr/bin/env node

/**
 * Test gRPC with user-related query
 */

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

console.log('🧪 gRPC User Query Test');
console.log('Testing RAG → Coordinator gRPC with user query');
console.log('=' .repeat(60));

async function testGrpcUserQuery() {
  try {
    // Load proto
    const protoPath = path.join(__dirname, 'src/grpc/proto/coordinator.proto');
    console.log('📁 Loading proto from:', protoPath);
    
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });
    
    const proto = grpc.loadPackageDefinition(packageDefinition);
    console.log('✅ Proto loaded successfully');
    
    // Create client
    const client = new proto.rag.v1.CoordinatorService('localhost:50051', grpc.credentials.createInsecure());
    console.log('✅ gRPC client created');
    
    // Test request - user-related query
    const request = {
      tenant_id: 'test-tenant',
      user_id: 'test-user-123',
      query_text: 'Get user profile information',  // This should match user-service
      metadata: {
        source: 'rag',
        confidence: '0.95',
        intent: 'user_query'
      }
    };
    
    console.log('📤 Sending gRPC Route request:');
    console.log(JSON.stringify(request, null, 2));
    
    // Make gRPC call
    const response = await new Promise((resolve, reject) => {
      client.Route(request, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('✅ gRPC Route call successful!');
    console.log('📥 Response:');
    console.log('   Target Services:', response.target_services);
    console.log('   Normalized Fields:', response.normalized_fields);
    console.log('   Envelope JSON:', response.envelope_json ? 'Present' : 'Empty');
    console.log('   Routing Metadata:', response.routing_metadata);
    
    if (response.envelope_json) {
      try {
        const envelope = JSON.parse(response.envelope_json);
        console.log('📦 Parsed Envelope:');
        console.log(JSON.stringify(envelope, null, 2));
      } catch (e) {
        console.log('⚠️  Could not parse envelope JSON');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ gRPC User Query Test PASSED');
    
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ gRPC Test Failed:', error.message);
    if (error.code) {
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
    }
  }
}

// Run test
testGrpcUserQuery();
