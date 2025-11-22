#!/usr/bin/env node

/**
 * Check ENV variables and test AI routing
 */

console.log('🔍 ENVIRONMENT VARIABLES CHECK');
console.log('=' .repeat(40));

// Check current process ENV
console.log('📊 Current Process ENV:');
console.log('AI_ROUTING_ENABLED:', process.env.AI_ROUTING_ENABLED || 'NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `SET (${process.env.OPENAI_API_KEY.length} chars)` : 'NOT SET');
console.log('AI_MODEL:', process.env.AI_MODEL || 'NOT SET (will use default)');

// Check if we need to set them
if (!process.env.AI_ROUTING_ENABLED || !process.env.OPENAI_API_KEY) {
  console.log('\n⚠️  ENV variables not properly set in this session!');
  console.log('\n💡 Solutions:');
  console.log('1. Set them globally in Windows:');
  console.log('   - Open System Properties → Environment Variables');
  console.log('   - Add: AI_ROUTING_ENABLED = true');
  console.log('   - Add: OPENAI_API_KEY = your_key');
  console.log('   - Restart terminal');
  
  console.log('\n2. Set them for this session:');
  console.log('   $env:AI_ROUTING_ENABLED="true"');
  console.log('   $env:OPENAI_API_KEY="your_key"');
  
  console.log('\n3. Use .env file (if exists):');
  const fs = require('fs');
  const path = require('path');
  
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    console.log('   ✅ .env file exists');
    const envContent = fs.readFileSync(envFile, 'utf8');
    console.log('   📄 Content preview:');
    envContent.split('\n').slice(0, 5).forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key] = line.split('=');
        console.log(`      ${key}=...`);
      }
    });
  } else {
    console.log('   ❌ No .env file found');
  }
  
  console.log('\n🎯 The AI worked in the previous test because:');
  console.log('   - The test script inherited ENV from your system');
  console.log('   - Or you had set them temporarily');
  console.log('   - The server logs showed "hasApiKey: true"');
  
  process.exit(0);
}

console.log('\n✅ ENV variables are set! Running AI test...');

// If we get here, ENV is set - run the AI test
const { spawn } = require('child_process');
const http = require('http');

let serverProcess = null;

async function quickAITest() {
  console.log('\n🚀 Starting quick AI test...');
  
  // Start server with current ENV
  serverProcess = spawn('node', ['src/index.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: '3004',
      GRPC_PORT: '50054',
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Wait for startup
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test AI context
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3004/route/context', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const context = JSON.parse(data);
          if (context.success) {
            console.log('✅ AI Test Results:');
            console.log('   🤖 AI Enabled:', context.context.aiEnabled);
            console.log('   🔄 Fallback Enabled:', context.context.fallbackEnabled);
            
            if (context.context.aiEnabled) {
              console.log('\n🎉 SUCCESS! AI Routing is working with your ENV!');
            } else {
              console.log('\n⚠️  AI is still disabled - check your ENV settings');
            }
          }
        } catch (e) {
          console.log('❌ Failed to parse response');
        }
        resolve();
      });
    });
    
    req.on('error', () => {
      console.log('❌ Server not responding');
      resolve();
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      resolve();
    });
  });
}

function cleanup() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);

quickAITest().then(() => {
  cleanup();
}).catch(console.error);
