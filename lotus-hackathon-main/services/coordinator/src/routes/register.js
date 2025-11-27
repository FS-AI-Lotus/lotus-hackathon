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
  // Set response timeout (proper implementation)
  // Increased from 20s to 30s to handle slow Supabase connections
  const registrationTimeout = parseInt(process.env.REGISTRATION_TIMEOUT) || 30000; // 30 seconds default
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      logger.error('Request timeout in register route');
      res.status(504).json({
        success: false,
        message: 'Registration request timed out. This may be due to slow Supabase connection.',
        hint: 'Check Supabase connection or try again. Service may still be registered in memory.'
      });
    }
  }, registrationTimeout);

  // Clear timeout when response finishes
  res.on('finish', () => clearTimeout(timeout));
  res.on('close', () => clearTimeout(timeout));

  try {
    const { serviceName, version, endpoint, healthCheck, migrationFile, description, metadata } = req.body;

    logger.info('Registration request received', {
      serviceName,
      version,
      endpoint,
      timestamp: new Date().toISOString()
    });

    // Attempt to register the service with timeout protection
    logger.info('Calling registryService.registerService', {
      serviceName,
      timestamp: new Date().toISOString()
    });
    
    const registrationPromise = registryService.registerService({
      serviceName,
      version,
      endpoint,
      healthCheck,
      migrationFile,
      description,
      metadata
    });
    
    // Add overall timeout for the entire registration process
    const result = await Promise.race([
      registrationPromise,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Registration process timed out after 30 seconds. Supabase connection may be slow.'));
        }, registrationTimeout);
      })
    ]);
    
    // Clear timeout on success
    clearTimeout(timeout);

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
      clearTimeout(timeout);
      res.status(201).json({
        success: true,
        message: 'Service registered successfully',
        serviceId: result.serviceId
      });
    }
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeout);
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

