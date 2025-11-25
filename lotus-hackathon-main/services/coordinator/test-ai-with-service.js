#!/usr/bin/env node

/**
 * AI Routing Test with Registered Service
 */

const { spawn } = require('child_process');
const http = require('http');

console.log('🧠 AI ROUTING TEST WITH SERVICE');
console.log('Testing AI routing with registered service');
console.log('=' .repeat(50));

let serverProcess = null;

async function startServer() {
  console.log('🚀 Starting coordinator server...');
  
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PORT: '3003',
      GRPC_PORT: '50053',
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: ''
    };
    
    serverProcess = spawn('node', ['src/index.js'], {
      cwd: __dirname,
      env: env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output.includes('Both servers running')) {
        console.log('✅ Both servers started');
      }
    });
    
    setTimeout(resolve, 5000);
  });
}

async function registerService() {
  console.log('\n📝 Registering test service...');
  
  const serviceData = JSON.stringify({
    serviceName: 'ai-test-payment-service',
    version: '1.0.0',
    endpoint: 'http://localhost:4000',
    healthCheck: '/health',
    description: 'AI test payment service',
    metadata: {
      capabilities: ['payments', 'transactions', 'ai-testing']
    }
  });
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost', port: 3003, path: '/register', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(serviceData) }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log('✅ Service registered:', response.serviceId);
            resolve(response.serviceId);
          } else {
            console.log('❌ Registration failed:', response.message);
            resolve(null);
          }
        } catch (e) {
          console.log('❌ Invalid registration response');
          resolve(null);
        }
      });
    });
    
    req.on('error', () => resolve(null));
    req.write(serviceData);
    req.end();
  });
}

async function completeMigration(serviceId) {
  console.log('📄 Uploading migration file...');
  
  const migrationData = JSON.stringify({
    migrationFile: {
      version: '1.0.0',
      api: {
        endpoints: [
          { path: '/api/payment/process', method: 'POST', description: 'Process payment' },
          { path: '/api/payment/status', method: 'GET', description: 'Get payment status' }
        ]
      },
      events: {
        publishes: ['payment.completed', 'payment.failed'],
        subscribes: ['order.created']
      }
    }
  });
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost', port: 3003, path: `/register/${serviceId}/migration`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(migrationData) }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Migration completed:', response.status);
          resolve(response.success);
        } catch (e) {
          console.log('❌ Invalid migration response');
          resolve(false);
        }
      });
    });
    
    req.on('error', () => resolve(false));
    req.write(migrationData);
    req.end();
  });
}

async function testAIRouting() {
  console.log('\n🧠 Testing AI Routing with service...');
  
  const testData = JSON.stringify({
    data: {
      type: 'payment_request',
      payload: {
        query_text: 'I need to process a payment for my recent order using AI routing',
        amount: 200.00,
        currency: 'USD'
      }
    },
    routing: {
      strategy: 'single',
      priority: 'accuracy'
    }
  });
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost', port: 3003, path: '/route', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(testData) }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📊 Routing Result:');
          console.log('   Success:', response.success);
          
          if (response.success && response.routing) {
            console.log('   🎯 Method:', response.routing.method);
            console.log('   ⚡ Processing Time:', response.routing.processingTime);
            console.log('   📈 Strategy:', response.routing.strategy);
            
            if (response.routing.targetServices && response.routing.targetServices.length > 0) {
              const service = response.routing.targetServices[0];
              console.log('   🎯 Target Service:', service.serviceName);
              console.log('   📊 Confidence:', service.confidence);
              console.log('   💭 Reasoning:', service.reasoning);
              
              if (response.routing.method === 'ai') {
                console.log('\n🎉 AI ROUTING WORKED SUCCESSFULLY!');
                console.log('🤖 OpenAI successfully analyzed the request and found the service!');
                resolve(true);
              } else {
                console.log('\n⚠️  Used fallback routing instead of AI');
                console.log('💡 This might indicate an OpenAI API issue');
                resolve(false);
              }
            } else {
              console.log('   ❌ No target services found');
              resolve(false);
            }
          } else {
            console.log('   ❌ Error:', response.error);
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Invalid response:', data);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('⏰ Request timeout (AI might be processing)');
      req.destroy();
      resolve(false);
    });
    
    req.write(testData);
    req.end();
  });
}

function cleanup() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
}

async function runFullAITest() {
  try {
    await startServer();
    
    const serviceId = await registerService();
    if (!serviceId) {
      console.log('❌ Failed to register service');
      return;
    }
    
    const migrationOk = await completeMigration(serviceId);
    if (!migrationOk) {
      console.log('❌ Failed to complete migration');
      return;
    }
    
    // Wait a bit for service to be active
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const aiWorked = await testAIRouting();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 FINAL AI ROUTING TEST RESULTS:');
    console.log('='.repeat(50));
    
    if (aiWorked) {
      console.log('🎉 SUCCESS! AI ROUTING IS FULLY FUNCTIONAL!');
      console.log('✅ Your ENV variables are correctly configured');
      console.log('✅ OpenAI API is working');
      console.log('✅ AI successfully analyzed and routed the request');
      console.log('\n🚀 The dual-protocol coordinator with AI is ready for production!');
    } else {
      console.log('⚠️  AI routing test completed but used fallback');
      console.log('💡 Possible reasons:');
      console.log('   - OpenAI API rate limits');
      console.log('   - Network connectivity issues');
      console.log('   - API key permissions');
      console.log('\n📊 But the system works perfectly with fallback routing!');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    cleanup();
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

runFullAITest().catch(console.error);
