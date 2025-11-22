#!/usr/bin/env node

/**
 * Register a complete service with migration file
 */

const http = require('http');

async function registerCompleteService() {
  console.log('📝 Registering complete service with migration...');
  
  // Step 1: Register service
  const serviceData = {
    serviceName: 'payment-processor',
    version: '1.0.0',
    endpoint: 'http://localhost:4000',
    healthCheck: '/health',
    description: 'Payment processing service for orders and transactions',
    metadata: {
      team: 'Payment Team',
      capabilities: ['payments', 'refunds', 'transactions', 'billing']
    }
  };
  
  console.log('🚀 Step 1: Registering service...');
  
  const registerResponse = await makeRequest('POST', '/register', serviceData);
  console.log('✅ Service registered:', registerResponse.serviceId);
  
  // Step 2: Upload migration file
  const migrationData = {
    migrationFile: {
      version: '1.0.0',
      description: 'Payment processing microservice',
      api: {
        endpoints: [
          {
            path: '/api/payment/process',
            method: 'POST',
            description: 'Process payment for orders'
          },
          {
            path: '/api/payment/refund',
            method: 'POST', 
            description: 'Process refunds'
          },
          {
            path: '/api/payment/status',
            method: 'GET',
            description: 'Check payment status'
          }
        ]
      },
      capabilities: [
        'payment processing',
        'order payments',
        'credit card processing',
        'refund handling',
        'transaction management',
        'billing operations'
      ],
      events: {
        publishes: [
          'payment.completed',
          'payment.failed',
          'refund.processed'
        ],
        subscribes: [
          'order.created',
          'order.cancelled'
        ]
      }
    }
  };
  
  console.log('🚀 Step 2: Uploading migration...');
  
  const migrationResponse = await makeRequest('POST', `/register/${registerResponse.serviceId}/migration`, migrationData);
  console.log('✅ Migration uploaded');
  
  console.log('\n🎯 Now testing AI routing...');
  
  // Test routing
  const routingTests = [
    'I need to process a payment for my order',
    'Process credit card payment',
    'Handle payment for order 123',
    'I want to get a refund'
  ];
  
  for (const query of routingTests) {
    console.log(`\n🧠 Testing: "${query}"`);
    const routeResponse = await makeRequest('POST', '/route', { query });
    
    if (routeResponse.success && routeResponse.routing.targetServices.length > 0) {
      console.log(`✅ Routed to: ${routeResponse.routing.targetServices.map(s => s.serviceName).join(', ')}`);
      console.log(`   Method: ${routeResponse.routing.method}`);
      console.log(`   Processing time: ${routeResponse.routing.processingTime}`);
    } else {
      console.log('❌ No routing found');
    }
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

registerCompleteService().catch(console.error);
