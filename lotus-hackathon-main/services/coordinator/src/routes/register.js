const express = require('express');
const router = express.Router();
const registryService = require('../services/registryService');
const metricsService = require('../services/metricsService');
const logger = require('../utils/logger');
const { validateRegistration, sanitizeInput } = require('../middleware/validation');

/**
 * POST /register
 * Register a new microservice
 */
router.post('/', sanitizeInput, validateRegistration, async (req, res, next) => {
  try {
    const { serviceName, version, endpoint, healthCheck, migrationFile } = req.body;

    // Attempt to register the service
    const result = await registryService.registerService({
      serviceName,
      version,
      endpoint,
      healthCheck,
      migrationFile
    });

    // Update metrics
    metricsService.incrementRegistrations();
    const totalServices = await registryService.getTotalServices();
    metricsService.updateRegisteredServices(totalServices);

    logger.info('Service registration successful', {
      serviceId: result.serviceId,
      serviceName
    });

    res.status(201).json({
      success: true,
      message: 'Service registered successfully',
      serviceId: result.serviceId
    });
  } catch (error) {
    // Update failed registration metrics
    metricsService.incrementFailedRegistrations();

    logger.error('Service registration failed', {
      error: error.message,
      body: req.body
    });

    next(error);
  }
});

/**
 * POST /register/:serviceId/migration
 * Upload migration file for a registered service (Stage 2)
 */
router.post('/:serviceId/migration', sanitizeInput, async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { migrationFile } = req.body;

    if (!migrationFile) {
      return res.status(400).json({
        success: false,
        message: 'Migration file is required'
      });
    }

    // Complete the service registration with migration file
    const result = await registryService.completeMigration(serviceId, migrationFile);

    logger.info('Migration file uploaded successfully', {
      serviceId,
      serviceName: result.serviceName
    });

    res.status(200).json({
      success: true,
      message: 'Migration file uploaded successfully',
      serviceId: serviceId,
      status: 'active'
    });
  } catch (error) {
    logger.error('Migration upload failed', {
      error: error.message,
      serviceId: req.params.serviceId
    });

    next(error);
  }
});

/**
 * DELETE /register/services
 * Delete all services (FOR TESTING ONLY)
 */
router.delete('/services', async (req, res) => {
  try {
    // Get all services
    const allServices = await registryService.getAllServicesFull();
    
    // Delete each one
    let deleted = 0;
    for (const service of allServices) {
      try {
        const success = await registryService.deleteService(service.id || service.serviceId);
        if (success) deleted++;
      } catch (error) {
        logger.warn('Failed to delete service', {
          serviceId: service.id || service.serviceId,
          serviceName: service.serviceName,
          error: error.message
        });
      }
    }
    
    logger.info('Deleted all services', { count: deleted });
    
    res.json({ 
      success: true, 
      deleted,
      message: `Deleted ${deleted} services` 
    });
  } catch (error) {
    logger.error('Failed to delete all services', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

