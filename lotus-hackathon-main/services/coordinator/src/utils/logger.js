const winston = require('winston');
const path = require('path');

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'coordinator' },
  transports: [
    // Single console transport with appropriate format based on environment
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        // Use JSON format in production, pretty format in development
        process.env.NODE_ENV === 'production'
          ? winston.format.json() // JSON format for production (better for log aggregation)
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
                const serviceTag = service ? `[${service}]` : '';
                const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                return `${timestamp} ${serviceTag} [${level}]: ${message}${metaStr}`;
              })
            )
      )
    })
  ]
});

module.exports = logger;


