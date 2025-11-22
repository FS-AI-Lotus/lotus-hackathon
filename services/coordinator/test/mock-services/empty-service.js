const express = require('express');

const app = express();
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Process endpoint - returns EMPTY data (triggers fallback)
app.post('/api/process', (req, res) => {
  console.log('[MOCK-EMPTY] Received request:', req.body);
  res.json({
    success: true,
    data: {}  // Empty data - quality: 0.0
  });
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`[MOCK-EMPTY] Running on http://localhost:${PORT}`);
});

