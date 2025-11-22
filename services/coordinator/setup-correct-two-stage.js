#!/usr/bin/env node

/**
 * Setup Test Services - CORRECT Two-Stage Registration
 * Stage 1: Register service (pending_migration)
 * Stage 2: Upload migration file (active)
 */

const http = require('http');

const testServices = [
  {
    service: {
      serviceName: 'payment-service',
      version: '1.0.0',
      endpoint: 'http://localhost:4001',
      healthCheck: '/health',
      description: 'Payment processing service for orders and billing',
      metadata: {
        team: 'Payment Team',
        capabilities: ['payments', 'billing', 'refunds']
      }
    },
    migration: {
      version: '1.0.0',
      description: 'Payment processing microservice',
      api: {
        endpoints: [
          { path: '/api/payment/process', method: 'POST', description: 'Process payment' },
          { path: '/api/payment/refund', method: 'POST', description: 'Process refund' }
        ]
      },
      capabilities: [
        'payment processing', 'process payments', 'handle payments',
        'billing', 'refunds', 'transactions'
      ],
      events: {
        publishes: ['payment.completed', 'payment.failed'],
        subscribes: ['order.created']
      }
    }
  },
  {
    service: {
      serviceName: 'user-service',
      version: '1.0.0',
      endpoint: 'http://localhost:4002',
      healthCheck: '/health',
      description: 'User management and profile service',
      metadata: {
        team: 'User Team',
        capabilities: ['users', 'profiles', 'authentication']
      }
    },
    migration: {
      version: '1.0.0',
      description: 'User management service',
      api: {
        endpoints: [
          { path: '/api/users/profile', method: 'GET', description: 'Get user profile' },
          { path: '/api/users/register', method: 'POST', description: 'Register user' }
        ]
      },
      capabilities: [
        'user management', 'user profiles', 'get user info',
        'user registration', 'user data', 'profile information'
      ],
      events: {
        publishes: ['user.registered', 'user.updated'],
        subscribes: ['payment.completed']
      }
    }
  }
];

async function setupCorrectTwoStage() {
  console.log('🚀 CORRECT TWO-STAGE REGISTRATION');
  console.log('=' .repeat(60));
  console.log('📝 Using the original two-stage process...');
  
  const results = [];
  
  for (const [index, testService] of testServices.entries()) {
    console.log(`\n${index + 1}. Processing ${testService.service.serviceName}...`);
    
    try {
      // STAGE 1: Register service (basic info only)
      console.log('   📋 Stage 1: Registering service...');
      const registerResponse = await makeRequest('POST', '/register', testService.service);
      
      if (!registerResponse.success) {
        console.log(`   ❌ Stage 1 failed: ${registerResponse.message}`);
        results.push({
          serviceName: testService.service.serviceName,
          status: 'failed',
          stage: 1,
          error: registerResponse.message
        });
        continue;
      }
      
      const serviceId = registerResponse.serviceId;
      console.log(`   ✅ Stage 1 complete - ID: ${serviceId}`);
      console.log(`   📊 Status: ${registerResponse.status || 'pending_migration'}`);
      
      // STAGE 2: Upload migration file
      console.log('   📄 Stage 2: Uploading migration file...');
      const migrationResponse = await makeRequest('POST', `/register/${serviceId}/migration`, {
        migrationFile: testService.migration
      });
      
      if (migrationResponse.success) {
        console.log('   ✅ Stage 2 complete - Service is now ACTIVE');
        results.push({
          serviceName: testService.service.serviceName,
          serviceId: serviceId,
          status: 'success',
          stage: 2
        });
      } else {
        console.log(`   ❌ Stage 2 failed: ${migrationResponse.message}`);
        results.push({
          serviceName: testService.service.serviceName,
          serviceId: serviceId,
          status: 'partial',
          stage: 2,
          error: migrationResponse.message
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        serviceName: testService.service.serviceName,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TWO-STAGE REGISTRATION SUMMARY');
  console.log('=' .repeat(60));
  
  results.forEach((result, index) => {
    const status = result.status === 'success' ? '✅' : result.status === 'partial' ? '⚠️' : '❌';
    console.log(`${index + 1}. ${status} ${result.serviceName} - ${result.status} (stage ${result.stage || 'unknown'})`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.status === 'success').length;
  console.log(`\n🎯 Successfully registered: ${successCount}/${results.length} services`);
  
  if (successCount > 0) {
    console.log('\n⏳ Waiting for services to be indexed...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🧪 Testing AI routing with correctly registered services...');
    await testAIRoutingCorrect();
  }
}

async function testAIRoutingCorrect() {
  console.log('\n' + '=' .repeat(60));
  console.log('🤖 AI ROUTING TESTS - CORRECT REGISTRATION');
  console.log('=' .repeat(60));
  
  // First check what services we have
  console.log('📋 Checking registered services...');
  const servicesResponse = await makeRequest('GET', '/services', {});
  console.log(`Found ${servicesResponse.total || 0} services`);
  
  if (servicesResponse.services) {
    servicesResponse.services.forEach((service, index) => {
      console.log(`${index + 1}. ${service.serviceName} (${service.status})`);
    });
  }
  
  const routingTests = [
    {
      query: 'I need to process a payment for my order',
      expected: 'payment-service'
    },
    {
      query: 'Get user profile information',
      expected: 'user-service'
    },
    {
      query: 'Handle payment transaction',
      expected: 'payment-service'
    },
    {
      query: 'Show me user details',
      expected: 'user-service'
    }
  ];
  
  let successCount = 0;
  
  for (const [index, test] of routingTests.entries()) {
    console.log(`\n${index + 1}. Testing: "${test.query}"`);
    console.log(`   🎯 Expected: ${test.expected}`);
    
    try {
      const routeResponse = await makeRequest('POST', '/route', { query: test.query });
      
      if (routeResponse.success && routeResponse.routing.targetServices.length > 0) {
        const foundServices = routeResponse.routing.targetServices.map(s => s.serviceName);
        const isCorrect = foundServices.some(name => name.includes(test.expected.split('-')[0]));
        
        console.log(`   📤 Found: ${foundServices.join(', ')}`);
        console.log(`   🤖 Method: ${routeResponse.routing.method}`);
        console.log(`   ⏱️  Time: ${routeResponse.routing.processingTime}`);
        
        if (isCorrect) {
          console.log('   ✅ CORRECT routing!');
          successCount++;
        } else {
          console.log('   ❌ Incorrect routing');
        }
      } else {
        console.log('   ❌ No services found');
        if (routeResponse.error) {
          console.log(`   Error: ${routeResponse.error}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL AI ROUTING TEST RESULTS');
  console.log('=' .repeat(60));
  console.log(`🎯 Accuracy: ${successCount}/${routingTests.length} (${Math.round(successCount/routingTests.length*100)}%)`);
  
  if (successCount === routingTests.length) {
    console.log('🎉 PERFECT! All routing tests passed!');
    console.log('✅ Two-stage registration works correctly!');
    console.log('✅ AI routing is functioning properly!');
  } else if (successCount > 0) {
    console.log('✅ PARTIAL SUCCESS! Some routing tests passed!');
    console.log('📈 Two-stage registration is working!');
  } else {
    console.log('⚠️  No routing success - investigating...');
  }
}

function makeRequest(method, path, data) {
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

// Run setup
setupCorrectTwoStage().catch(console.error);
