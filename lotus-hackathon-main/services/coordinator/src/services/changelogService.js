const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Changelog Service - Tracks all system changes
 */
class ChangelogService {
  constructor() {
    this.changes = [];
    this.maxEntries = 1000; // Keep last 1000 entries
    logger.info('ChangelogService initialized');
  }

  /**
   * Record a change event
   * @param {string} type - Type of change
   * @param {Object} details - Change details
   * @param {string} source - Source of the change (optional)
   */
  recordChange(type, details, source = 'system') {
    const change = {
      id: uuidv4(),
      type,
      details,
      source,
      timestamp: new Date().toISOString()
    };

    this.changes.unshift(change); // Add to beginning

    // Maintain max entries limit
    if (this.changes.length > this.maxEntries) {
      this.changes = this.changes.slice(0, this.maxEntries);
    }

    logger.debug('Change recorded', {
      type,
      changeId: change.id,
      source
    });

    return change.id;
  }

  /**
   * Record service registration
   * @param {string} serviceId - Service ID
   * @param {string} serviceName - Service name
   * @param {string} version - Service version
   */
  recordServiceRegistration(serviceId, serviceName, version) {
    return this.recordChange('service_registered', {
      serviceId,
      serviceName,
      version,
      stage: 1
    });
  }

  /**
   * Record migration upload
   * @param {string} serviceId - Service ID
   * @param {string} serviceName - Service name
   * @param {string} version - Migration version
   */
  recordMigrationUpload(serviceId, serviceName, version) {
    return this.recordChange('migration_uploaded', {
      serviceId,
      serviceName,
      migrationVersion: version,
      stage: 2
    });
  }

  /**
   * Record UI/UX configuration update
   * @param {string} version - Config version
   * @param {string} updatedBy - Who updated it
   * @param {Object} changes - What changed
   */
  recordUIUXUpdate(version, updatedBy, changes) {
    return this.recordChange('uiux_updated', {
      version,
      updatedBy,
      changes
    });
  }

  /**
   * Record routing operation
   * @param {Array} targetServices - Services that were routed to
   * @param {number} confidence - Routing confidence
   * @param {string} method - Routing method (ai/fallback)
   * @param {string} requestType - Type of request routed
   */
  recordRouting(targetServices, confidence, method, requestType) {
    return this.recordChange('routing_performed', {
      targetServices,
      confidence,
      method,
      requestType
    });
  }

  /**
   * Record service status change
   * @param {string} serviceId - Service ID
   * @param {string} serviceName - Service name
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   */
  recordStatusChange(serviceId, serviceName, oldStatus, newStatus) {
    return this.recordChange('service_status_changed', {
      serviceId,
      serviceName,
      oldStatus,
      newStatus
    });
  }

  /**
   * Record knowledge graph update
   * @param {string} operation - Operation type (rebuild, update, etc.)
   * @param {Object} stats - Statistics about the operation
   */
  recordKnowledgeGraphUpdate(operation, stats) {
    return this.recordChange('knowledge_graph_updated', {
      operation,
      stats
    });
  }

  /**
   * Record schema operation
   * @param {string} operation - Operation type (register, validate, etc.)
   * @param {string} serviceId - Service ID
   * @param {string} schemaType - Schema type
   */
  recordSchemaOperation(operation, serviceId, schemaType) {
    return this.recordChange('schema_operation', {
      operation,
      serviceId,
      schemaType
    });
  }

  /**
   * Get changelog with pagination
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @param {string} type - Filter by change type (optional)
   * @returns {Object} - Paginated changelog
   */
  getChangelog(page = 1, limit = 50, type = null) {
    let filteredChanges = this.changes;

    // Filter by type if specified
    if (type) {
      filteredChanges = this.changes.filter(change => change.type === type);
    }

    const total = filteredChanges.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const changes = filteredChanges.slice(startIndex, endIndex);

    return {
      changes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1
      },
      filter: type ? { type } : null
    };
  }

  /**
   * Get changelog statistics
   * @returns {Object} - Changelog statistics
   */
  getStats() {
    const typeStats = {};
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentChanges = this.changes.filter(change => 
      new Date(change.timestamp) > last24Hours
    );

    // Count by type
    for (const change of this.changes) {
      typeStats[change.type] = (typeStats[change.type] || 0) + 1;
    }

    return {
      totalChanges: this.changes.length,
      recentChanges: recentChanges.length,
      typeStats,
      oldestChange: this.changes.length > 0 ? this.changes[this.changes.length - 1].timestamp : null,
      newestChange: this.changes.length > 0 ? this.changes[0].timestamp : null
    };
  }

  /**
   * Search changelog
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {Array} - Matching changes
   */
  searchChangelog(query, limit = 20) {
    const queryLower = query.toLowerCase();
    
    const matches = this.changes.filter(change => {
      const searchText = JSON.stringify(change).toLowerCase();
      return searchText.includes(queryLower);
    });

    return matches.slice(0, limit);
  }

  /**
   * Clear old entries (keep only recent ones)
   * @param {number} keepCount - Number of entries to keep
   */
  cleanup(keepCount = 500) {
    if (this.changes.length > keepCount) {
      const removed = this.changes.length - keepCount;
      this.changes = this.changes.slice(0, keepCount);
      
      logger.info('Changelog cleanup performed', {
        removed,
        remaining: this.changes.length
      });
    }
  }
}

// Singleton instance
const changelogService = new ChangelogService();

module.exports = changelogService;

