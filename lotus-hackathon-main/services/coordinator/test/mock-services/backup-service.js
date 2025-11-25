const express = require('express');

const app = express();
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Process endpoint - returns OK data
app.post('/api/process', (req, res) => {
  console.log('[MOCK-BACKUP] Received request:', req.body);
  res.json({
    success: true,
    data: {
      backup: true,
      results: ['backup-data'],
      timestamp: new Date().toISOString()
      // 3 fields = quality 0.7
    }
  });
});

const PORT = 4003;
app.listen(PORT, () => {
  console.log(`[MOCK-BACKUP] Running on http://localhost:${PORT}`);
});

