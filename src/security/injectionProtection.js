/**
 * Injection Protection Utilities
 * 
 * Provides protection against SQL injection and prompt injection attacks.
 * 
 * SQL Injection Protection:
 * - Validates input patterns to detect suspicious SQL patterns
 * - Should be used in conjunction with parameterized queries
 * 
 * Prompt Injection Protection:
 * - Sanitizes input for LLM interactions
 * - Filters common injection patterns
 * - Truncates overly long inputs
 */

const { security } = require('../logger');

/**
 * Common SQL injection patterns to detect
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
  /(--|#|\/\*|\*\/|;)/, // SQL comments and statement separators
  /(\bOR\b.*=.*|AND.*=.*)/i, // Boolean logic injection
  /('|"|`).*(OR|AND).*=.*\1/i, // Quote-based injection
  /(\bUNION\b.*\bSELECT\b)/i, // Union-based injection
  /(\bEXEC\b|\bEXECUTE\b)/i, // Command execution
];

/**
 * Common prompt injection patterns to detect
 * These are patterns that attempt to override system instructions
 * Based on OWASP LLM Top 10 and industry best practices
 */
const PROMPT_INJECTION_PATTERNS = [
  // Instruction override patterns
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
  
  // Jailbreak patterns
  /jailbreak/i,
  /developer\s+mode/i,
  /god\s+mode/i,
  /unrestricted\s+mode/i,
  /bypass\s+(safety|security|filter)/i,
  
  // Context manipulation
  /\[system\]/i,
  /\[instruction\]/i,
  /\[prompt\]/i,
  /<\|system\|>/i,
  /<\|user\|>/i,
  /<\|assistant\|>/i,
  
  // Encoding/obfuscation attempts
  /base64|hex|unicode|rot13/i,
  
  // Social engineering
  /this\s+is\s+(important|urgent|critical)/i,
  /you\s+must|you\s+should|you\s+need\s+to/i,
  /as\s+a\s+(friend|colleague|developer)/i,
  
  // Direct manipulation
  /print\s+(all|everything|the\s+system)/i,
  /reveal|expose|show\s+(me\s+)?(the\s+)?(system|prompt|instruction)/i,
  /what\s+(are|were)\s+(your|the)\s+(original|initial|system)\s+instructions?/i,
];

/**
 * Check if input contains SQL injection patterns
 * @param {string} input - Input string to check
 * @returns {boolean} True if suspicious patterns detected
 */
function detectSQLInjection(input) {
  if (typeof input !== 'string') {
    return false;
  }

  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
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
 * Sanitize string input by removing or escaping dangerous characters
 * Note: This is a basic sanitization. For production, use proper escaping
 * based on your database/LLM requirements.
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Truncate if too long (prevent DoS)
  const MAX_LENGTH = 10000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
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
 * Middleware to check for SQL injection in request body
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function sqlInjectionProtection(req, res, next) {
  // Check request body
  if (req.body && typeof req.body === 'object') {
    const bodyString = JSON.stringify(req.body);
    if (detectSQLInjection(bodyString)) {
      // Log security event
      security({ req, reason: 'sql_injection_attempt', input: bodyString.substring(0, 200) }, 
        'SQL injection attempt detected in request body');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid input detected. SQL injection attempts are not allowed.',
      });
    }
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

