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

module.exports = router;

