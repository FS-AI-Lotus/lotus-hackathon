#!/usr/bin/env node

/**
 * Comprehensive AI Routing Test Suite
 * Tests all aspects of AI routing for both REST and gRPC
 */

const http = require('http');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

async function comprehensiveAITest() {
  console.log('🧠 COMPREHENSIVE AI ROUTING TEST SUITE');
  console.log('=' .repeat(70));
  
  // Test scenarios with expected results
  const testScenarios = [
    {
      query: 'process payment for order 123',
      expected: 'payment',
      description: 'Payment Processing'
    },
    {
      query: 'get user profile information',
      expected: 'user',
      description: 'User Profile'
    },
    {
      query: 'send email notification to customer',
      expected: 'notification',
      description: 'Email Notification'
    },
    {
      query: 'check product stock availability',
      expected: 'inventory',
      description: 'Inventory Check'
    },
    {
      query: 'authenticate user login',
      expected: 'auth',
      description: 'Authentication'
    }
  ];
  
  console.log(`\n📋 Testing ${testScenarios.length} scenarios on both REST and gRPC paths...\n`);
  
  let restResults = [];
  let grpcResults = [];
  
  // Test each scenario
  for (const [index, scenario] of testScenarios.entries()) {
    console.log(`${index + 1}. Testing: "${scenario.description}"`);
    console.log(`   Query: "${scenario.query}"`);
    console.log(`   Expected: Service containing "${scenario.expected}"`);
    
    // Test REST
    console.log('   📡 Testing REST...');
    const restResult = await testRestRouting(scenario.query);
    restResults.push({
      scenario: scenario.description,
      query: scenario.query,
      expected: scenario.expected,
      ...restResult
    });
    
    if (restResult.success && restResult.found) {
      console.log(`   ✅ REST: Found ${restResult.services.join(', ')}`);
    } else {
      console.log(`   ❌ REST: No services found`);
    }
    
    // Test gRPC
    console.log('   🔌 Testing gRPC...');
    const grpcResult = await testGrpcRouting(scenario.query);
    grpcResults.push({
      scenario: scenario.description,
      query: scenario.query,
      expected: scenario.expected,
      ...grpcResult
    });
    
    if (grpcResult.success && grpcResult.found) {
      console.log(`   ✅ gRPC: Found ${grpcResult.services.join(', ')}`);
    } else {
      console.log(`   ❌ gRPC: No services found`);
    }
    
    console.log('');
  }
  
  // Analyze results
  console.log('=' .repeat(70));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('=' .repeat(70));
  
  // REST Analysis
  const restSuccess = restResults.filter(r => r.success && r.found).length;
  const restAccuracy = restResults.filter(r => r.success && r.found && r.correct).length;
  
  console.log(`\n📡 REST ROUTING RESULTS:`);
  console.log(`   🎯 Found Services: ${restSuccess}/${testScenarios.length} (${Math.round(restSuccess/testScenarios.length*100)}%)`);
  console.log(`   ✅ Correct Routing: ${restAccuracy}/${testScenarios.length} (${Math.round(restAccuracy/testScenarios.length*100)}%)`);
  
  // gRPC Analysis
  const grpcSuccess = grpcResults.filter(r => r.success && r.found).length;
  const grpcAccuracy = grpcResults.filter(r => r.success && r.found && r.correct).length;
  
  console.log(`\n🔌 gRPC ROUTING RESULTS:`);
  console.log(`   🎯 Found Services: ${grpcSuccess}/${testScenarios.length} (${Math.round(grpcSuccess/testScenarios.length*100)}%)`);
  console.log(`   ✅ Correct Routing: ${grpcAccuracy}/${testScenarios.length} (${Math.round(grpcAccuracy/testScenarios.length*100)}%)`);
  
  // Detailed breakdown
  console.log(`\n📋 DETAILED BREAKDOWN:`);
  console.log('─'.repeat(70));
  
  for (const [index, scenario] of testScenarios.entries()) {
    const restResult = restResults[index];
    const grpcResult = grpcResults[index];
    
    console.log(`${index + 1}. ${scenario.description}:`);
    console.log(`   📡 REST: ${restResult.success && restResult.found ? '✅' : '❌'} ${restResult.services?.join(', ') || 'None'}`);
    console.log(`   🔌 gRPC: ${grpcResult.success && grpcResult.found ? '✅' : '❌'} ${grpcResult.services?.join(', ') || 'None'}`);
    
    if (restResult.method) {
      console.log(`   🤖 Method: ${restResult.method} (${restResult.processingTime || 'N/A'})`);
    }
    
    if (restResult.confidence) {
      console.log(`   🎯 Confidence: ${restResult.confidence}`);
    }
    
    console.log('');
  }
  
  // Overall assessment
  console.log('=' .repeat(70));
  console.log('🎯 OVERALL AI ROUTING ASSESSMENT');
  console.log('=' .repeat(70));
  
  const overallRestSuccess = restSuccess / testScenarios.length;
  const overallGrpcSuccess = grpcSuccess / testScenarios.length;
  const overallAccuracy = (restAccuracy + grpcAccuracy) / (testScenarios.length * 2);
  
  console.log(`📊 Overall Success Rate: ${Math.round((overallRestSuccess + overallGrpcSuccess) / 2 * 100)}%`);
  console.log(`🎯 Overall Accuracy: ${Math.round(overallAccuracy * 100)}%`);
  
  if (overallAccuracy >= 0.8) {
    console.log('🎉 EXCELLENT! AI routing is working very well!');
  } else if (overallAccuracy >= 0.6) {
    console.log('✅ GOOD! AI routing is working reasonably well!');
  } else if (overallAccuracy >= 0.4) {
    console.log('⚠️  FAIR! AI routing needs some improvement!');
  } else {
    console.log('❌ POOR! AI routing needs significant improvement!');
  }
  
  // Check consistency
  const consistentResults = testScenarios.filter((_, index) => {
    const rest = restResults[index];
    const grpc = grpcResults[index];
    return (rest.success && rest.found) === (grpc.success && grpc.found);
  }).length;
  
  console.log(`🔄 Consistency (REST vs gRPC): ${Math.round(consistentResults/testScenarios.length*100)}%`);
  
  if (consistentResults === testScenarios.length) {
    console.log('✅ Perfect consistency between REST and gRPC paths!');
  } else {
    console.log('⚠️  Some inconsistency between REST and gRPC paths');
  }
}

async function testRestRouting(query) {
  try {
    const response = await makeHttpRequest('POST', '/route', { query });
    
    if (response.success && response.routing?.targetServices?.length > 0) {
      const services = response.routing.targetServices.map(s => s.serviceName);
      const firstService = services[0];
      const confidence = response.routing.targetServices[0]?.confidence;
      
      return {
        success: true,
        found: true,
        services: services,
        method: response.routing.method,
        processingTime: response.routing.processingTime,
        confidence: confidence,
        correct: services.some(s => s.toLowerCase().includes(query.toLowerCase().includes('payment') ? 'payment' : 
                                                             query.toLowerCase().includes('user') ? 'user' :
                                                             query.toLowerCase().includes('notification') ? 'notification' :
                                                             query.toLowerCase().includes('stock') ? 'inventory' :
                                                             query.toLowerCase().includes('auth') ? 'auth' : 'unknown'))
      };
    } else {
      return {
        success: response.success || false,
        found: false,
        services: [],
        method: response.routing?.method,
        processingTime: response.routing?.processingTime
      };
    }
  } catch (error) {
    return {
      success: false,
      found: false,
      error: error.message,
      services: []
    };
  }
}

async function testGrpcRouting(queryText) {
  try {
    const response = await makeGrpcRequest(queryText);
    
    if (response.success && response.target_services?.length > 0) {
      const services = response.target_services;
      
      // Parse routing metadata for additional info
      let method, processingTime, confidence;
      if (response.routing_metadata) {
        try {
          const metadata = JSON.parse(response.routing_metadata);
          method = metadata.routing_method;
          processingTime = metadata.processing_time;
          confidence = metadata.confidence;
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      return {
        success: true,
        found: true,
        services: services,
        method: method,
        processingTime: processingTime,
        confidence: confidence,
        correct: services.some(s => s.toLowerCase().includes(queryText.toLowerCase().includes('payment') ? 'payment' : 
                                                             queryText.toLowerCase().includes('user') ? 'user' :
                                                             queryText.toLowerCase().includes('notification') ? 'notification' :
                                                             queryText.toLowerCase().includes('stock') ? 'inventory' :
                                                             queryText.toLowerCase().includes('auth') ? 'auth' : 'unknown'))
      };
    } else {
      return {
        success: response.success || false,
        found: false,
        services: []
      };
    }
  } catch (error) {
    return {
      success: false,
      found: false,
      error: error.message,
      services: []
    };
  }
}

function makeHttpRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const postData = method === 'GET' ? '' : JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: method === 'GET' ? {} : {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve({ error: 'Invalid JSON', raw: responseData });
        }
      });
    });
    
    req.on('error', reject);
    if (method !== 'GET') {
      req.write(postData);
    }
    req.end();
  });
}

async function makeGrpcRequest(queryText) {
  return new Promise((resolve, reject) => {
    try {
      // Load proto
      const protoPath = path.join(__dirname, 'src/grpc/proto/coordinator.proto');
      const packageDefinition = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      });
      
      const proto = grpc.loadPackageDefinition(packageDefinition);
      const client = new proto.rag.v1.CoordinatorService('localhost:50051', grpc.credentials.createInsecure());
      
      const request = {
        tenant_id: 'test-tenant',
        user_id: 'test-user',
        query_text: queryText,
        metadata: {
          source: 'test',
          intent: 'routing_test'
        }
      };
      
      client.Route(request, (error, response) => {
        if (error) {
          resolve({ success: false, error: error.message });
        } else {
          resolve({ success: true, ...response });
        }
      });
      
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}

comprehensiveAITest().catch(console.error);
