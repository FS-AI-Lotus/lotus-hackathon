/**
 * Validation Helpers
 * 
 * Provides helper functions to validate request payloads using Zod schemas.
 * These functions can be used in route handlers or middleware.
 * 
 * Functions:
 * - validateRegisterService: Validates service registration payload
 * - validateRouteRequest: Validates routing request payload
 */

const { registerServiceSchema, routeRequestSchema } = require('./schemas');
const { ZodError } = require('zod');

/**
 * Format Zod validation error into user-friendly message
 * @param {ZodError} error - Zod validation error
 * @returns {string} Formatted error message
 */
function formatValidationError(error) {
  if (!(error instanceof ZodError)) {
    return error.message || 'Validation failed';
  }

  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });

  return issues.join('; ');
}

/**
 * Validate service registration payload
 * @param {Object} payload - Registration payload
 * @returns {Object} Validated and parsed payload
 * @throws {Error} If validation fails
 */
function validateRegisterService(payload) {
  try {
    return registerServiceSchema.parse(payload);
  } catch (error) {
    const message = formatValidationError(error);
    const validationError = new Error(`Invalid registration payload: ${message}`);
    validationError.name = 'ValidationError';
    validationError.details = error.issues;
    throw validationError;
  }
}

/**
 * Validate routing request payload
 * @param {Object} payload - Routing payload
 * @returns {Object} Validated and parsed payload
 * @throws {Error} If validation fails
 */
function validateRouteRequest(payload) {
  try {
    return routeRequestSchema.parse(payload);
  } catch (error) {
    const message = formatValidationError(error);
    const validationError = new Error(`Invalid routing payload: ${message}`);
    validationError.name = 'ValidationError';
    validationError.details = error.issues;
    throw validationError;
  }
}

module.exports = {
  validateRegisterService,
  validateRouteRequest,
  formatValidationError,
};

