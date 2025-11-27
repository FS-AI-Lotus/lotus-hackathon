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
  // No route-level timeout needed:
  // - Supabase operations have their own timeout (15s) with in-memory fallback
  // - Express server has server-level timeout (30s) configured in index.js
  // - Removing route timeout allows Supabase fallback to work properly
  
  try {
    const { serviceName, version, endpoint, healthCheck, migrationFile, description, metadata } = req.body;

    logger.info('Registration request received', {
      serviceName,
      version,
      endpoint,
      timestamp: new Date().toISOString()
    });

    // Register the service
    // Supabase has its own timeout (15s) and falls back to in-memory if slow
    logger.info('Calling registryService.registerService', {
      serviceName,
      timestamp: new Date().toISOString()
    });
    
    const result = await registryService.registerService({
      serviceName,
      version,
      endpoint,
      healthCheck,
      migrationFile,
      description,
      metadata
    });

    // Update metrics
    try {
      metricsService.incrementRegistrations();
      const totalServices = await registryService.getTotalServices();
      metricsService.updateRegisteredServices(totalServices);
    } catch (metricsError) {
      // Don't fail registration if metrics fail
      logger.warn('Failed to update metrics', { error: metricsError.message });
    }

    logger.info('Service registration successful', {
      serviceId: result.serviceId,
      serviceName
    });

    // Ensure response is sent
    if (!res.headersSent) {
      res.status(201).json({
        success: true,
        message: 'Service registered successfully',
        serviceId: result.serviceId
      });
    }
  } catch (error) {
    // Update failed registration metrics
    try {
      metricsService.incrementFailedRegistrations();
    } catch (metricsError) {
      logger.warn('Failed to update failed metrics', { error: metricsError.message });
    }

    logger.error('Service registration failed', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Ensure error response is sent - don't use next() which might hang
    if (!res.headersSent) {
      const statusCode = error.status || 500;
      const message = process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal server error'
        : error.message;
      
      res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
      });
    } else {
      logger.error('Response already sent, cannot send error response');
    }
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
 * Delete all services
 */
router.delete('/services', async (req, res, next) => {
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
    next(error);
  }
});

module.exports = router;

