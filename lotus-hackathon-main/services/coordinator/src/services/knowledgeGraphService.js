const logger = require('../utils/logger');
const supabase = require('../config/supabase');
const registryService = require('./registryService');

/**
 * Knowledge Graph Service - Manages persistent knowledge graph storage
 */
class KnowledgeGraphService {
  constructor() {
    this.useSupabase = !!supabase;
    this.cache = null;
    this.lastUpdate = null;
    this.cacheTTL = 30000; // 30 seconds cache
    
    if (this.useSupabase) {
      logger.info('KnowledgeGraphService initialized with Supabase');
    } else {
      logger.info('KnowledgeGraphService initialized with in-memory cache only');
    }
  }

  /**
   * Build knowledge graph from services
   * @param {Array} services - Array of service objects
   * @returns {Object} - Knowledge graph structure
   */
  buildGraph(services) {
    const knowledgeGraph = {
      metadata: {
        totalServices: services.length,
        activeServices: services.filter(s => s.status === 'active').length,
        lastUpdated: new Date().toISOString(),
        version: this._getNextVersion()
      },
      nodes: services.map(service => ({
        id: service.id,
        label: service.serviceName,
        type: 'microservice',
        data: {
          serviceName: service.serviceName,
          version: service.version,
          endpoint: service.endpoint,
          status: service.status,
          registeredAt: service.registeredAt,
          lastHealthCheck: service.lastHealthCheck,
          healthCheck: service.healthCheck,
          migrationFile: service.migrationFile
        }
      })),
      edges: [],
      schemas: {},
      relationships: []
    };

    // Extract schemas and build relationships
    services.forEach(service => {
      // Extract schema information from migrationFile
      if (service.migrationFile && typeof service.migrationFile === 'object') {
        const schema = service.migrationFile.schema || 'default';
        const tables = service.migrationFile.tables || [];
        
        if (!knowledgeGraph.schemas[schema]) {
          knowledgeGraph.schemas[schema] = {
            version: schema,
            services: [],
            tables: new Set()
          };
        }
        
        knowledgeGraph.schemas[schema].services.push(service.serviceName);
        tables.forEach(table => knowledgeGraph.schemas[schema].tables.add(table));
      }

      // Build relationships based on service names and schemas
      services.forEach(otherService => {
        if (service.id !== otherService.id) {
          const relationship = {
            from: service.serviceName,
            to: otherService.serviceName,
            type: 'related',
            reason: [],
            weight: 0
          };

          // Same schema = related
          if (service.migrationFile?.schema && 
              otherService.migrationFile?.schema &&
              service.migrationFile.schema === otherService.migrationFile.schema) {
            relationship.reason.push('shared_schema');
            relationship.type = 'schema_related';
            relationship.weight += 3;
          }

          // Shared tables = related
          if (service.migrationFile?.tables && otherService.migrationFile?.tables) {
            const sharedTables = service.migrationFile.tables.filter(t => 
              otherService.migrationFile.tables.includes(t)
            );
            if (sharedTables.length > 0) {
              relationship.reason.push(`shared_tables: ${sharedTables.join(', ')}`);
              relationship.type = 'data_related';
              relationship.weight += sharedTables.length * 2;
            }
          }

          // Service name patterns (e.g., user-service -> user-auth-service)
          const serviceBase = service.serviceName.split('-')[0];
          const otherBase = otherService.serviceName.split('-')[0];
          if (serviceBase === otherBase && serviceBase !== '') {
            relationship.reason.push('same_domain');
            relationship.type = 'domain_related';
            relationship.weight += 1;
          }

          if (relationship.reason.length > 0) {
            knowledgeGraph.relationships.push(relationship);
            
            // Add edge to graph
            knowledgeGraph.edges.push({
              from: service.id,
              to: otherService.id,
              type: relationship.type,
              label: relationship.reason.join(', '),
              weight: relationship.weight
            });
          }
        }
      });
    });

    // Convert Set to Array for schemas
    Object.keys(knowledgeGraph.schemas).forEach(schema => {
      knowledgeGraph.schemas[schema].tables = Array.from(knowledgeGraph.schemas[schema].tables);
    });

    return knowledgeGraph;
  }

  /**
   * Save knowledge graph to Supabase
   * @param {Object} graph - Knowledge graph structure
   * @returns {Promise<boolean>}
   */
  async saveGraph(graph) {
    if (!this.useSupabase) {
      // Fallback to in-memory cache
      this.cache = graph;
      this.lastUpdate = Date.now();
      logger.info('Knowledge graph cached in memory');
      return true;
    }

    try {
      // Get current version (handle case where table is empty)
      let nextVersion = 1;
      const { data: latest, error: versionError } = await supabase
        .from('knowledge_graph')
        .select('version')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!versionError && latest) {
        nextVersion = latest.version + 1;
      }
      graph.metadata.version = nextVersion;

      const { error } = await supabase
        .from('knowledge_graph')
        .insert([{
          graph_data: graph,
          version: nextVersion
        }]);

      if (error) {
        logger.error('Failed to save knowledge graph to Supabase', { error: error.message });
        // Fallback to cache
        this.cache = graph;
        this.lastUpdate = Date.now();
        return false;
      }

      // Update cache
      this.cache = graph;
      this.lastUpdate = Date.now();

      logger.info('Knowledge graph saved to Supabase', {
        version: nextVersion,
        totalServices: graph.metadata.totalServices
      });

      return true;
    } catch (error) {
      logger.error('Error saving knowledge graph', { error: error.message });
      // Fallback to cache
      this.cache = graph;
      this.lastUpdate = Date.now();
      return false;
    }
  }

  /**
   * Get knowledge graph (from cache or Supabase)
   * @param {boolean} forceRebuild - Force rebuild even if cache is valid
   * @returns {Promise<Object>}
   */
  async getGraph(forceRebuild = false) {
    // Check cache first
    if (!forceRebuild && this.cache && this.lastUpdate) {
      const cacheAge = Date.now() - this.lastUpdate;
      if (cacheAge < this.cacheTTL) {
        logger.debug('Returning cached knowledge graph');
        return this.cache;
      }
    }

    // Try to get from Supabase
    if (this.useSupabase) {
      try {
        const { data, error } = await supabase
          .from('knowledge_graph')
          .select('graph_data, version, last_updated')
          .order('version', { ascending: false })
          .limit(1)
          .single();

        if (!error && data && data.graph_data) {
          this.cache = data.graph_data;
          this.lastUpdate = new Date(data.last_updated).getTime();
          logger.info('Knowledge graph loaded from Supabase', {
            version: data.version
          });
          return this.cache;
        }
      } catch (error) {
        logger.warn('Failed to load knowledge graph from Supabase', {
          error: error.message
        });
      }
    }

    // Rebuild from services
    logger.info('Rebuilding knowledge graph from services');
    const services = await registryService.getAllServicesFull();
    const graph = this.buildGraph(services);
    
    // Save it
    await this.saveGraph(graph);
    
    return graph;
  }

  /**
   * Rebuild and save knowledge graph
   * @returns {Promise<Object>}
   */
  async rebuildGraph() {
    logger.info('Rebuilding knowledge graph');
    try {
      const services = await registryService.getAllServicesFull();
      logger.info(`Rebuilding graph with ${services.length} services`);
      const graph = this.buildGraph(services);
      const saved = await this.saveGraph(graph);
      
      if (saved) {
        logger.info('Knowledge graph rebuilt and saved successfully', {
          version: graph.metadata.version,
          totalServices: graph.metadata.totalServices
        });
      } else {
        logger.warn('Knowledge graph rebuilt but failed to save to Supabase');
      }
      
      return graph;
    } catch (error) {
      logger.error('Error rebuilding knowledge graph', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Find service by query using knowledge graph
   * @param {string} query - User query/intent
   * @returns {Promise<Object|null>} - Best matching service
   */
  async findServiceByQuery(query) {
    const graph = await this.getGraph();
    const queryLower = query.toLowerCase();

    // Search in service names
    for (const node of graph.nodes) {
      const serviceName = node.data.serviceName.toLowerCase();
      if (serviceName.includes(queryLower) || queryLower.includes(serviceName.split('-')[0])) {
        return node.data;
      }
    }

    // Search in schemas
    for (const [schema, schemaData] of Object.entries(graph.schemas)) {
      if (queryLower.includes(schema.toLowerCase())) {
        // Return first service in this schema
        const serviceName = schemaData.services[0];
        const node = graph.nodes.find(n => n.data.serviceName === serviceName);
        if (node) return node.data;
      }
    }

    // Search in relationships
    for (const rel of graph.relationships) {
      if (queryLower.includes(rel.from.toLowerCase()) || queryLower.includes(rel.to.toLowerCase())) {
        const node = graph.nodes.find(n => n.data.serviceName === rel.from);
        if (node) return node.data;
      }
    }

    return null;
  }

  /**
   * Get related services for a given service
   * @param {string} serviceName - Service name
   * @returns {Promise<Array>} - Array of related services
   */
  async getRelatedServices(serviceName) {
    const graph = await this.getGraph();
    const related = [];

    for (const rel of graph.relationships) {
      if (rel.from === serviceName) {
        const node = graph.nodes.find(n => n.data.serviceName === rel.to);
        if (node) {
          related.push({
            ...node.data,
            relationshipType: rel.type,
            relationshipReason: rel.reason,
            weight: rel.weight
          });
        }
      } else if (rel.to === serviceName) {
        const node = graph.nodes.find(n => n.data.serviceName === rel.from);
        if (node) {
          related.push({
            ...node.data,
            relationshipType: rel.type,
            relationshipReason: rel.reason,
            weight: rel.weight
          });
        }
      }
    }

    // Sort by weight (strongest relationships first)
    return related.sort((a, b) => (b.weight || 0) - (a.weight || 0));
  }

  /**
   * Get next version number
   * @returns {number}
   */
  _getNextVersion() {
    if (this.cache && this.cache.metadata && this.cache.metadata.version) {
      return this.cache.metadata.version + 1;
    }
    return 1;
  }
}

// Singleton instance
const knowledgeGraphService = new KnowledgeGraphService();

module.exports = knowledgeGraphService;

