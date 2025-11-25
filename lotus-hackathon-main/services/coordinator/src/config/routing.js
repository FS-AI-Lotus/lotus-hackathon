/**
 * Routing Configuration
 * Centralized configuration for routing and cascading fallback behavior
 */

module.exports = {
  cascading: {
    maxAttempts: parseInt(process.env.MAX_FALLBACK_ATTEMPTS) || 5,
    minQualityScore: parseFloat(process.env.MIN_QUALITY_SCORE) || 0.5,
    stopOnFirst: process.env.STOP_ON_FIRST_SUCCESS !== 'false',
    attemptTimeout: parseInt(process.env.ATTEMPT_TIMEOUT) || 3000,
    qualityCriteria: {
      minKeys: 1,
      requireRelevant: true,
      rejectEmpty: true
    }
  }
};

