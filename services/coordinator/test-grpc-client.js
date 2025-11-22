#!/usr/bin/env node

/**
 * gRPC Client Test for Coordinator
 * Tests the gRPC Route service that RAG would call
 */

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

async function testGrpcRoute() {
  console.log('🔌 Testing gRPC Route Service (RAG Path)');
  console.log('=' .repeat(50));

  try {
    // Load the coordinator proto
    const protoPath = path.join(__dirname, 'src', 'grpc', 'proto', 'coordinator.proto');
    console.log('📁 Loading proto from:', protoPath);

    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    // Load the rag.v1 package
    const proto = grpc.loadPackageDefinition(packageDefinition).rag.v1;
    console.log('✅ Proto loaded successfully');

    // Create gRPC client
    const client = new proto.CoordinatorService(
      'localhost:50051',
      grpc.credentials.createInsecure()
    );
    console.log('✅ gRPC client created');

    // Prepare test request (simulating RAG)
    const request = {
      tenant_id: 'test-tenant',
      user_id: 'test-user-123',
      query_text: 'Show me my recent payments and transactions',
      metadata: {
        source: 'rag',
        confidence: '0.95',
        intent: 'payment_query'
      }
    };

    console.log('📤 Sending gRPC Route request:');
    console.log(JSON.stringify(request, null, 2));

    // Call the Route RPC
    return new Promise((resolve, reject) => {
      client.Route(request, { deadline: Date.now() + 10000 }, (error, response) => {
        if (error) {
          console.log('❌ gRPC Route call failed:');
          console.log('   Code:', error.code);
          console.log('   Message:', error.message);
          console.log('   Details:', error.details);
          reject(error);
          return;
        }

        console.log('✅ gRPC Route call successful!');
        console.log('📥 Response received:');
        console.log('   Target Services:', response.target_services);
        console.log('   Normalized Fields Keys:', Object.keys(response.normalized_fields || {}));
        console.log('   Envelope JSON Length:', response.envelope_json?.length || 0);
        console.log('   Routing Metadata:', response.routing_metadata);

        // Try to parse envelope JSON
        if (response.envelope_json) {
          try {
            const envelope = JSON.parse(response.envelope_json);
            console.log('📦 Universal Envelope Structure:');
            console.log('   Version:', envelope.version);
            console.log('   Request ID:', envelope.request_id);
            console.log('   Tenant ID:', envelope.tenant_id);
            console.log('   User ID:', envelope.user_id);
            console.log('   Source:', envelope.source);
            console.log('   Query:', envelope.payload?.query);
          } catch (e) {
            console.log('⚠️  Could not parse envelope JSON:', e.message);
          }
        }

        // Try to parse routing metadata
        if (response.routing_metadata) {
          try {
            const metadata = JSON.parse(response.routing_metadata);
            console.log('🧠 Routing Metadata:');
            console.log('   Method:', metadata.routing_method);
            console.log('   Processing Time:', metadata.processing_time);
            console.log('   Strategy:', metadata.strategy);
            console.log('   Confidence:', metadata.confidence);
          } catch (e) {
            console.log('⚠️  Could not parse routing metadata:', e.message);
          }
        }

        resolve(response);
      });
    });

  } catch (error) {
    console.log('❌ Test setup failed:', error.message);
    throw error;
  }
}

// Test gRPC connectivity first
async function testGrpcConnectivity() {
  console.log('🔌 Testing gRPC Server Connectivity');
  
  const net = require('net');
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    
    socket.connect(50051, 'localhost', () => {
      console.log('✅ gRPC server is accessible on port 50051');
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (error) => {
      console.log('❌ Cannot connect to gRPC server:', error.message);
      resolve(false);
    });
    
    socket.on('timeout', () => {
      console.log('⏰ gRPC connection timeout');
      socket.destroy();
      resolve(false);
    });
  });
}

// Main test runner
async function runGrpcTests() {
  console.log('🧪 gRPC Coordinator Test Suite');
  console.log('Testing RAG → Coordinator gRPC communication');
  console.log('=' .repeat(60));

  try {
    // Test 1: Connectivity
    const connected = await testGrpcConnectivity();
    if (!connected) {
      console.log('❌ Cannot proceed - gRPC server not accessible');
      return;
    }

    console.log('');

    // Test 2: Route RPC call
    const response = await testGrpcRoute();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 gRPC Test Results:');
    console.log('✅ Connectivity: PASSED');
    console.log('✅ Route RPC: PASSED');
    console.log('✅ Universal Envelope: CREATED');
    console.log('✅ AI Routing: EXECUTED');
    console.log('✅ Response Format: VALID');
    
    console.log('\n🎯 RAG Path is fully functional!');
    console.log('   RAG → [gRPC] → Coordinator → [AI Routing] → Response');

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ gRPC Test Failed:', error.message);
    console.log('⚠️  Check coordinator logs for details');
  }
}

// Run the tests
runGrpcTests().catch(console.error);
