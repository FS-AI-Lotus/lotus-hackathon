/**
 * Centralized Logger Module
 * 
 * Provides structured JSON logging using Winston.
 * Supports standard log levels (info, warn, error) and custom levels (security, audit).
 * 
 * Log Format:
 * - timestamp: ISO 8601 timestamp
 * - level: Log level (info, warn, error, security, audit)
 * - service: Service name (e.g., "coordinator")
 * - route: HTTP route (if available)
 * - correlationId: Request correlation ID (if available)
 * - serviceId: Service ID from JWT (if available)
 * - message: Log message
 * - Additional metadata fields
 */

const winston = require('winston');

// Define custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    security: 3, // Custom level for security events
    audit: 4,    // Custom level for audit events
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    security: 'magenta',
    audit: 'cyan',
  },
};

// Add colors to winston
winston.addColors(customLevels.colors);

// Create Winston logger with custom format
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format((info) => {
      // Add default fields
      info.service = info.service || 'coordinator';
      info.timestamp = info.timestamp || new Date().toISOString();
      
      // Remove sensitive information
      if (info.password) delete info.password;
      if (info.token) delete info.token;
      if (info.authorization) delete info.authorization;
      if (info.privateKey) delete info.privateKey;
      
      return info;
    })()
  ),
  defaultMeta: {
    service: 'coordinator',
  },
  transports: [
    // Console output (for development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? ` ${JSON.stringify(meta)}`
            : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

/**
 * Get request context from Express request object
 * @param {Object} req - Express request object
 * @returns {Object} Context object with correlationId, serviceId, route
 */
function getRequestContext(req) {
  if (!req) return {};

  return {
    correlationId: req.correlationId,
    serviceId: req.serviceContext?.serviceId,
    route: req.route?.path || req.path,
    method: req.method,
    ip: req.ip || req.connection?.remoteAddress,
  };
}

/**
 * Log info message
 * @param {Object} meta - Metadata object (can include req for context)
 * @param {string} message - Log message
 */
function info(meta = {}, message) {
  const context = meta.req ? getRequestContext(meta.req) : {};
  const { req, ...restMeta } = meta;
  
  logger.info(message, {
    ...context,
    ...restMeta,
  });
}

/**
 * Log warning message
 * @param {Object} meta - Metadata object (can include req for context)
 * @param {string} message - Log message
 */
function warn(meta = {}, message) {
  const context = meta.req ? getRequestContext(meta.req) : {};
  const { req, ...restMeta } = meta;
  
  logger.warn(message, {
    ...context,
    ...restMeta,
  });
}

/**
 * Log error message
 * @param {Object} meta - Metadata object (can include req for context, error object)
 * @param {string} message - Log message
 */
function error(meta = {}, message) {
  const context = meta.req ? getRequestContext(meta.req) : {};
  const { req, error: err, ...restMeta } = meta;
  
  const errorMeta = err ? {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  } : {};
  
  logger.error(message, {
    ...context,
    ...errorMeta,
    ...restMeta,
  });
}

/**
 * Log security event (auth failures, attacks, etc.)
 * @param {Object} meta - Metadata object (can include req for context)
 * @param {string} message - Log message
 */
function security(meta = {}, message) {
  const context = meta.req ? getRequestContext(meta.req) : {};
  const { req, ...restMeta } = meta;
  
  logger.log('security', message, {
    ...context,
    ...restMeta,
  });
}

/**
 * Log audit event (important business/security actions)
 * @param {Object} meta - Metadata object (can include req for context)
 * @param {string} message - Log message
 */
function audit(meta = {}, message) {
  const context = meta.req ? getRequestContext(meta.req) : {};
  const { req, ...restMeta } = meta;
  
  logger.log('audit', message, {
    ...context,
    ...restMeta,
  });
}

module.exports = {
  info,
  warn,
  error,
  security,
  audit,
  logger, // Export raw logger for advanced use cases
};

