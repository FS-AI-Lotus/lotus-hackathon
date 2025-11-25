#!/usr/bin/env node

/**
 * Analyze AI Routing Quality - Is the routing actually correct?
 */

const { spawn } = require('child_process');
const http = require('http');

console.log('🔍 AI ROUTING QUALITY ANALYSIS');
console.log('Testing if AI makes correct routing decisions');
console.log('=' .repeat(50));

let serverProcess = null;

async function startServer() {
  console.log('🚀 Starting coordinator server...');
  
  return new Promise((resolve) => {
    const env = {
      ...process.env,
      PORT: '3005',
      GRPC_PORT: '50055',
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: ''
    };
    
    serverProcess = spawn('node', ['src/index.js'], {
      cwd: __dirname,
      env: env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    setTimeout(resolve, 5000);
  });
}

async function registerMultipleServices() {
  console.log('\n📝 Registering multiple different services...');
  
  const services = [
    {
      name: 'payment-service',
      capabilities: ['payments', 'transactions', 'billing'],
      endpoints: ['/api/payment/process', '/api/payment/refund'],
      events: ['payment.completed', 'payment.failed']
    },
    {
      name: 'user-service', 
      capabilities: ['users', 'authentication', 'profiles'],
      endpoints: ['/api/user/create', '/api/user/login'],
      events: ['user.created', 'user.login']
    },
    {
      name: 'notification-service',
      capabilities: ['notifications', 'email', 'sms'],
      endpoints: ['/api/notify/email', '/api/notify/sms'],
      events: ['notification.sent']
    },
    {
      name: 'inventory-service',
      capabilities: ['inventory', 'products', 'stock'],
      endpoints: ['/api/inventory/check', '/api/products/list'],
      events: ['stock.updated', 'product.added']
    }
  ];
  
  const registeredServices = [];
  
  for (const service of services) {
    // Register service
    const serviceData = JSON.stringify({
      serviceName: service.name,
      version: '1.0.0',
      endpoint: `http://localhost:${4000 + registeredServices.length}`,
      healthCheck: '/health',
      description: `Test ${service.name}`,
      metadata: {
        capabilities: service.capabilities
      }
    });
    
    const serviceId = await new Promise((resolve) => {
      const options = {
        hostname: 'localhost', port: 3005, path: '/register', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(serviceData) }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response.success ? response.serviceId : null);
          } catch (e) {
            resolve(null);
          }
        });
      });
      
      req.on('error', () => resolve(null));
      req.write(serviceData);
      req.end();
    });
    
    if (serviceId) {
      // Complete migration
      const migrationData = JSON.stringify({
        migrationFile: {
          version: '1.0.0',
          api: {
            endpoints: service.endpoints.map(path => ({
              path, method: 'POST', description: `${service.name} endpoint`
            }))
          },
          events: {
            publishes: service.events,
            subscribes: []
          }
        }
      });
      
      await new Promise((resolve) => {
        const options = {
          hostname: 'localhost', port: 3005, path: `/register/${serviceId}/migration`, method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(migrationData) }
        };
        
        const req = http.request(options, (res) => {
          res.on('data', () => {});
          res.on('end', resolve);
        });
        
        req.on('error', resolve);
        req.write(migrationData);
        req.end();
      });
      
      registeredServices.push(service);
      console.log(`✅ Registered: ${service.name}`);
    }
  }
  
  return registeredServices;
}

async function testRoutingScenarios(services) {
  console.log('\n🧠 Testing AI routing decisions...');
  
  const testCases = [
    {
      name: 'Payment Processing',
      request: {
        type: 'payment_request',
        payload: {
          query_text: 'I need to process a payment for my order',
          amount: 100.00,
          currency: 'USD'
        }
      },
      expectedService: 'payment-service',
      reasoning: 'Should route to payment service for payment processing'
    },
    {
      name: 'User Registration',
      request: {
        type: 'user_request',
        payload: {
          query_text: 'I want to create a new user account',
          username: 'john_doe',
          email: 'john@example.com'
        }
      },
      expectedService: 'user-service',
      reasoning: 'Should route to user service for account creation'
    },
    {
      name: 'Send Notification',
      request: {
        type: 'notification_request',
        payload: {
          query_text: 'Send email notification to user',
          recipient: 'user@example.com',
          message: 'Welcome!'
        }
      },
      expectedService: 'notification-service',
      reasoning: 'Should route to notification service for email'
    },
    {
      name: 'Check Stock',
      request: {
        type: 'inventory_query',
        payload: {
          query_text: 'Check product availability and stock levels',
          product_id: 'prod-123'
        }
      },
      expectedService: 'inventory-service',
      reasoning: 'Should route to inventory service for stock check'
    },
    {
      name: 'Ambiguous Request',
      request: {
        type: 'general_query',
        payload: {
          query_text: 'Help me with something general'
        }
      },
      expectedService: null, // Any service is acceptable
      reasoning: 'Ambiguous request - any reasonable routing is acceptable'
    }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log(`📤 Query: "${testCase.request.payload.query_text}"`);
    console.log(`🎯 Expected: ${testCase.expectedService || 'Any service'}`);
    
    const routingData = JSON.stringify({
      data: testCase.request,
      routing: { strategy: 'single', priority: 'accuracy' }
    });
    
    const result = await new Promise((resolve) => {
      const options = {
        hostname: 'localhost', port: 3005, path: '/route', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(routingData) }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (e) {
            resolve({ success: false, error: 'Invalid response' });
          }
        });
      });
      
      req.on('error', () => resolve({ success: false, error: 'Request failed' }));
      req.setTimeout(15000, () => {
        req.destroy();
        resolve({ success: false, error: 'Timeout' });
      });
      
      req.write(routingData);
      req.end();
    });
    
    if (result.success && result.routing.targetServices.length > 0) {
      const selectedService = result.routing.targetServices[0];
      const isCorrect = !testCase.expectedService || selectedService.serviceName === testCase.expectedService;
      
      console.log(`📊 Result: ${selectedService.serviceName}`);
      console.log(`📊 Confidence: ${selectedService.confidence}`);
      console.log(`📊 Method: ${result.routing.method}`);
      console.log(`📊 Time: ${result.routing.processingTime}`);
      console.log(`💭 AI Reasoning: ${selectedService.reasoning}`);
      console.log(`${isCorrect ? '✅' : '❌'} Correctness: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
      
      results.push({
        testCase: testCase.name,
        expected: testCase.expectedService,
        actual: selectedService.serviceName,
        correct: isCorrect,
        confidence: selectedService.confidence,
        method: result.routing.method,
        reasoning: selectedService.reasoning
      });
    } else {
      console.log(`❌ Failed: ${result.error || 'No services returned'}`);
      results.push({
        testCase: testCase.name,
        expected: testCase.expectedService,
        actual: null,
        correct: false,
        error: result.error
      });
    }
  }
  
  return results;
}

function analyzeResults(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 AI ROUTING QUALITY ANALYSIS RESULTS');
  console.log('='.repeat(60));
  
  const correctResults = results.filter(r => r.correct);
  const aiResults = results.filter(r => r.method === 'ai');
  const fallbackResults = results.filter(r => r.method === 'fallback');
  
  console.log(`📈 Overall Accuracy: ${correctResults.length}/${results.length} (${Math.round(correctResults.length/results.length*100)}%)`);
  console.log(`🤖 AI Method Used: ${aiResults.length}/${results.length} times`);
  console.log(`🔄 Fallback Used: ${fallbackResults.length}/${results.length} times`);
  
  if (aiResults.length > 0) {
    const aiCorrect = aiResults.filter(r => r.correct).length;
    console.log(`🎯 AI Accuracy: ${aiCorrect}/${aiResults.length} (${Math.round(aiCorrect/aiResults.length*100)}%)`);
    
    const avgConfidence = aiResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / aiResults.length;
    console.log(`📊 Average AI Confidence: ${avgConfidence.toFixed(2)}`);
  }
  
  console.log('\n📋 Detailed Results:');
  results.forEach((result, i) => {
    const status = result.correct ? '✅' : '❌';
    console.log(`${i+1}. ${status} ${result.testCase}`);
    console.log(`   Expected: ${result.expected || 'Any'} | Actual: ${result.actual || 'None'}`);
    if (result.method) {
      console.log(`   Method: ${result.method} | Confidence: ${result.confidence || 'N/A'}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n🎯 CONCLUSION:');
  if (correctResults.length === results.length) {
    console.log('🎉 PERFECT! AI routing is 100% accurate!');
  } else if (correctResults.length >= results.length * 0.8) {
    console.log('✅ EXCELLENT! AI routing is highly accurate!');
  } else if (correctResults.length >= results.length * 0.6) {
    console.log('👍 GOOD! AI routing is reasonably accurate!');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT! AI routing accuracy is low!');
  }
  
  if (aiResults.length === 0) {
    console.log('⚠️  AI was not used - check OpenAI configuration!');
  } else if (aiResults.length < results.length * 0.5) {
    console.log('⚠️  AI was used infrequently - possible API issues!');
  } else {
    console.log('✅ AI was used consistently - good OpenAI integration!');
  }
}

function cleanup() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
}

async function runQualityAnalysis() {
  try {
    await startServer();
    const services = await registerMultipleServices();
    
    if (services.length === 0) {
      console.log('❌ No services registered - cannot test routing quality');
      return;
    }
    
    console.log(`\n✅ Registered ${services.length} services for testing`);
    
    // Wait for services to be active
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = await testRoutingScenarios(services);
    analyzeResults(results);
    
  } catch (error) {
    console.log('❌ Analysis failed:', error.message);
  } finally {
    cleanup();
  }
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);

runQualityAnalysis().catch(console.error);
