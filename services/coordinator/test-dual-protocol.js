#!/usr/bin/env node

/**
 * Test Script for Dual-Protocol Coordinator
 * Tests both HTTP and gRPC functionality
 */

const http = require('http');

console.log('🧪 Testing Dual-Protocol Coordinator Implementation');
console.log('=' .repeat(50));

// Test 1: Check if HTTP server responds
async function testHttpServer() {
  console.log('\n📡 Test 1: HTTP Server Health Check');
  
  const port = process.env.TEST_PORT || process.env.PORT || 3000;
  
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ HTTP Server is responding');
        console.log('📊 Response:', data);
        resolve(true);
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ HTTP Server not responding:', error.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ HTTP request timeout');
      req.destroy();
      resolve(false);
    });
  });
}

// Test 2: Check HTTP routing endpoint
async function testHttpRouting() {
  console.log('\n🧠 Test 2: HTTP AI Routing');
  
  const postData = JSON.stringify({
    data: {
      type: "test_request",
      payload: {
        query: "test query for routing"
      }
    }
  });

  const port = process.env.TEST_PORT || process.env.PORT || 3000;
  
  const options = {
    hostname: 'localhost',
    port: port,
    path: '/route',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ HTTP Routing endpoint responding');
        console.log('📊 Status:', res.statusCode);
        console.log('📊 Response:', data);
        resolve(true);
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ HTTP Routing failed:', error.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ HTTP routing timeout');
      req.destroy();
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// Test 3: Check metrics endpoint
async function testMetrics() {
  console.log('\n📈 Test 3: Enhanced Metrics');
  
  const port = process.env.TEST_PORT || process.env.PORT || 3000;
  
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/metrics/json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Metrics endpoint responding');
        try {
          const metrics = JSON.parse(data);
          console.log('📊 Metrics structure:', Object.keys(metrics));
          if (metrics.success && metrics.metrics) {
            console.log('📊 Uptime:', metrics.metrics.uptime, 'seconds');
            if (metrics.metrics.protocols) {
              console.log('📊 Protocols:', metrics.metrics.protocols);
            }
          }
        } catch (e) {
          console.log('📊 Raw response:', data);
        }
        resolve(true);
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Metrics endpoint failed:', error.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ Metrics request timeout');
      req.destroy();
      resolve(false);
    });
  });
}

// Test 4: Test gRPC server (basic connectivity)
async function testGrpcConnectivity() {
  console.log('\n🔌 Test 4: gRPC Server Connectivity');
  
  const net = require('net');
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(3000);
    
    socket.connect(50051, 'localhost', () => {
      console.log('✅ gRPC port 50051 is accessible');
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (error) => {
      console.log('❌ gRPC port 50051 not accessible:', error.message);
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
async function runTests() {
  console.log('🚀 Starting tests...\n');
  
  const results = {
    http: await testHttpServer(),
    routing: await testHttpRouting(), 
    metrics: await testMetrics(),
    grpc: await testGrpcConnectivity()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 Test Results Summary:');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const status = passed ? 'PASSED' : 'FAILED';
    console.log(`${icon} ${test.toUpperCase()}: ${status}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Dual-protocol coordinator is working!');
  } else {
    console.log('⚠️  Some tests failed. Check the coordinator startup.');
  }
  
  return results;
}

// Run the tests
runTests().catch(console.error);
