const logger = require('../utils/logger');

/**
 * Metrics Service - Tracks Prometheus-compatible metrics
 */
class MetricsService {
  constructor() {
    this.metrics = {
      registeredServices: 0,
      totalRegistrations: 0,
      failedRegistrations: 0,
      uiuxConfigFetches: 0,
      startTime: Date.now()
    };
    
    // Cascading metrics
    this.cascadingMetrics = {
      // Histogram buckets for successful rank [1, 2, 3, 4, 5, 10]
      successfulRankBuckets: {
        1: 0,   // le="1"
        2: 0,   // le="2"
        3: 0,   // le="3"
        4: 0,   // le="4"
        5: 0,   // le="5"
        10: 0,  // le="10"
        '+Inf': 0  // le="+Inf"
      },
      // Histogram buckets for attempts before success [1, 2, 3, 4, 5, 10]
      attemptsBeforeSuccessBuckets: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        10: 0,
        '+Inf': 0
      },
      // Counters
      primarySuccessTotal: 0,
      fallbackUsedTotal: {}, // { rank: count }
      // Sum and count for histograms
      successfulRankSum: 0,
      successfulRankCount: 0,
      attemptsBeforeSuccessSum: 0,
      attemptsBeforeSuccessCount: 0
    };
    
    logger.info('MetricsService initialized');
  }

  /**
   * Increment registration count
   */
  incrementRegistrations() {
    this.metrics.totalRegistrations += 1;
    this.metrics.registeredServices += 1;
  }

  /**
   * Increment failed registration count
   */
  incrementFailedRegistrations() {
    this.metrics.failedRegistrations += 1;
  }

  /**
   * Update registered services count
   * @param {number} count - Current number of registered services
   */
  updateRegisteredServices(count) {
    this.metrics.registeredServices = count;
  }

  /**
   * Increment UI/UX config fetch count
   */
  incrementUIUXFetches() {
    this.metrics.uiuxConfigFetches += 1;
  }

  /**
   * Get uptime in seconds
   * @returns {number}
   */
  getUptime() {
    return Math.floor((Date.now() - this.metrics.startTime) / 1000);
  }

  /**
   * Record cascading fallback success
   * @param {number} rank - Rank of service that succeeded (1, 2, 3, ...)
   * @param {number} attempts - Total attempts made before success
   */
  recordCascadingSuccess(rank, attempts) {
    const buckets = [1, 2, 3, 4, 5, 10];
    
    // Update successful rank histogram buckets
    for (const bucket of buckets) {
      if (rank <= bucket) {
        this.cascadingMetrics.successfulRankBuckets[bucket] += 1;
      }
    }
    this.cascadingMetrics.successfulRankBuckets['+Inf'] += 1;
    this.cascadingMetrics.successfulRankSum += rank;
    this.cascadingMetrics.successfulRankCount += 1;
    
    // Update attempts before success histogram buckets
    for (const bucket of buckets) {
      if (attempts <= bucket) {
        this.cascadingMetrics.attemptsBeforeSuccessBuckets[bucket] += 1;
      }
    }
    this.cascadingMetrics.attemptsBeforeSuccessBuckets['+Inf'] += 1;
    this.cascadingMetrics.attemptsBeforeSuccessSum += attempts;
    this.cascadingMetrics.attemptsBeforeSuccessCount += 1;
    
    // If rank 1 succeeded, increment primary success counter
    if (rank === 1) {
      this.cascadingMetrics.primarySuccessTotal += 1;
    } else {
      // Otherwise, increment fallback counter with the rank label
      const rankKey = rank.toString();
      if (!this.cascadingMetrics.fallbackUsedTotal[rankKey]) {
        this.cascadingMetrics.fallbackUsedTotal[rankKey] = 0;
      }
      this.cascadingMetrics.fallbackUsedTotal[rankKey] += 1;
    }
    
    logger.debug('Cascading success recorded', {
      rank,
      attempts,
      isPrimary: rank === 1
    });
  }

  /**
   * Get all metrics in Prometheus format
   * @returns {string} - Prometheus metrics format
   */
  getPrometheusMetrics() {
    const uptime = this.getUptime();
    const buckets = [1, 2, 3, 4, 5, 10];
    
    // Build successful rank histogram
    let successfulRankHistogram = `# HELP coordinator_successful_rank Rank of service that returned good results
# TYPE coordinator_successful_rank histogram
`;
    for (const bucket of buckets) {
      successfulRankHistogram += `coordinator_successful_rank_bucket{le="${bucket}"} ${this.cascadingMetrics.successfulRankBuckets[bucket]}
`;
    }
    successfulRankHistogram += `coordinator_successful_rank_bucket{le="+Inf"} ${this.cascadingMetrics.successfulRankBuckets['+Inf']}
`;
    successfulRankHistogram += `coordinator_successful_rank_sum ${this.cascadingMetrics.successfulRankSum}
`;
    successfulRankHistogram += `coordinator_successful_rank_count ${this.cascadingMetrics.successfulRankCount}
`;

    // Build attempts before success histogram
    let attemptsBeforeSuccessHistogram = `# HELP coordinator_attempts_before_success Number of attempts before getting good result
# TYPE coordinator_attempts_before_success histogram
`;
    for (const bucket of buckets) {
      attemptsBeforeSuccessHistogram += `coordinator_attempts_before_success_bucket{le="${bucket}"} ${this.cascadingMetrics.attemptsBeforeSuccessBuckets[bucket]}
`;
    }
    attemptsBeforeSuccessHistogram += `coordinator_attempts_before_success_bucket{le="+Inf"} ${this.cascadingMetrics.attemptsBeforeSuccessBuckets['+Inf']}
`;
    attemptsBeforeSuccessHistogram += `coordinator_attempts_before_success_sum ${this.cascadingMetrics.attemptsBeforeSuccessSum}
`;
    attemptsBeforeSuccessHistogram += `coordinator_attempts_before_success_count ${this.cascadingMetrics.attemptsBeforeSuccessCount}
`;

    // Build fallback used counter (with labels)
    let fallbackUsedCounter = `# HELP coordinator_fallback_used_total Times fallback to non-primary service was needed
# TYPE coordinator_fallback_used_total counter
`;
    const fallbackRanks = Object.keys(this.cascadingMetrics.fallbackUsedTotal).sort((a, b) => parseInt(a) - parseInt(b));
    for (const rank of fallbackRanks) {
      fallbackUsedCounter += `coordinator_fallback_used_total{rank="${rank}"} ${this.cascadingMetrics.fallbackUsedTotal[rank]}
`;
    }
    // If no fallbacks yet, still output the metric
    if (fallbackRanks.length === 0) {
      fallbackUsedCounter += `coordinator_fallback_used_total{rank=""} 0
`;
    }
    
    return `# HELP coordinator_registered_services_total Total number of registered services
# TYPE coordinator_registered_services_total gauge
coordinator_registered_services_total ${this.metrics.registeredServices}

# HELP coordinator_registration_requests_total Total number of registration requests
# TYPE coordinator_registration_requests_total counter
coordinator_registration_requests_total ${this.metrics.totalRegistrations}

# HELP coordinator_registration_failures_total Total number of failed registration attempts
# TYPE coordinator_registration_failures_total counter
coordinator_registration_failures_total ${this.metrics.failedRegistrations}

# HELP coordinator_uiux_config_fetches_total Total number of UI/UX config fetch requests
# TYPE coordinator_uiux_config_fetches_total counter
coordinator_uiux_config_fetches_total ${this.metrics.uiuxConfigFetches}

# HELP coordinator_uptime_seconds Service uptime in seconds
# TYPE coordinator_uptime_seconds gauge
coordinator_uptime_seconds ${uptime}

${successfulRankHistogram}
${attemptsBeforeSuccessHistogram}
# HELP coordinator_primary_success_total Times the primary target (rank 1) succeeded
# TYPE coordinator_primary_success_total counter
coordinator_primary_success_total ${this.cascadingMetrics.primarySuccessTotal}

${fallbackUsedCounter}`;
  }

  /**
   * Get metrics as JSON
   * @returns {Object}
   */
  getMetricsJSON() {
    return {
      registeredServices: this.metrics.registeredServices,
      totalRegistrations: this.metrics.totalRegistrations,
      failedRegistrations: this.metrics.failedRegistrations,
      uiuxConfigFetches: this.metrics.uiuxConfigFetches,
      uptime: this.getUptime(),
      cascading: {
        successfulRank: {
          buckets: this.cascadingMetrics.successfulRankBuckets,
          sum: this.cascadingMetrics.successfulRankSum,
          count: this.cascadingMetrics.successfulRankCount
        },
        attemptsBeforeSuccess: {
          buckets: this.cascadingMetrics.attemptsBeforeSuccessBuckets,
          sum: this.cascadingMetrics.attemptsBeforeSuccessSum,
          count: this.cascadingMetrics.attemptsBeforeSuccessCount
        },
        primarySuccessTotal: this.cascadingMetrics.primarySuccessTotal,
        fallbackUsedTotal: this.cascadingMetrics.fallbackUsedTotal
      }
    };
  }
}

// Singleton instance
const metricsService = new MetricsService();

module.exports = metricsService;


