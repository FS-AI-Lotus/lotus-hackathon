#!/usr/bin/env node

/**
 * Setup Complete Test Services with Migration Files
 * This will register services with full metadata for AI routing tests
 */

const http = require('http');

const testServices = [
  {
    service: {
      serviceName: 'payment-service',
      version: '1.0.0',
      endpoint: 'http://localhost:4001',
      healthCheck: '/health',
      description: 'Complete payment processing service for orders, billing and refunds',
      metadata: {
        team: 'Payment Team',
        capabilities: ['payments', 'billing', 'refunds', 'transactions', 'credit-cards']
      }
    },
    migration: {
      version: '1.0.0',
      description: 'Payment processing microservice with full payment capabilities',
      api: {
        endpoints: [
          { path: '/api/payment/process', method: 'POST', description: 'Process payment for orders' },
          { path: '/api/payment/refund', method: 'POST', description: 'Process refunds' },
          { path: '/api/payment/status', method: 'GET', description: 'Check payment status' },
          { path: '/api/billing/invoice', method: 'POST', description: 'Generate invoices' }
        ]
      },
      capabilities: [
        'payment processing', 'order payments', 'credit card processing',
        'refund handling', 'transaction management', 'billing operations',
        'invoice generation', 'payment status tracking'
      ],
      events: {
        publishes: ['payment.completed', 'payment.failed', 'refund.processed'],
        subscribes: ['order.created', 'order.cancelled']
      }
    }
  },
  {
    service: {
      serviceName: 'user-management',
      version: '1.0.0', 
      endpoint: 'http://localhost:4002',
      healthCheck: '/health',
      description: 'User management service for registration, profiles and authentication',
      metadata: {
        team: 'User Team',
        capabilities: ['users', 'profiles', 'authentication', 'registration']
      }
    },
    migration: {
      version: '1.0.0',
      description: 'User management and authentication service',
      api: {
        endpoints: [
          { path: '/api/users/register', method: 'POST', description: 'Register new user' },
          { path: '/api/users/profile', method: 'GET', description: 'Get user profile' },
          { path: '/api/users/update', method: 'PUT', description: 'Update user profile' },
          { path: '/api/auth/login', method: 'POST', description: 'User authentication' }
        ]
      },
      capabilities: [
        'user registration', 'user profiles', 'user authentication',
        'profile management', 'user data', 'account management',
        'login services', 'user information'
      ],
      events: {
        publishes: ['user.registered', 'user.updated', 'user.login'],
        subscribes: ['order.completed', 'payment.completed']
      }
    }
  },
  {
    service: {
      serviceName: 'notification-service',
      version: '1.0.0',
      endpoint: 'http://localhost:4003', 
      healthCheck: '/health',
      description: 'Notification service for emails, SMS and push notifications',
      metadata: {
        team: 'Communication Team',
        capabilities: ['notifications', 'email', 'sms', 'push-notifications']
      }
    },
    migration: {
      version: '1.0.0',
      description: 'Multi-channel notification service',
      api: {
        endpoints: [
          { path: '/api/notify/email', method: 'POST', description: 'Send email notification' },
          { path: '/api/notify/sms', method: 'POST', description: 'Send SMS notification' },
          { path: '/api/notify/push', method: 'POST', description: 'Send push notification' },
          { path: '/api/notify/bulk', method: 'POST', description: 'Send bulk notifications' }
        ]
      },
      capabilities: [
        'email notifications', 'SMS messaging', 'push notifications',
        'bulk notifications', 'notification delivery', 'communication services',
        'message sending', 'alert services'
      ],
      events: {
        publishes: ['notification.sent', 'notification.failed'],
        subscribes: ['user.registered', 'payment.completed', 'order.shipped']
      }
    }
  },
  {
    service: {
      serviceName: 'inventory-service',
      version: '1.0.0',
      endpoint: 'http://localhost:4004',
      healthCheck: '/health', 
      description: 'Inventory management service for products, stock and availability',
      metadata: {
        team: 'Inventory Team',
        capabilities: ['inventory', 'stock', 'products', 'availability']
      }
    },
    migration: {
      version: '1.0.0',
      description: 'Product inventory and stock management service',
      api: {
        endpoints: [
          { path: '/api/inventory/check', method: 'GET', description: 'Check product availability' },
          { path: '/api/inventory/reserve', method: 'POST', description: 'Reserve product stock' },
          { path: '/api/inventory/update', method: 'PUT', description: 'Update stock levels' },
          { path: '/api/products/search', method: 'GET', description: 'Search products' }
        ]
      },
      capabilities: [
        'stock management', 'product availability', 'inventory tracking',
        'stock levels', 'product search', 'stock reservation',
        'inventory updates', 'availability checking'
      ],
      events: {
        publishes: ['stock.updated', 'product.reserved', 'stock.low'],
        subscribes: ['order.created', 'order.cancelled']
      }
    }
  }
];

async function setupTestServices() {
  console.log('🚀 SETTING UP COMPLETE TEST SERVICES');
  console.log('=' .repeat(60));
  console.log(`📝 Registering ${testServices.length} services with full migration files...`);
  
  const results = [];
  
  for (const [index, testService] of testServices.entries()) {
    console.log(`\n${index + 1}. Registering ${testService.service.serviceName}...`);
    
    try {
      // Register service with migration file in one request
      console.log('   📋 Registering service with migration file...');
      
      const completeService = {
        ...testService.service,
        migrationFile: testService.migration
      };
      
      const registerResponse = await makeRequest('POST', '/register', completeService);
      
      if (registerResponse.success) {
        console.log(`   ✅ Service registered with ID: ${registerResponse.serviceId}`);
        results.push({
          serviceName: testService.service.serviceName,
          serviceId: registerResponse.serviceId,
          status: 'success'
        });
      } else {
        console.log(`   ❌ Registration failed: ${registerResponse.message}`);
        results.push({
          serviceName: testService.service.serviceName,
          status: 'failed',
          error: registerResponse.message
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
  console.log('📊 REGISTRATION SUMMARY');
  console.log('=' .repeat(60));
  
  results.forEach((result, index) => {
    const status = result.status === 'success' ? '✅' : result.status === 'partial' ? '⚠️' : '❌';
    console.log(`${index + 1}. ${status} ${result.serviceName} - ${result.status}`);
  });
  
  const successCount = results.filter(r => r.status === 'success').length;
  console.log(`\n🎯 Successfully registered: ${successCount}/${results.length} services`);
  
  if (successCount > 0) {
    console.log('\n🧪 Now testing AI routing with complete services...');
    await testAIRouting();
  }
}

async function testAIRouting() {
  console.log('\n' + '=' .repeat(60));
  console.log('🤖 AI ROUTING TESTS WITH COMPLETE SERVICES');
  console.log('=' .repeat(60));
  
  const routingTests = [
    {
      query: 'I need to process a payment for my order',
      expected: 'payment-service'
    },
    {
      query: 'Create a new user account and register',
      expected: 'user-management'
    },
    {
      query: 'Send email notification to customer',
      expected: 'notification-service'
    },
    {
      query: 'Check product availability and stock levels',
      expected: 'inventory-service'
    },
    {
      query: 'Get user profile information',
      expected: 'user-management'
    },
    {
      query: 'Process refund for cancelled order',
      expected: 'payment-service'
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
        const isCorrect = foundServices.includes(test.expected);
        
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
      }
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 AI ROUTING TEST RESULTS');
  console.log('=' .repeat(60));
  console.log(`🎯 Accuracy: ${successCount}/${routingTests.length} (${Math.round(successCount/routingTests.length*100)}%)`);
  
  if (successCount === routingTests.length) {
    console.log('🎉 PERFECT! All routing tests passed!');
  } else if (successCount > routingTests.length / 2) {
    console.log('✅ GOOD! Most routing tests passed!');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT! Some routing tests failed.');
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

// Run setup
setupTestServices().catch(console.error);
