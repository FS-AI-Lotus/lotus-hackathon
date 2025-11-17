/**
 * Validation Schemas
 * 
 * Defines validation schemas for Coordinator service endpoints using Zod.
 * These schemas validate request payloads before processing.
 * 
 * Schemas:
 * - registerServiceSchema: Validates /register endpoint payload
 * - routeRequestSchema: Validates /route endpoint payload
 */

const { z } = require('zod');

/**
 * URL validation regex (supports http://, https://, and localhost)
 */
const urlRegex = /^https?:\/\/.+/;

/**
 * Schema for service registration (/register endpoint)
 * 
 * Required fields:
 * - name: Service name (string, min 1 char, max 100 chars)
 * - url: Service URL (must be valid HTTP/HTTPS URL)
 * 
 * Optional fields:
 * - schema: JSON schema object (optional, validated if provided)
 */
const registerServiceSchema = z.object({
  name: z
    .string({
      required_error: 'Service name is required',
      invalid_type_error: 'Service name must be a string',
    })
    .min(1, 'Service name must be at least 1 character')
    .max(100, 'Service name must be at most 100 characters')
    .trim(),
  
  url: z
    .string({
      required_error: 'Service URL is required',
      invalid_type_error: 'Service URL must be a string',
    })
    .url('Service URL must be a valid URL')
    .refine(
      (url) => urlRegex.test(url),
      {
        message: 'Service URL must start with http:// or https://',
      }
    ),
  
  schema: z
    .object({}, { invalid_type_error: 'Schema must be an object' })
    .passthrough() // Allow additional properties
    .optional(),
});

/**
 * Schema for routing requests (/route endpoint)
 * 
 * Required fields:
 * - origin: Origin identifier (string, min 1 char)
 * - destination: Destination service ID or name (string, min 1 char)
 * - data: Routing payload (object, can be empty)
 * 
 * Optional fields:
 * - metadata: Additional metadata object (optional)
 */
const routeRequestSchema = z.object({
  origin: z
    .string({
      required_error: 'Origin is required',
      invalid_type_error: 'Origin must be a string',
    })
    .min(1, 'Origin must be at least 1 character')
    .max(200, 'Origin must be at most 200 characters')
    .trim(),
  
  destination: z
    .string({
      required_error: 'Destination is required',
      invalid_type_error: 'Destination must be a string',
    })
    .min(1, 'Destination must be at least 1 character')
    .max(200, 'Destination must be at most 200 characters')
    .trim(),
  
  data: z
    .object({}, { invalid_type_error: 'Data must be an object' })
    .passthrough() // Allow any properties
    .default({}), // Default to empty object if not provided
  
  metadata: z
    .object({}, { invalid_type_error: 'Metadata must be an object' })
    .passthrough()
    .optional(),
});

module.exports = {
  registerServiceSchema,
  routeRequestSchema,
};

