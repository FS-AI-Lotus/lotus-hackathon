#!/usr/bin/env node

/**
 * Test AI routing directly
 */

const aiRoutingService = require('./src/services/aiRoutingService');

async function testAIDirect() {
  console.log('🤖 DIRECT AI ROUTING TEST');
  console.log('=' .repeat(50));
  
  try {
    console.log('🔍 Testing AI routing service directly...');
    
    const query = 'I need to process a payment for my order';
    const context = {
      method: 'POST',
      path: '/test',
      body: { amount: 100 }
    };
    
    console.log(`📤 Query: "${query}"`);
    console.log('📤 Context:', JSON.stringify(context, null, 2));
    
    const result = await aiRoutingService.routeRequest(query, context);
    
    console.log('\n📥 AI Routing Result:');
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('Target Services:', result.routing.targetServices);
      console.log('Method:', result.routing.method);
      console.log('Processing Time:', result.routing.processingTime);
      
      if (result.routing.targetServices && result.routing.targetServices.length > 0) {
        console.log('\n🎯 Service Details:');
        result.routing.targetServices.forEach((service, index) => {
          console.log(`${index + 1}. ${service.serviceName}`);
          console.log(`   - Confidence: ${service.confidence}`);
          console.log(`   - Reasoning: ${service.reasoning}`);
        });
      }
    } else {
      console.log('Error:', result.error);
      console.log('Fallback services:', result.fallback?.availableServices?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Direct test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAIDirect();
