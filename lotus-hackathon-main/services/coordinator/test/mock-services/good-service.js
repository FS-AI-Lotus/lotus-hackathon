const express = require('express');

const app = express();
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Process endpoint - returns GOOD data (quality: 0.7+)
app.post('/api/process', (req, res) => {
  console.log('[MOCK-GOOD] Received request:', req.body);
  res.json({
    success: true,
    data: {
      id: 123,
      userId: req.body.user_id || 'test-user',
      query: req.body.payload?.query || 'test query',
      results: [
        { item: 'result1', value: 100 },
        { item: 'result2', value: 200 }
      ],
      metadata: {
        processedAt: new Date().toISOString(),
        service: 'mock-good-service'
      },
      summary: 'This is good quality data',
      count: 2
      // 7+ fields = quality 0.7
    }
  });
});

const PORT = 4002;
app.listen(PORT, () => {
  console.log(`[MOCK-GOOD] Running on http://localhost:${PORT}`);
});

