const http = require('http');
const url = require('url');
const uiConfig = require('./ui-ux-config.json');

// Simple health endpoint for the UI/UX config service
function handleHealth(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', service: 'ui-ux-coordinator' }));
}

// Endpoint to serve the UI/UX configuration JSON to the coordinator
function handleUiConfig(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(uiConfig));
}

// Basic router: coordinator can call these endpoints
function requestHandler(req, res) {
  const parsed = url.parse(req.url, true);

  if (req.method === 'GET' && parsed.pathname === '/health') {
    return handleHealth(req, res);
  }

  if (req.method === 'GET' && parsed.pathname === '/ui-ux-config') {
    return handleUiConfig(req, res);
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
}

const port = process.env.PORT || 4000;

http.createServer(requestHandler).listen(port, () => {
  console.log(`UI/UX coordinator config service listening on port ${port}`);
});


