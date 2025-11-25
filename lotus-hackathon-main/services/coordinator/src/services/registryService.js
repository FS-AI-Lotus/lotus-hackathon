const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const supabase = require('../config/supabase');
const knowledgeGraphService = require('./knowledgeGraphService');

/**
 * Service Registry - Supabase-backed storage with in-memory fallback
 * Automatically uses Supabase if configured, otherwise falls back to in-memory
 */
class RegistryService {
  constructor() {
    // Fallback: In-memory storage if Supabase is not available
    this.services = new Map();
    this.useSupabase = !!supabase;
    
    if (this.useSupabase) {
      logger.info('RegistryService initialized with Supabase');
    } else {
      logger.info('RegistryService initialized with in-memory storage (Supabase not configured)');
    }
  }

  /**
   * Register a new microservice
   * @param {Object} serviceData - Service registration data
   * @returns {Promise<Object>} - Registration result with serviceId
   */
  async registerService(serviceData) {
    try {
      const { serviceName, version, endpoint, healthCheck, description, metadata, migrationFile } = serviceData;

      // Validate required fields
      if (!serviceName || !version || !endpoint) {
        throw new Error('Missing required fields: serviceName, version, endpoint');
      }

      // Validate endpoint URL format
      try {
        new URL(endpoint);
      } catch (error) {
        throw new Error('Invalid endpoint URL format');
      }

      // Check if service name already exists
      const existingService = await this.getServiceByName(serviceName);
      if (existingService) {
        throw new Error(`Service with name '${serviceName}' already exists`);
      }

      // Generate unique service ID
      const serviceId = uuidv4();

      // Determine initial status
      const initialStatus = migrationFile ? 'active' : 'pending_migration';

      // Create service entry
      const serviceEntry = {
        id: serviceId,
        service_name: serviceName.trim(),
        version: version.trim(),
        endpoint: endpoint.trim(),
        health_check: healthCheck ? healthCheck.trim() : '/health',
        migration_file: migrationFile || null,
        registered_at: new Date().toISOString(),
        last_health_check: null,
        status: initialStatus
      };

      // Store in Supabase or fallback to memory
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('registered_services')
          .insert([serviceEntry])
          .select()
          .single();

        if (error) {
          logger.error('Supabase insert failed', { error: error.message });
          throw new Error(`Failed to register service: ${error.message}`);
        }

        logger.info('Service registered successfully in Supabase', {
          serviceId,
          serviceName,
          version,
          endpoint
        });

        // Rebuild knowledge graph after registration (async, non-blocking)
        knowledgeGraphService.rebuildGraph().catch(error => {
          logger.error('Failed to rebuild knowledge graph after registration', {
            error: error.message,
            stack: error.stack
          });
        });

        return {
          success: true,
          serviceId,
          service: this._mapSupabaseToService(data)
        };
      } else {
        // Fallback to in-memory storage
        const inMemoryEntry = {
          id: serviceId,
          serviceName: serviceName.trim(),
          version: version.trim(),
          endpoint: endpoint.trim(),
          healthCheck: healthCheck ? healthCheck.trim() : '/health',
          description: description ? description.trim() : null,
          metadata: metadata || {},
          migrationFile: migrationFile || null,
          registeredAt: new Date().toISOString(),
          lastHealthCheck: null,
          status: initialStatus
        };
        
        this.services.set(serviceId, inMemoryEntry);

        logger.info('Service registered successfully (in-memory)', {
          serviceId,
          serviceName,
          version,
          endpoint
        });

        // Rebuild knowledge graph after registration (async, non-blocking)
        knowledgeGraphService.rebuildGraph().catch(error => {
          logger.error('Failed to rebuild knowledge graph after registration', {
            error: error.message,
            stack: error.stack
          });
        });

        return {
          success: true,
          serviceId,
          service: inMemoryEntry
        };
      }
    } catch (error) {
      logger.error('Failed to register service', {
        error: error.message,
        serviceData
      });
      throw error;
    }
  }

  /**
   * Get all registered services with full details (for knowledge graph)
   * @returns {Promise<Array>} - Array of service entries with full details
   */
  async getAllServicesFull() {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('registered_services')
        .select('*')
        .order('registered_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch services from Supabase', { error: error.message });
        return [];
      }

      return data.map(service => this._mapSupabaseToService(service));
    } else {
      // Fallback to in-memory
      return Array.from(this.services.values());
    }
  }

  /**
   * Get all registered services (summary view)
   * @returns {Promise<Array>} - Array of service entries
   */
  async getAllServices() {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('registered_services')
        .select('*')
        .order('registered_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch services from Supabase', { error: error.message });
        return [];
      }

      return data.map(service => ({
        serviceName: service.service_name,
        version: service.version,
        endpoint: service.endpoint,
        status: service.status,
        registeredAt: service.registered_at
      }));
    } else {
      // Fallback to in-memory
      return Array.from(this.services.values()).map(service => ({
        serviceName: service.serviceName,
        version: service.version,
        endpoint: service.endpoint,
        status: service.status,
        registeredAt: service.registeredAt
      }));
    }
  }

  /**
   * Get service by ID
   * @param {string} serviceId - Service ID
   * @returns {Promise<Object|null>} - Service entry or null
   */
  async getServiceById(serviceId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('registered_services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (error || !data) {
        return null;
      }

      return this._mapSupabaseToService(data);
    } else {
      return this.services.get(serviceId) || null;
    }
  }

  /**
   * Get service by name
   * @param {string} serviceName - Service name
   * @returns {Promise<Object|null>} - Service entry or null
   */
  async getServiceByName(serviceName) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('registered_services')
        .select('*')
        .eq('service_name', serviceName)
        .single();

      if (error || !data) {
        return null;
      }

      return this._mapSupabaseToService(data);
    } else {
      for (const service of this.services.values()) {
        if (service.serviceName === serviceName) {
          return service;
        }
      }
      return null;
    }
  }

  /**
   * Update service status
   * @param {string} serviceId - Service ID
   * @param {string} status - New status
   */
  async updateServiceStatus(serviceId, status) {
    if (this.useSupabase) {
      const { error } = await supabase
        .from('registered_services')
        .update({
          status,
          last_health_check: new Date().toISOString()
        })
        .eq('id', serviceId);

      if (error) {
        logger.error('Failed to update service status in Supabase', { error: error.message });
        return;
      }

      logger.info('Service status updated in Supabase', { serviceId, status });
      
      // Rebuild knowledge graph after status update
      setImmediate(async () => {
        try {
          await knowledgeGraphService.rebuildGraph();
        } catch (error) {
          logger.warn('Failed to rebuild knowledge graph after status update', {
            error: error.message
          });
        }
      });
    } else {
      const service = this.services.get(serviceId);
      if (service) {
        service.status = status;
        service.lastHealthCheck = new Date().toISOString();
        this.services.set(serviceId, service);
        logger.info('Service status updated (in-memory)', { serviceId, status });
        
        // Rebuild knowledge graph after status update
        setImmediate(async () => {
          try {
            await knowledgeGraphService.rebuildGraph();
          } catch (error) {
            logger.warn('Failed to rebuild knowledge graph after status update', {
              error: error.message
            });
          }
        });
      }
    }
  }

  /**
   * Get total number of registered services
   * @returns {Promise<number>}
   */
  async getTotalServices() {
    if (this.useSupabase) {
      const { count, error } = await supabase
        .from('registered_services')
        .select('*', { count: 'exact', head: true });

      if (error) {
        logger.error('Failed to count services in Supabase', { error: error.message });
        return 0;
      }

      return count || 0;
    } else {
      return this.services.size;
    }
  }

  /**
   * Get active services count
   * @returns {Promise<number>}
   */
  async getActiveServicesCount() {
    if (this.useSupabase) {
      const { count, error } = await supabase
        .from('registered_services')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (error) {
        logger.error('Failed to count active services in Supabase', { error: error.message });
        return 0;
      }

      return count || 0;
    } else {
      return Array.from(this.services.values()).filter(s => s.status === 'active').length;
    }
  }

  /**
   * Complete migration for a registered service (Stage 2)
   * @param {string} serviceId - Service ID
   * @param {Object} migrationFile - Migration file data
   * @returns {Promise<Object>} - Updated service
   */
  async completeMigration(serviceId, migrationFile) {
    try {
      if (this.useSupabase) {
        // Update service in Supabase with migration file and set to active
        const { data, error } = await supabase
          .from('registered_services')
          .update({
            migration_file: migrationFile,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', serviceId)
          .select()
          .single();

        if (error) {
          logger.error('Supabase migration update failed', { error: error.message, serviceId });
          throw new Error(`Failed to complete migration: ${error.message}`);
        }

        logger.info('Migration completed successfully in Supabase', {
          serviceId,
          serviceName: data.service_name
        });

        // Trigger knowledge graph rebuild
        const knowledgeGraphService = require('./knowledgeGraphService');
        setImmediate(() => {
          knowledgeGraphService.rebuildGraph().catch(error => {
            logger.warn('Failed to rebuild knowledge graph after migration', {
              error: error.message
            });
          });
        });

        return this._mapSupabaseToService(data);
      } else {
        // Update service in memory
        const service = this.services.get(serviceId);
        if (!service) {
          throw new Error('Service not found');
        }

        service.migrationFile = migrationFile;
        service.status = 'active';
        service.updatedAt = new Date().toISOString();

        this.services.set(serviceId, service);

        logger.info('Migration completed successfully in memory', {
          serviceId,
          serviceName: service.serviceName
        });

        // Trigger knowledge graph rebuild
        const knowledgeGraphService = require('./knowledgeGraphService');
        setImmediate(() => {
          knowledgeGraphService.rebuildGraph().catch(error => {
            logger.warn('Failed to rebuild knowledge graph after migration', {
              error: error.message
            });
          });
        });

        return service;
      }
    } catch (error) {
      logger.error('Failed to complete migration', {
        error: error.message,
        serviceId
      });
      throw error;
    }
  }

  /**
   * Delete a service by ID
   * @param {string} serviceId - Service ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteService(serviceId) {
    try {
      if (this.useSupabase) {
        const { error } = await supabase
          .from('registered_services')
          .delete()
          .eq('id', serviceId);

        if (error) {
          logger.error('Failed to delete service from Supabase', {
            serviceId,
            error: error.message
          });
          return false;
        }

        logger.info('Service deleted from Supabase', { serviceId });
        return true;
      } else {
        // In-memory deletion
        const deleted = this.services.delete(serviceId);
        if (deleted) {
          logger.info('Service deleted from memory', { serviceId });
        }
        return deleted;
      }
    } catch (error) {
      logger.error('Failed to delete service', {
        serviceId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Map Supabase row to service object (snake_case to camelCase)
   * @param {Object} row - Supabase row
   * @returns {Object} - Service object
   */
  _mapSupabaseToService(row) {
    return {
      id: row.id,
      serviceName: row.service_name,
      version: row.version,
      endpoint: row.endpoint,
      healthCheck: row.health_check,
      migrationFile: row.migration_file,
      registeredAt: row.registered_at,
      lastHealthCheck: row.last_health_check,
      status: row.status
    };
  }
}

// Singleton instance
const registryService = new RegistryService();

module.exports = registryService;
