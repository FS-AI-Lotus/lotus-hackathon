#!/usr/bin/env node

/**
 * Test Two-Stage Registration with Clean Start
 */

const http = require('http');

async function testTwoStageClean() {
  console.log('🧪 TWO-STAGE REGISTRATION TEST (CLEAN)');
  console.log('=' .repeat(60));
  
  // Test with a unique service name
  const uniqueId = Date.now();
  const testService = {
    service: {
      serviceName: `test-payment-${uniqueId}`,
      version: '1.0.0',
      endpoint: `http://localhost:${4000 + (uniqueId % 100)}`,
      healthCheck: '/health',
      metadata: {
        capabilities: ['payments', 'billing']
      }
    },
    migration: {
      version: '1.0.0',
      description: 'Test payment service',
      api: {
        endpoints: [
          { path: '/pay', method: 'POST', description: 'Process payment' }
        ]
      },
      capabilities: [
        'payment processing', 'process payments', 'handle payments'
      ]
    }
  };
  
  try {
    console.log(`📝 Testing with service: ${testService.service.serviceName}`);
    
    // STAGE 1: Register service (should be pending_migration)
    console.log('\n📋 STAGE 1: Registering service...');
    const registerResponse = await makeRequest('POST', '/register', testService.service);
    
    console.log('Stage 1 Response:', JSON.stringify(registerResponse, null, 2));
    
    if (!registerResponse.success) {
      console.log(`❌ Stage 1 failed: ${registerResponse.message}`);
      return;
    }
    
    const serviceId = registerResponse.serviceId;
    console.log(`✅ Stage 1 complete - Service ID: ${serviceId}`);
    
    // Check service status
    console.log('\n📊 Checking service status...');
    const servicesResponse = await makeRequest('GET', '/services?includeAll=true', {});
    const ourService = servicesResponse.services?.find(s => s.serviceName === testService.service.serviceName);
    
    if (ourService) {
      console.log(`📊 Service status: ${ourService.status}`);
      console.log(`📊 Has migration: ${!!ourService.migrationFile}`);
    }
    
    // STAGE 2: Upload migration file
    console.log('\n📄 STAGE 2: Uploading migration file...');
    const migrationResponse = await makeRequest('POST', `/register/${serviceId}/migration`, {
      migrationFile: testService.migration
    });
    
    console.log('Stage 2 Response:', JSON.stringify(migrationResponse, null, 2));
    
    if (migrationResponse.success) {
      console.log('✅ Stage 2 complete - Service should now be ACTIVE');
      
      // Check final status
      console.log('\n📊 Checking final service status...');
      const finalServicesResponse = await makeRequest('GET', '/services', {});
      const finalService = finalServicesResponse.services?.find(s => s.serviceName === testService.service.serviceName);
      
      if (finalService) {
        console.log(`📊 Final status: ${finalService.status}`);
        
        // Test routing
        console.log('\n🧠 Testing AI routing...');
        const routeResponse = await makeRequest('POST', '/route', { 
          query: 'process payment for order' 
        });
        
        console.log('Routing Response:', JSON.stringify(routeResponse, null, 2));
        
        if (routeResponse.success && routeResponse.routing.targetServices.length > 0) {
          const foundOurService = routeResponse.routing.targetServices.some(s => 
            s.serviceName === testService.service.serviceName
          );
          
          if (foundOurService) {
            console.log('🎉 SUCCESS! AI routing found our service!');
          } else {
            console.log('⚠️  AI found other services but not ours');
          }
        } else {
          console.log('❌ AI routing found no services');
        }
      }
    } else {
      console.log(`❌ Stage 2 failed: ${migrationResponse.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
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

testTwoStageClean();
