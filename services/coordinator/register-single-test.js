#!/usr/bin/env node

/**
 * Register single test service and test routing
 */

const http = require('http');

async function registerSingleTest() {
  console.log('🧪 SINGLE SERVICE TEST');
  console.log('=' .repeat(50));
  
  // Register one clear service
  const testService = {
    serviceName: 'simple-payment',
    version: '1.0.0',
    endpoint: 'http://localhost:5000',
    healthCheck: '/health',
    description: 'Simple payment processing service',
    metadata: {
      capabilities: ['payments', 'billing']
    },
    migrationFile: {
      version: '1.0.0',
      description: 'Payment service for processing payments',
      api: {
        endpoints: [
          { path: '/pay', method: 'POST', description: 'Process payment' }
        ]
      },
      capabilities: [
        'payment processing',
        'process payments', 
        'handle payments',
        'payment service',
        'billing'
      ]
    }
  };
  
  console.log('📝 Registering simple-payment service...');
  
  try {
    const response = await makeRequest('POST', '/register', testService);
    
    if (response.success) {
      console.log(`✅ Service registered: ${response.serviceId}`);
      
      // Wait a moment for knowledge graph update
      console.log('⏳ Waiting for knowledge graph update...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test routing
      console.log('\n🧠 Testing AI routing...');
      
      const tests = [
        'process payment',
        'handle payment for order',
        'I need to pay',
        'billing service'
      ];
      
      for (const query of tests) {
        console.log(`\n🔍 Query: "${query}"`);
        
        const routeResponse = await makeRequest('POST', '/route', { query });
        
        if (routeResponse.success) {
          console.log(`📤 Target services: ${routeResponse.routing.targetServices.length}`);
          console.log(`🤖 Method: ${routeResponse.routing.method}`);
          console.log(`⏱️  Time: ${routeResponse.routing.processingTime}`);
          
          if (routeResponse.routing.targetServices.length > 0) {
            routeResponse.routing.targetServices.forEach(service => {
              console.log(`   ✅ Found: ${service.serviceName} (confidence: ${service.confidence})`);
            });
          } else {
            console.log('   ❌ No services found');
          }
        } else {
          console.log('   ❌ Routing failed');
        }
      }
      
    } else {
      console.log(`❌ Registration failed: ${response.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
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
    req.write(postData);
    req.end();
  });
}

registerSingleTest();
