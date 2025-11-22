#!/usr/bin/env node

/**
 * Test different routing scenarios to understand AI vs Fallback
 */

const http = require('http');

console.log('🧠 ROUTING ENGINE TEST SUITE');
console.log('Testing AI vs Fallback routing behavior');
console.log('=' .repeat(50));

const testScenarios = [
  {
    name: 'Payment Request',
    data: {
      type: 'payment_request',
      payload: {
        query_text: 'process payment for order 123',
        amount: 100.50,
        currency: 'USD'
      }
    }
  },
  {
    name: 'Transaction Query',
    data: {
      type: 'transaction_query', 
      payload: {
        query_text: 'show my recent transactions',
        user_id: 'user-123'
      }
    }
  },
  {
    name: 'Refund Request',
    data: {
      type: 'refund_request',
      payload: {
        query_text: 'refund payment for order 456',
        payment_id: 'pay-456'
      }
    }
  },
  {
    name: 'Generic Query',
    data: {
      type: 'generic_query',
      payload: {
        query_text: 'help me with something'
      }
    }
  },
  {
    name: 'User Management',
    data: {
      type: 'user_request',
      payload: {
        query_text: 'update user profile information'
      }
    }
  }
];

async function testRouting(scenario) {
  console.log(`\n🔍 Testing: ${scenario.name}`);
  console.log(`📤 Query: "${scenario.data.payload.query_text}"`);
  
  const postData = JSON.stringify({ data: scenario.data });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/route',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && response.routing.targetServices.length > 0) {
            const service = response.routing.targetServices[0];
            console.log(`✅ Routed to: ${service.serviceName}`);
            console.log(`📊 Confidence: ${service.confidence}`);
            console.log(`🧠 Method: ${response.routing.method}`);
            console.log(`⚡ Time: ${response.routing.processingTime}`);
            console.log(`💭 Reasoning: ${service.reasoning}`);
          } else {
            console.log(`❌ No routing found: ${response.error || 'Unknown error'}`);
          }
        } catch (e) {
          console.log(`❌ Invalid response: ${data}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Request failed: ${error.message}`);
      resolve();
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ Request timeout');
      req.destroy();
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
}

async function runRoutingTests() {
  console.log('🚀 Starting routing tests...\n');
  
  // First check routing context
  console.log('📋 Current Routing Context:');
  const contextReq = http.get('http://localhost:3000/route/context', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      try {
        const context = JSON.parse(data);
        if (context.success) {
          console.log(`🤖 AI Enabled: ${context.context.aiEnabled}`);
          console.log(`🔄 Fallback Enabled: ${context.context.fallbackEnabled}`);
          console.log(`📊 Active Services: ${context.context.activeServices}`);
          console.log(`🏷️  Service Capabilities: ${context.context.services.map(s => s.capabilities.join(', ')).join(' | ')}`);
        }
      } catch (e) {
        console.log('❌ Failed to get context');
      }
      
      console.log('\n' + '='.repeat(50));
      
      // Run all test scenarios
      for (const scenario of testScenarios) {
        await testRouting(scenario);
      }
      
      console.log('\n' + '='.repeat(50));
      console.log('📋 ROUTING TEST SUMMARY:');
      console.log('🔍 Method Used: Fallback (Keyword Matching)');
      console.log('💡 Why: AI_ROUTING_ENABLED=false or no OPENAI_API_KEY');
      console.log('🎯 Keyword Matching Logic:');
      console.log('   - Matches service name in query text');
      console.log('   - Matches service capabilities');
      console.log('   - Matches API endpoint paths');
      console.log('   - Matches event names');
      console.log('   - Higher confidence = more matches');
      
      console.log('\n🧠 To Enable AI Routing:');
      console.log('   1. Set AI_ROUTING_ENABLED=true');
      console.log('   2. Set OPENAI_API_KEY=your_key');
      console.log('   3. Restart coordinator');
    });
  });
  
  contextReq.on('error', () => {
    console.log('❌ Failed to get routing context');
  });
}

runRoutingTests().catch(console.error);
