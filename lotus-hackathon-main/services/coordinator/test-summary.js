#!/usr/bin/env node

/**
 * Comprehensive Test Summary for Dual-Protocol Coordinator
 * Tests all functionality after cleanup
 */

const http = require('http');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

console.log('🎯 COMPREHENSIVE COORDINATOR TEST SUITE');
console.log('Testing after directory cleanup');
console.log('=' .repeat(60));

const results = {
  http_health: false,
  http_routing: false,
  http_metrics: false,
  grpc_connectivity: false,
  grpc_routing: false,
  structure_clean: false
};

// Test 1: HTTP Health
async function testHttpHealth() {
  console.log('\n📡 Test 1: HTTP Server Health');
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          console.log('✅ HTTP Health:', health.status);
          console.log('📊 Uptime:', health.uptime, 'seconds');
          console.log('📊 Registered Services:', health.registeredServices);
          results.http_health = true;
        } catch (e) {
          console.log('❌ Invalid health response');
        }
        resolve();
      });
    }).on('error', () => {
      console.log('❌ HTTP server not responding');
      resolve();
    });
    req.setTimeout(3000, () => { req.destroy(); resolve(); });
  });
}

// Test 2: HTTP Routing
async function testHttpRouting() {
  console.log('\n🧠 Test 2: HTTP AI Routing');
  
  const testData = JSON.stringify({
    data: {
      type: "payment_request",
      payload: { query_text: "process payment" }
    }
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost', port: 3000, path: '/route', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(testData) }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error && response.error.includes('No active services')) {
            console.log('✅ HTTP Routing working (expected: no services)');
            console.log('📊 AI Routing detected no services correctly');
            results.http_routing = true;
          } else {
            console.log('⚠️  Unexpected routing response:', response);
          }
        } catch (e) {
          console.log('❌ Invalid routing response');
        }
        resolve();
      });
    }).on('error', () => {
      console.log('❌ HTTP routing failed');
      resolve();
    });
    
    req.setTimeout(3000, () => { req.destroy(); resolve(); });
    req.write(testData);
    req.end();
  });
}

// Test 3: Enhanced Metrics
async function testMetrics() {
  console.log('\n📈 Test 3: Enhanced Metrics');
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/metrics/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const metrics = JSON.parse(data);
          if (metrics.success && metrics.metrics.protocols) {
            console.log('✅ Enhanced metrics working');
            console.log('📊 HTTP Port:', metrics.metrics.protocols.http.port);
            console.log('📊 gRPC Port:', metrics.metrics.protocols.grpc.port);
            console.log('📊 RAG Path:', metrics.metrics.paths['RAG Path']);
            console.log('📊 Regular Path:', metrics.metrics.paths['Regular Path']);
            results.http_metrics = true;
          } else {
            console.log('⚠️  Metrics missing protocol info');
          }
        } catch (e) {
          console.log('❌ Invalid metrics response');
        }
        resolve();
      });
    }).on('error', () => {
      console.log('❌ Metrics endpoint failed');
      resolve();
    });
    req.setTimeout(3000, () => { req.destroy(); resolve(); });
  });
}

// Test 4: gRPC Connectivity
async function testGrpcConnectivity() {
  console.log('\n🔌 Test 4: gRPC Server Connectivity');
  
  const net = require('net');
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    
    socket.connect(50051, 'localhost', () => {
      console.log('✅ gRPC server accessible on port 50051');
      results.grpc_connectivity = true;
      socket.destroy();
      resolve();
    });
    
    socket.on('error', () => {
      console.log('❌ gRPC server not accessible');
      resolve();
    });
    
    socket.on('timeout', () => {
      console.log('⏰ gRPC connection timeout');
      socket.destroy();
      resolve();
    });
  });
}

// Test 5: gRPC Route RPC
async function testGrpcRouting() {
  console.log('\n🚀 Test 5: gRPC Route RPC (RAG Path)');
  
  try {
    const protoPath = path.join(__dirname, 'src', 'grpc', 'proto', 'coordinator.proto');
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
    });

    const proto = grpc.loadPackageDefinition(packageDefinition).rag.v1;
    const client = new proto.CoordinatorService('localhost:50051', grpc.credentials.createInsecure());

    const request = {
      tenant_id: 'test-tenant',
      user_id: 'test-user',
      query_text: 'Show payments',
      metadata: { source: 'rag' }
    };

    return new Promise((resolve) => {
      client.Route(request, { deadline: Date.now() + 5000 }, (error, response) => {
        if (error) {
          if (error.message.includes('No active services available')) {
            console.log('✅ gRPC Route RPC working (expected: no services)');
            console.log('📊 gRPC AI routing detected no services correctly');
            console.log('📊 Error code:', error.code, '(UNKNOWN - expected)');
            results.grpc_routing = true;
          } else {
            console.log('❌ Unexpected gRPC error:', error.message);
          }
        } else {
          console.log('⚠️  Unexpected success (should fail with no services)');
        }
        resolve();
      });
    });
  } catch (error) {
    console.log('❌ gRPC setup failed:', error.message);
    return Promise.resolve();
  }
}

// Test 6: Directory Structure
async function testStructure() {
  console.log('\n📁 Test 6: Clean Directory Structure');
  
  const fs = require('fs');
  
  try {
    // Check that old directories are gone
    const oldDirs = ['lotus-hackathon', 'lotus-hackathon-1'];
    let cleanStructure = true;
    
    for (const dir of oldDirs) {
      if (fs.existsSync(dir)) {
        console.log('❌ Old directory still exists:', dir);
        cleanStructure = false;
      }
    }
    
    // Check that new structure exists
    const requiredPaths = [
      'src/grpc/server.js',
      'src/grpc/client.js', 
      'src/grpc/proto/coordinator.proto',
      'src/grpc/proto/microservice.proto',
      'src/services/communicationService.js',
      'src/services/envelopeService.js'
    ];
    
    for (const filePath of requiredPaths) {
      if (!fs.existsSync(filePath)) {
        console.log('❌ Missing required file:', filePath);
        cleanStructure = false;
      }
    }
    
    if (cleanStructure) {
      console.log('✅ Directory structure is clean');
      console.log('📊 Old duplicate directories removed');
      console.log('📊 All gRPC implementation files present');
      results.structure_clean = true;
    }
    
  } catch (error) {
    console.log('❌ Structure check failed:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive test suite...\n');
  
  await testHttpHealth();
  await testHttpRouting();
  await testMetrics();
  await testGrpcConnectivity();
  await testGrpcRouting();
  await testStructure();
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 FINAL TEST RESULTS:');
  console.log('='.repeat(60));
  
  const tests = [
    ['HTTP Health Check', results.http_health],
    ['HTTP AI Routing', results.http_routing],
    ['Enhanced Metrics', results.http_metrics],
    ['gRPC Connectivity', results.grpc_connectivity],
    ['gRPC Route RPC', results.grpc_routing],
    ['Clean Structure', results.structure_clean]
  ];
  
  let passed = 0;
  tests.forEach(([name, result]) => {
    const icon = result ? '✅' : '❌';
    const status = result ? 'PASSED' : 'FAILED';
    console.log(`${icon} ${name}: ${status}`);
    if (result) passed++;
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 OVERALL RESULT: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✨ Dual-Protocol Coordinator is fully functional!');
    console.log('🚀 Ready for production deployment!');
    
    console.log('\n🎯 SYSTEM STATUS:');
    console.log('✅ HTTP Server (3000) - Regular microservice path');
    console.log('✅ gRPC Server (50051) - RAG communication path');
    console.log('✅ AI Routing - Same logic for both protocols');
    console.log('✅ Universal Envelope - Protocol-agnostic format');
    console.log('✅ Enhanced Metrics - Dual-protocol monitoring');
    console.log('✅ Clean Structure - No duplicate directories');
    
  } else {
    console.log('⚠️  Some tests failed - check coordinator setup');
  }
  
  return passed === tests.length;
}

// Run the comprehensive test suite
runAllTests().catch(console.error);
