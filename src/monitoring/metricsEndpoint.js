/**
 * Metrics Endpoint Handler
 * 
 * Express route handler for the /metrics endpoint.
 * Returns Prometheus-formatted metrics.
 * 
 * Usage:
 *   const metricsEndpoint = require('./src/monitoring/metricsEndpoint');
 *   app.get('/metrics', metricsEndpoint);
 */

const { getMetrics } = require('./metrics');

/**
 * Metrics endpoint handler
 * Returns Prometheus-formatted metrics
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function metricsEndpoint(req, res) {
  try {
    const metrics = await getMetrics();
    
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(metrics);
  } catch (error) {
    // If metrics collection fails, return 500
    res.status(500).json({ 
      error: 'Failed to collect metrics',
      message: error.message 
    });
  }
}

module.exports = metricsEndpoint;

