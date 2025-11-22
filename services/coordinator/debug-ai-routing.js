#!/usr/bin/env node

/**
 * Debug AI Routing - Check what AI sees
 */

const registryService = require('./src/services/registryService');
const knowledgeGraphService = require('./src/services/knowledgeGraphService');

async function debugAIRouting() {
  console.log('🔍 AI ROUTING DEBUG');
  console.log('=' .repeat(50));
  
  try {
    // Get all services
    console.log('\n📋 1. Checking registered services...');
    const services = await registryService.getAllServicesFull();
    console.log(`Found ${services.length} services:`);
    
    services.forEach((service, index) => {
      console.log(`${index + 1}. ${service.serviceName}`);
      console.log(`   - Version: ${service.version}`);
      console.log(`   - Endpoint: ${service.endpoint}`);
      console.log(`   - Status: ${service.status}`);
      console.log(`   - Migration: ${service.migrationFile ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Get knowledge graph
    console.log('\n🧠 2. Checking knowledge graph...');
    const graph = await knowledgeGraphService.getGraph();
    console.log('Knowledge graph structure:');
    console.log(`- Services: ${graph.services ? graph.services.length : 0}`);
    console.log(`- Relationships: ${graph.relationships ? graph.relationships.length : 0}`);
    console.log(`- Capabilities: ${graph.capabilities ? Object.keys(graph.capabilities).length : 0}`);
    
    if (graph.services && graph.services.length > 0) {
      console.log('\nServices in knowledge graph:');
      graph.services.forEach((service, index) => {
        console.log(`${index + 1}. ${service.name || service.serviceName}`);
        if (service.capabilities) {
          console.log(`   - Capabilities: ${service.capabilities.join(', ')}`);
        }
        if (service.description) {
          console.log(`   - Description: ${service.description}`);
        }
      });
    }
    
    // Test AI prompt building
    console.log('\n🤖 3. Testing AI prompt building...');
    const aiRoutingService = require('./src/services/aiRoutingService');
    
    // Simulate what AI sees
    console.log('\nActive services for AI:');
    const activeServices = services.filter(service => service.status === 'active');
    console.log(`Active services count: ${activeServices.length}`);
    
    activeServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.serviceName}`);
      console.log(`   - Has migration file: ${!!service.migrationFile}`);
      if (service.migrationFile && service.migrationFile.api) {
        console.log(`   - API endpoints: ${service.migrationFile.api.endpoints ? service.migrationFile.api.endpoints.length : 0}`);
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Debug complete');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAIRouting();
