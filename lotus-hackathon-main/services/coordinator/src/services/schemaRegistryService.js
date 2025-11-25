const logger = require('../utils/logger');
const registryService = require('./registryService');

/**
 * Schema Registry Service - Manages and validates schemas for microservices
 */
class SchemaRegistryService {
  constructor() {
    this.schemas = new Map(); // serviceId -> schemas
    this.schemaVersions = new Map(); // serviceId -> [versions]
    logger.info('SchemaRegistryService initialized');
  }

  /**
   * Register schemas from migration file
   * @param {string} serviceId - Service ID
   * @param {Object} migrationFile - Migration file containing schemas
   * @returns {Promise<Object>} - Registration result
   */
  async registerSchema(serviceId, migrationFile) {
    try {
      const service = await registryService.getServiceById(serviceId);
      if (!service) {
        throw new Error('Service not found');
      }

      // Extract schemas from migration file
      const schemas = this._extractSchemas(migrationFile);
      
      // Store schemas
      this.schemas.set(serviceId, schemas);
      
      // Update version history
      const versions = this.schemaVersions.get(serviceId) || [];
      versions.push({
        version: migrationFile.version,
        timestamp: new Date().toISOString(),
        schemas
      });
      this.schemaVersions.set(serviceId, versions);

      logger.info('Schemas registered successfully', {
        serviceId,
        serviceName: service.serviceName,
        version: migrationFile.version,
        schemaCount: Object.keys(schemas).length
      });

      return {
        success: true,
        serviceId,
        version: migrationFile.version,
        schemas: Object.keys(schemas)
      };

    } catch (error) {
      logger.error('Failed to register schemas', {
        error: error.message,
        serviceId
      });
      throw error;
    }
  }

  /**
   * Validate data against registered schema
   * @param {string} serviceId - Service ID
   * @param {*} data - Data to validate
   * @param {string} schemaType - Type of schema ('api_request', 'api_response', 'event_payload', 'database')
   * @param {string} schemaName - Specific schema name (e.g., endpoint path, table name, event name)
   * @returns {Promise<Object>} - Validation result
   */
  async validateSchema(serviceId, data, schemaType, schemaName) {
    try {
      const schemas = this.schemas.get(serviceId);
      if (!schemas) {
        throw new Error('No schemas found for service');
      }

      const schema = this._getSchemaByType(schemas, schemaType, schemaName);
      if (!schema) {
        throw new Error(`Schema not found: ${schemaType}/${schemaName}`);
      }

      // Perform validation
      const validationResult = this._validateAgainstSchema(data, schema);

      logger.debug('Schema validation performed', {
        serviceId,
        schemaType,
        schemaName,
        valid: validationResult.valid
      });

      return {
        success: true,
        valid: validationResult.valid,
        errors: validationResult.errors,
        schemaType,
        schemaName
      };

    } catch (error) {
      logger.error('Schema validation failed', {
        error: error.message,
        serviceId,
        schemaType,
        schemaName
      });
      throw error;
    }
  }

  /**
   * Get schema for a service
   * @param {string} serviceId - Service ID
   * @param {string} schemaType - Type of schema
   * @param {string} version - Schema version ('latest' or specific version)
   * @returns {Promise<Object>} - Schema data
   */
  async getSchema(serviceId, schemaType, version = 'latest') {
    try {
      if (version === 'latest') {
        const schemas = this.schemas.get(serviceId);
        if (!schemas) {
          throw new Error('No schemas found for service');
        }
        return schemas[schemaType] || null;
      } else {
        // Get specific version
        const versions = this.schemaVersions.get(serviceId) || [];
        const versionData = versions.find(v => v.version === version);
        if (!versionData) {
          throw new Error(`Schema version ${version} not found`);
        }
        return versionData.schemas[schemaType] || null;
      }
    } catch (error) {
      logger.error('Failed to get schema', {
        error: error.message,
        serviceId,
        schemaType,
        version
      });
      throw error;
    }
  }

  /**
   * Get all schemas for a service
   * @param {string} serviceId - Service ID
   * @returns {Promise<Object>} - All schemas
   */
  async getAllSchemas(serviceId) {
    try {
      const service = await registryService.getServiceById(serviceId);
      if (!service) {
        throw new Error('Service not found');
      }

      const schemas = this.schemas.get(serviceId) || {};
      const versions = this.schemaVersions.get(serviceId) || [];

      return {
        success: true,
        serviceId,
        serviceName: service.serviceName,
        currentSchemas: schemas,
        versions: versions.map(v => ({
          version: v.version,
          timestamp: v.timestamp,
          schemaTypes: Object.keys(v.schemas)
        }))
      };

    } catch (error) {
      logger.error('Failed to get all schemas', {
        error: error.message,
        serviceId
      });
      throw error;
    }
  }

  /**
   * List all registered schemas
   * @returns {Promise<Array>} - List of all schemas
   */
  async listAllSchemas() {
    try {
      const result = [];
      
      for (const [serviceId, schemas] of this.schemas.entries()) {
        const service = await registryService.getServiceById(serviceId);
        if (service) {
          result.push({
            serviceId,
            serviceName: service.serviceName,
            schemaTypes: Object.keys(schemas),
            schemaCount: Object.keys(schemas).length
          });
        }
      }

      return {
        success: true,
        schemas: result,
        totalServices: result.length
      };

    } catch (error) {
      logger.error('Failed to list all schemas', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Compare schema versions
   * @param {string} serviceId - Service ID
   * @param {string} version1 - First version
   * @param {string} version2 - Second version
   * @returns {Promise<Object>} - Comparison result
   */
  async compareSchemaVersions(serviceId, version1, version2) {
    try {
      const versions = this.schemaVersions.get(serviceId) || [];
      
      const v1Data = versions.find(v => v.version === version1);
      const v2Data = versions.find(v => v.version === version2);

      if (!v1Data || !v2Data) {
        throw new Error('One or both versions not found');
      }

      const changes = this._compareSchemas(v1Data.schemas, v2Data.schemas);

      return {
        success: true,
        serviceId,
        version1,
        version2,
        changes
      };

    } catch (error) {
      logger.error('Failed to compare schema versions', {
        error: error.message,
        serviceId,
        version1,
        version2
      });
      throw error;
    }
  }

  /**
   * Extract schemas from migration file
   * @param {Object} migrationFile - Migration file
   * @returns {Object} - Extracted schemas
   * @private
   */
  _extractSchemas(migrationFile) {
    const schemas = {};

    // Extract API schemas
    if (migrationFile.api && migrationFile.api.endpoints) {
      schemas.api_endpoints = {};
      for (const endpoint of migrationFile.api.endpoints) {
        const key = `${endpoint.method}_${endpoint.path}`;
        schemas.api_endpoints[key] = {
          path: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          requestSchema: endpoint.requestSchema || {},
          responseSchema: endpoint.responseSchema || {}
        };
      }
    }

    // Extract database schemas
    if (migrationFile.database && migrationFile.database.tables) {
      schemas.database_tables = {};
      for (const table of migrationFile.database.tables) {
        schemas.database_tables[table.name] = {
          name: table.name,
          schema: table.schema || {}
        };
      }
    }

    // Extract event schemas
    if (migrationFile.events) {
      schemas.events = {
        publishes: migrationFile.events.publishes || [],
        subscribes: migrationFile.events.subscribes || []
      };
    }

    return schemas;
  }

  /**
   * Get schema by type and name
   * @param {Object} schemas - All schemas for service
   * @param {string} schemaType - Schema type
   * @param {string} schemaName - Schema name
   * @returns {Object|null} - Schema or null
   * @private
   */
  _getSchemaByType(schemas, schemaType, schemaName) {
    switch (schemaType) {
      case 'api_request':
      case 'api_response':
        return schemas.api_endpoints?.[schemaName] || null;
      case 'database':
        return schemas.database_tables?.[schemaName] || null;
      case 'event_payload':
        return schemas.events || null;
      default:
        return null;
    }
  }

  /**
   * Validate data against schema (basic validation)
   * @param {*} data - Data to validate
   * @param {Object} schema - Schema to validate against
   * @returns {Object} - Validation result
   * @private
   */
  _validateAgainstSchema(data, schema) {
    // Basic validation implementation
    // In a real implementation, you might use JSON Schema or similar
    
    const errors = [];
    
    try {
      // Basic type checking
      if (typeof data !== 'object' || data === null) {
        errors.push('Data must be an object');
      }

      // Check if schema has required fields (basic implementation)
      if (schema.requestSchema && schema.requestSchema.required) {
        for (const field of schema.requestSchema.required) {
          if (!(field in data)) {
            errors.push(`Missing required field: ${field}`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`]
      };
    }
  }

  /**
   * Compare two schema objects
   * @param {Object} schema1 - First schema
   * @param {Object} schema2 - Second schema
   * @returns {Object} - Changes between schemas
   * @private
   */
  _compareSchemas(schema1, schema2) {
    const changes = {
      added: [],
      removed: [],
      modified: []
    };

    // Get all schema keys from both versions
    const keys1 = new Set(Object.keys(schema1));
    const keys2 = new Set(Object.keys(schema2));

    // Find added schemas
    for (const key of keys2) {
      if (!keys1.has(key)) {
        changes.added.push(key);
      }
    }

    // Find removed schemas
    for (const key of keys1) {
      if (!keys2.has(key)) {
        changes.removed.push(key);
      }
    }

    // Find modified schemas (basic comparison)
    for (const key of keys1) {
      if (keys2.has(key)) {
        const s1 = JSON.stringify(schema1[key]);
        const s2 = JSON.stringify(schema2[key]);
        if (s1 !== s2) {
          changes.modified.push(key);
        }
      }
    }

    return changes;
  }
}

// Singleton instance
const schemaRegistryService = new SchemaRegistryService();

module.exports = schemaRegistryService;

