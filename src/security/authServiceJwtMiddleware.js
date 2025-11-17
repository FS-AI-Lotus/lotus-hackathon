/**
 * JWT Authentication Middleware
 * 
 * Express middleware for verifying asymmetric JWT tokens (RS256/ES256) for service-to-service authentication.
 * 
 * Requirements:
 * - Token must be in Authorization header: "Bearer <token>"
 * - Token must be signed with RS256 or ES256 algorithm
 * - Token must have valid issuer (iss) claim
 * - Token must have subject (sub) or service_id claim
 * - Token must not be expired
 * 
 * On success: Attaches decoded claims to req.serviceContext and calls next()
 * On failure: Returns 401 Unauthorized or 403 Forbidden
 */

const jwt = require('jsonwebtoken');
const { config } = require('../config');

/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT token from Authorization header and attaches service context to request.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function authServiceJwtMiddleware(req, res, next) {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing Authorization header',
    });
  }

  // Extract token from "Bearer <token>" format
  const parts = authHeader.split(' ');
  
  // Check for missing token (only "Bearer" without token)
  if (parts.length === 1 && parts[0] === 'Bearer') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing token in Authorization header',
    });
  }
  
  // Check for invalid format
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid Authorization header format. Expected: "Bearer <token>"',
    });
  }

  const token = parts[1];

  // Check for missing token (empty string after split)
  if (!token || token.trim() === '') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing token in Authorization header',
    });
  }

  // Get configuration
  const jwtConfig = config().jwt;

  if (!jwtConfig.publicKey) {
    // This should not happen if config validation is working
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'JWT public key not configured',
    });
  }

  // Verify token
  try {
    const verifyOptions = {
      algorithms: ['RS256', 'ES256'], // Only allow asymmetric algorithms
    };

    // Add issuer validation if configured
    if (jwtConfig.issuer) {
      verifyOptions.issuer = jwtConfig.issuer;
    }

    // Add audience validation if configured
    if (jwtConfig.audience) {
      verifyOptions.audience = jwtConfig.audience;
    }

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.publicKey, verifyOptions);

    // Validate required claims
    if (!decoded.sub && !decoded.service_id) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token missing required claim: sub or service_id',
      });
    }

    // Attach service context to request
    req.serviceContext = {
      serviceId: decoded.sub || decoded.service_id,
      claims: decoded,
      // Extract optional fields
      role: decoded.role,
      scope: decoded.scope,
      issuer: decoded.iss,
      audience: decoded.aud,
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : null,
    };

    // Call next middleware
    next();
  } catch (error) {
    // Handle issuer/audience validation errors first (these are also JsonWebTokenError)
    // jwt.verify throws JsonWebTokenError for issuer/audience mismatches
    // Error messages: "jwt issuer invalid. expected: X" or "jwt audience invalid. expected: X"
    if (error.name === 'JsonWebTokenError' && error.message && (
      error.message.includes('jwt issuer') ||
      error.message.includes('jwt audience')
    )) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Token validation failed',
        details: error.message,
      });
    }

    // Handle other JWT verification errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
        details: error.message,
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired',
        details: error.message,
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token not yet valid',
        details: error.message,
      });
    }

    // Unknown error
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token verification failed',
      details: error.message,
    });
  }
}

module.exports = authServiceJwtMiddleware;

