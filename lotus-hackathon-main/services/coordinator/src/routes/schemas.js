const express = require('express');
const router = express.Router();
const schemaRegistryService = require('../services/schemaRegistryService');
const logger = require('../utils/logger');
const { sanitizeInput } = require('../middleware/validation');

/**
 * GET /schemas
 * List all registered schemas
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await schemaRegistryService.listAllSchemas();
    
    logger.info('All schemas requested');
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Failed to list schemas', {
      error: error.message
    });
    next(error);
  }
});

/**
 * GET /schemas/:serviceId
 * Get all schemas for a specific service
 */
router.get('/:serviceId', async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const result = await schemaRegistryService.getAllSchemas(serviceId);
    
    logger.info('Service schemas requested', { serviceId });
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Failed to get service schemas', {
      error: error.message,
      serviceId: req.params.serviceId
    });
    
    if (error.message === 'Service not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    next(error);
  }
});

/**
 * GET /schemas/:serviceId/:schemaType
 * Get specific schema type for a service
 */
router.get('/:serviceId/:schemaType', async (req, res, next) => {
  try {
    const { serviceId, schemaType } = req.params;
    const { version = 'latest' } = req.query;
    
    const schema = await schemaRegistryService.getSchema(serviceId, schemaType, version);
    
    if (!schema) {
      return res.status(404).json({
        success: false,
        error: `Schema type '${schemaType}' not found for service`
      });
    }
    
    logger.info('Specific schema requested', { serviceId, schemaType, version });
    
    res.status(200).json({
      success: true,
      serviceId,
      schemaType,
      version,
      schema
    });
  } catch (error) {
    logger.error('Failed to get specific schema', {
      error: error.message,
      serviceId: req.params.serviceId,
      schemaType: req.params.schemaType
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    next(error);
  }
});

/**
 * POST /schemas/:serviceId/validate
 * Validate data against service schema
 */
router.post('/:serviceId/validate', sanitizeInput, async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { data, schemaType, schemaName } = req.body;
    
    if (!data || !schemaType || !schemaName) {
      return res.status(400).json({
        success: false,
        error: 'data, schemaType, and schemaName are required'
      });
    }
    
    const result = await schemaRegistryService.validateSchema(serviceId, data, schemaType, schemaName);
    
    logger.info('Schema validation requested', {
      serviceId,
      schemaType,
      schemaName,
      valid: result.valid
    });
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Schema validation failed', {
      error: error.message,
      serviceId: req.params.serviceId,
      body: req.body
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    next(error);
  }
});

/**
 * GET /schemas/:serviceId/compare/:version1/:version2
 * Compare two schema versions
 */
router.get('/:serviceId/compare/:version1/:version2', async (req, res, next) => {
  try {
    const { serviceId, version1, version2 } = req.params;
    
    const result = await schemaRegistryService.compareSchemaVersions(serviceId, version1, version2);
    
    logger.info('Schema version comparison requested', {
      serviceId,
      version1,
      version2
    });
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Schema version comparison failed', {
      error: error.message,
      serviceId: req.params.serviceId,
      version1: req.params.version1,
      version2: req.params.version2
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    next(error);
  }
});

module.exports = router;

