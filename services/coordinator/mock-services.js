#!/usr/bin/env node

/**
 * Mock Services for Cascading Fallback Testing
 * Creates simple HTTP servers that return different responses for testing
 */

const http = require('http');

// Mock Service 1: Returns empty data (will trigger fallback)
const mockService1 = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/process') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {} // Empty data - will fail quality check
      }));
    });
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Mock Service 2: Returns good data (will pass quality check)
const mockService2 = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/process') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          id: 1,
          name: 'Test Data',
          description: 'This is good quality data',
          value: 42,
          status: 'active',
          created: '2024-01-01',
          updated: '2024-01-02',
          metadata: { source: 'mock-service-2' },
          items: [{ id: 1, name: 'Item 1' }],
          tags: ['test', 'mock', 'cascading']
        }
      }));
    });
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Mock Service 3: Returns poor data (will fail quality check)
const mockService3 = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/process') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          timestamp: '2024-01-01',
          status: 'ok',
          message: 'success'
          // Only metadata - will fail quality check
        }
      }));
    });
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Start all mock services
const PORT1 = 4001;
const PORT2 = 4002;
const PORT3 = 4003;

mockService1.listen(PORT1, () => {
  console.log(`✓ Mock Service 1 (empty data) running on http://localhost:${PORT1}`);
});

mockService2.listen(PORT2, () => {
  console.log(`✓ Mock Service 2 (good data) running on http://localhost:${PORT2}`);
});

mockService3.listen(PORT3, () => {
  console.log(`✓ Mock Service 3 (poor data) running on http://localhost:${PORT3}`);
  console.log('\nAll mock services are running!');
  console.log('Press Ctrl+C to stop them.\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down mock services...');
  mockService1.close();
  mockService2.close();
  mockService3.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  mockService1.close();
  mockService2.close();
  mockService3.close();
  process.exit(0);
});

