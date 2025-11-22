#!/usr/bin/env node

/**
 * Compare REST vs gRPC Routing
 */

const http = require('http');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

async function compareRestVsGrpc() {
  console.log('🔍 COMPARING REST vs gRPC ROUTING');
  console.log('=' .repeat(60));
  
  const testQuery = 'process payment for order';
  
  try {
    // Test 1: REST Routing
    console.log('\n📡 TEST 1: REST ROUTING');
    console.log('=' .repeat(40));
    
    const restResponse = await makeHttpRequest('POST', '/route', { query: testQuery });
    
    console.log('REST Response:');
    console.log(`✅ Success: ${restResponse.success}`);
    console.log(`🎯 Target Services: ${restResponse.routing?.targetServices?.length || 0}`);
    console.log(`🤖 Method: ${restResponse.routing?.method}`);
    console.log(`⏱️  Processing Time: ${restResponse.routing?.processingTime}`);
    
    if (restResponse.routing?.targetServices?.length > 0) {
      console.log('📋 Found Services:');
      restResponse.routing.targetServices.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.serviceName} (confidence: ${service.confidence})`);
        if (service.reasoning) {
          console.log(`      Reasoning: ${service.reasoning}`);
        }
      });
    } else {
      console.log('❌ No services found in REST');
    }
    
    // Test 2: gRPC Routing
    console.log('\n🔌 TEST 2: gRPC ROUTING');
    console.log('=' .repeat(40));
    
    const grpcResponse = await makeGrpcRequest(testQuery);
    
    if (grpcResponse.success) {
      console.log('gRPC Response:');
      console.log(`✅ Success: true`);
      console.log(`🎯 Target Services: ${grpcResponse.target_services?.length || 0}`);
      
      if (grpcResponse.target_services?.length > 0) {
        console.log('📋 Found Services:');
        grpcResponse.target_services.forEach((serviceName, index) => {
          console.log(`   ${index + 1}. ${serviceName}`);
        });
      } else {
        console.log('❌ No services found in gRPC');
      }
      
      // Parse routing metadata
      if (grpcResponse.routing_metadata) {
        try {
          const metadata = JSON.parse(grpcResponse.routing_metadata);
          console.log(`🤖 Method: ${metadata.routing_method}`);
          console.log(`⏱️  Processing Time: ${metadata.processing_time}`);
          console.log(`🎯 Confidence: ${metadata.confidence}`);
        } catch (e) {
          console.log('⚠️  Could not parse routing metadata');
        }
      }
      
      // Parse envelope
      if (grpcResponse.envelope_json) {
        try {
          const envelope = JSON.parse(grpcResponse.envelope_json);
          console.log(`📦 Envelope Query: ${envelope.payload?.query}`);
        } catch (e) {
          console.log('⚠️  Could not parse envelope');
        }
      }
      
    } else {
      console.log('❌ gRPC call failed:', grpcResponse.error);
    }
    
    // Comparison
    console.log('\n📊 COMPARISON RESULTS');
    console.log('=' .repeat(60));
    
    const restFound = restResponse.routing?.targetServices?.length || 0;
    const grpcFound = grpcResponse.success ? (grpcResponse.target_services?.length || 0) : 0;
    
    console.log(`📡 REST found: ${restFound} services`);
    console.log(`🔌 gRPC found: ${grpcFound} services`);
    
    if (restFound > 0 && grpcFound > 0) {
      console.log('✅ Both REST and gRPC routing work!');
    } else if (restFound > 0 && grpcFound === 0) {
      console.log('⚠️  REST works but gRPC has issues');
    } else if (restFound === 0 && grpcFound > 0) {
      console.log('⚠️  gRPC works but REST has issues');
    } else {
      console.log('❌ Both REST and gRPC have issues');
    }
    
  } catch (error) {
    console.error('❌ Comparison failed:', error.message);
  }
}

function makeHttpRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const postData = method === 'GET' ? '' : JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: method === 'GET' ? {} : {
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
    if (method !== 'GET') {
      req.write(postData);
    }
    req.end();
  });
}

async function makeGrpcRequest(queryText) {
  return new Promise((resolve, reject) => {
    try {
      // Load proto
      const protoPath = path.join(__dirname, 'src/grpc/proto/coordinator.proto');
      const packageDefinition = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      });
      
      const proto = grpc.loadPackageDefinition(packageDefinition);
      const client = new proto.rag.v1.CoordinatorService('localhost:50051', grpc.credentials.createInsecure());
      
      const request = {
        tenant_id: 'test-tenant',
        user_id: 'test-user',
        query_text: queryText,
        metadata: {
          source: 'test',
          intent: 'payment'
        }
      };
      
      client.Route(request, (error, response) => {
        if (error) {
          resolve({ success: false, error: error.message });
        } else {
          resolve({ success: true, ...response });
        }
      });
      
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}

compareRestVsGrpc();
