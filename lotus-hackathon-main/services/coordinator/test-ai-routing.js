#!/usr/bin/env node

/**
 * AI Routing Test - Tests AI functionality with ENV variables
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

console.log('🧠 AI ROUTING TEST SUITE');
console.log('Testing with your ENV variables');
console.log('=' .repeat(50));

// Check ENV variables
console.log('🔍 Environment Variables:');
console.log('AI_ROUTING_ENABLED:', process.env.AI_ROUTING_ENABLED || 'NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'NOT SET');
console.log('AI_MODEL:', process.env.AI_MODEL || 'NOT SET (will use default)');

let serverProcess = null;

async function startServer() {
  console.log('\n🚀 Starting coordinator server...');
  
  return new Promise((resolve, reject) => {
    // Set environment for the server
    const env = {
      ...process.env,
      PORT: '3002',
      GRPC_PORT: '50052',
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: ''
    };
    
    serverProcess = spawn('node', ['src/index.js'], {
      cwd: __dirname,
      env: env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log('📊 Server:', data.toString().trim());
    });
    
    serverProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log('⚠️  Server Error:', data.toString().trim());
    });
    
    serverProcess.on('error', (error) => {
      console.log('❌ Failed to start server:', error.message);
      reject(error);
    });
    
    // Wait for server to start
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        console.log('✅ Server process started');
        resolve();
      } else {
        reject(new Error('Server failed to start'));
      }
    }, 5000);
  });
}

async function testServerHealth() {
  console.log('\n📡 Testing server health...');
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3002/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Server is responding');
        console.log('📊 Health:', data);
        resolve(true);
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Server health check failed:', error.message);
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('⏰ Health check timeout');
      req.destroy();
      resolve(false);
    });
  });
}

async function testAIRouting() {
  console.log('\n🧠 Testing AI Routing Context...');
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3002/route/context', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const context = JSON.parse(data);
          if (context.success) {
            console.log('✅ AI Routing Context:');
            console.log('   🤖 AI Enabled:', context.context.aiEnabled);
            console.log('   🔄 Fallback Enabled:', context.context.fallbackEnabled);
            console.log('   📊 Total Services:', context.context.totalServices);
            console.log('   📊 Active Services:', context.context.activeServices);
            
            if (context.context.aiEnabled) {
              console.log('🎉 AI ROUTING IS ENABLED!');
            } else {
              console.log('⚠️  AI Routing is disabled, using fallback');
            }
            
            resolve(context.context.aiEnabled);
          } else {
            console.log('❌ Failed to get routing context');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Invalid context response:', data);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Context request failed:', error.message);
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('⏰ Context request timeout');
      req.destroy();
      resolve(false);
    });
  });
}

async function testRouting() {
  console.log('\n🎯 Testing Routing with AI...');
  
  const testData = JSON.stringify({
    data: {
      type: 'payment_request',
      payload: {
        query_text: 'I need to process a payment for my recent order',
        amount: 150.00,
        currency: 'USD'
      },
      context: {
        userId: 'test-user-123',
        sessionId: 'session-456'
      }
    },
    routing: {
      strategy: 'single',
      priority: 'accuracy'
    }
  });
  
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/route',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData)
    }
  };
  
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Routing Response:');
          console.log('   Success:', response.success);
          
          if (response.success && response.routing) {
            console.log('   Method:', response.routing.method);
            console.log('   Processing Time:', response.routing.processingTime);
            console.log('   Strategy:', response.routing.strategy);
            
            if (response.routing.targetServices && response.routing.targetServices.length > 0) {
              console.log('   Target Services:');
              response.routing.targetServices.forEach((service, i) => {
                console.log(`     ${i + 1}. ${service.serviceName}`);
                console.log(`        Confidence: ${service.confidence}`);
                console.log(`        Reasoning: ${service.reasoning}`);
              });
            }
            
            resolve(response.routing.method === 'ai');
          } else {
            console.log('   Error:', response.error || 'Unknown error');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Invalid routing response:', data);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Routing request failed:', error.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ Routing request timeout');
      req.destroy();
      resolve(false);
    });
    
    req.write(testData);
    req.end();
  });
}

function cleanup() {
  if (serverProcess && !serverProcess.killed) {
    console.log('\n🧹 Cleaning up server process...');
    serverProcess.kill();
  }
}

async function runAITest() {
  try {
    await startServer();
    
    const healthOk = await testServerHealth();
    if (!healthOk) {
      console.log('❌ Server health check failed, cannot continue');
      return;
    }
    
    const aiEnabled = await testAIRouting();
    const routingWorked = await testRouting();
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 AI ROUTING TEST RESULTS:');
    console.log('='.repeat(50));
    
    console.log('✅ Server Started: YES');
    console.log('✅ Health Check: YES');
    console.log(`${aiEnabled ? '✅' : '❌'} AI Enabled: ${aiEnabled ? 'YES' : 'NO'}`);
    console.log(`${routingWorked ? '✅' : '❌'} Routing Works: ${routingWorked ? 'YES' : 'NO'}`);
    
    if (aiEnabled && routingWorked) {
      console.log('\n🎉 AI ROUTING IS WORKING PERFECTLY!');
      console.log('🚀 Your ENV variables are configured correctly!');
    } else if (!aiEnabled) {
      console.log('\n⚠️  AI Routing is not enabled. Possible reasons:');
      console.log('   1. AI_ROUTING_ENABLED is not set to "true"');
      console.log('   2. OPENAI_API_KEY is missing or invalid');
      console.log('   3. OpenAI API call failed');
      console.log('\n💡 Check the server logs above for more details');
    } else {
      console.log('\n⚠️  AI is enabled but routing failed');
      console.log('   Check server logs for OpenAI API errors');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    cleanup();
  }
}

// Handle cleanup on exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

runAITest().catch(console.error);
