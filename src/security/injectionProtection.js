/**
 * Injection Protection Utilities
 * 
 * Provides protection against SQL injection and prompt injection attacks.
 * Uses specialized libraries for dynamic detection instead of static patterns.
 * 
 * SQL Injection Protection:
 * - Uses `is-sql-injection` library for detection
 * - Uses `perfect-express-sanitizer` for comprehensive sanitization
 * - Should be used in conjunction with parameterized queries
 * 
 * Prompt Injection Protection:
 * - Uses pattern-based detection with comprehensive patterns
 * - Sanitizes input for LLM interactions
 * - Truncates overly long inputs
 */

const isSQLInjection = require('is-sql-injection');
const { sanitize: sanitizeLib } = require('perfect-express-sanitizer');
const { security } = require('../logger');

/**
 * Enhanced prompt injection patterns
 * These patterns attempt to override system instructions or manipulate LLM behavior
 */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions?/i,
  /forget\s+(all\s+)?(previous|prior)\s+instructions?/i,
  /disregard\s+(all\s+)?(previous|prior)\s+instructions?/i,
  /you\s+are\s+now/i,
  /system\s*:\s*you\s+are/i,
  /new\s+instructions?\s*:/i,
  /override\s+(system|previous)/i,
  /act\s+as\s+if/i,
  /pretend\s+to\s+be/i,
  /roleplay\s+as/i,
  /jailbreak/i,
  /bypass\s+(safety|security|filter)/i,
  /ignore\s+(the\s+)?(above|previous|prior)/i,
  /forget\s+(everything|all)/i,
  /you\s+must\s+(not|never)/i,
  /reveal\s+(system|internal|secret)/i,
  /show\s+(me\s+)?(the\s+)?(prompt|instruction|system)/i,
];

/**
 * Check if input contains SQL injection using library
 * @param {string} input - Input string to check
 * @returns {boolean} True if SQL injection detected
 */
function detectSQLInjection(input) {
  if (typeof input !== 'string') {
    return false;
  }

  try {
    // Use is-sql-injection library for detection
    return isSQLInjection(input);
  } catch (error) {
    // If library fails, log and return false (fail open, but log for monitoring)
    console.error('SQL injection detection library error:', error);
    return false;
  }
}

/**
 * Check if input contains prompt injection patterns
 * @param {string} input - Input string to check
 * @returns {boolean} True if suspicious patterns detected
 */
function detectPromptInjection(input) {
  if (typeof input !== 'string') {
    return false;
  }

  return PROMPT_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize string input using perfect-express-sanitizer library
 * This provides comprehensive sanitization for SQL injection, XSS, and NoSQL injection
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove null bytes first (security critical)
  let sanitized = input.replace(/\0/g, '');

  // Use perfect-express-sanitizer for comprehensive sanitization
  try {
    // perfect-express-sanitizer's prepareSanitize function sanitizes the input
    const sanitizedObj = sanitizeLib.prepareSanitize(sanitized, {
      sql: true,        // SQL injection protection
      xss: true,        // XSS protection
      noSql: true,      // NoSQL injection protection
      sqlLevel: 5,      // Maximum SQL protection level
      xssLevel: 5,      // Maximum XSS protection level
      noSqlLevel: 5,    // Maximum NoSQL protection level
    });
    
    // prepareSanitize returns the sanitized value (string or object)
    sanitized = typeof sanitizedObj === 'string' ? sanitizedObj : JSON.stringify(sanitizedObj);
    
    // Ensure null bytes are still removed after library sanitization
    sanitized = sanitized.replace(/\0/g, '');

    // Truncate if too long (prevent DoS)
    const MAX_LENGTH = 10000;
    if (sanitized.length > MAX_LENGTH) {
      sanitized = sanitized.substring(0, MAX_LENGTH);
    }

    return sanitized;
  } catch (error) {
    // If sanitization fails, fall back to basic sanitization
    console.error('Sanitization library error:', error);
    // Null bytes already removed above
    const MAX_LENGTH = 10000;
    if (sanitized.length > MAX_LENGTH) {
      sanitized = sanitized.substring(0, MAX_LENGTH);
    }
    return sanitized;
  }
}

/**
 * Sanitize object recursively, checking all string values
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Middleware to check for SQL injection in request body using library
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function sqlInjectionProtection(req, res, next) {
  // Check request body
  if (req.body && typeof req.body === 'object') {
    // Check each value in the body
    const checkObject = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string') {
          if (detectSQLInjection(value)) {
            security({ req, reason: 'sql_injection_attempt', field: currentPath, input: value.substring(0, 200) }, 
              `SQL injection attempt detected in request body field: ${currentPath}`);
            return res.status(400).json({
              error: 'Bad Request',
              message: 'Invalid input detected. SQL injection attempts are not allowed.',
            });
          }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const result = checkObject(value, currentPath);
          if (result) return result; // If error response was sent, propagate it
        } else if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            if (typeof value[i] === 'string' && detectSQLInjection(value[i])) {
              security({ req, reason: 'sql_injection_attempt', field: `${currentPath}[${i}]`, input: value[i].substring(0, 200) }, 
                `SQL injection attempt detected in request body array: ${currentPath}[${i}]`);
              return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid input detected. SQL injection attempts are not allowed.',
              });
            } else if (typeof value[i] === 'object' && value[i] !== null) {
              const result = checkObject(value[i], `${currentPath}[${i}]`);
              if (result) return result;
            }
          }
        }
      }
      return null;
    };

    const error = checkObject(req.body);
    if (error) return; // Error response already sent
  }

  // Check query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string' && detectSQLInjection(value)) {
        security({ req, reason: 'sql_injection_attempt', parameter: key, input: value.substring(0, 200) }, 
          `SQL injection attempt detected in query parameter: ${key}`);
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid input detected. SQL injection attempts are not allowed.',
        });
      }
    }
  }

  next();
}

/**
 * Sanitize request body to prevent prompt injection
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function promptInjectionProtection(req, res, next) {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  next();
}

/**
 * Check for prompt injection patterns in request body
 * Returns error if detected (more strict than sanitization)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function promptInjectionDetection(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    const bodyString = JSON.stringify(req.body);
    if (detectPromptInjection(bodyString)) {
      // Log security event
      security({ req, reason: 'prompt_injection_attempt', input: bodyString.substring(0, 200) }, 
        'Prompt injection attempt detected in request body');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid input detected. Prompt injection attempts are not allowed.',
      });
    }
  }

  next();
}

module.exports = {
  detectSQLInjection,
  detectPromptInjection,
  sanitizeInput,
  sanitizeObject,
  sqlInjectionProtection,
  promptInjectionProtection,
  promptInjectionDetection,
};

