const express = require('express');
const router = express.Router();
const knowledgeGraphService = require('../services/knowledgeGraphService');
const logger = require('../utils/logger');

/**
 * GET /knowledge-graph
 * GET /graph
 * Knowledge Graph endpoint - Visual representation of all registered services and their relationships
 */
router.get('/', async (req, res, next) => {
  try {
    const forceRebuild = req.query.rebuild === 'true';
    
    // Get knowledge graph (from cache/Supabase or rebuild)
    const knowledgeGraph = await knowledgeGraphService.getGraph(forceRebuild);

    logger.info('Knowledge graph request', {
      totalServices: knowledgeGraph.metadata.totalServices,
      relationships: knowledgeGraph.relationships.length,
      version: knowledgeGraph.metadata.version,
      fromCache: !forceRebuild
    });

    res.status(200).json({
      success: true,
      knowledgeGraph
    });
  } catch (error) {
    logger.error('Failed to retrieve knowledge graph', {
      error: error.message
    });

    next(error);
  }
});

/**
 * POST /knowledge-graph/rebuild
 * Force rebuild knowledge graph
 */
router.post('/rebuild', async (req, res, next) => {
  try {
    logger.info('Manual knowledge graph rebuild requested');
    const graph = await knowledgeGraphService.rebuildGraph();
    
    res.status(200).json({
      success: true,
      message: 'Knowledge graph rebuilt successfully',
      graph: {
        version: graph.metadata.version,
        totalServices: graph.metadata.totalServices,
        relationships: graph.relationships.length
      }
    });
  } catch (error) {
    logger.error('Failed to rebuild knowledge graph', {
      error: error.message,
      stack: error.stack
    });

    next(error);
  }
});

module.exports = router;
