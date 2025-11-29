/**
 * Secure Error Handling Utilities
 * 
 * Best Practice: Avoid leaking error/token details to clients
 * - Sanitize error messages to remove sensitive information
 * - Log full errors server-side only
 * - Never expose tokens, credentials, or internal paths
 */

import { Request, Response, NextFunction } from 'express';

interface SanitizedError {
  error: string;
  statusCode?: number;
}

/**
 * Sanitizes error messages to prevent leaking sensitive information
 * Removes: tokens, credentials, file paths, internal details
 */
export function sanitizeError(error: any, context?: string): SanitizedError {
  const errorMessage = error?.message || String(error) || 'An unknown error occurred';
  
  // List of sensitive patterns to remove from error messages
  const sensitivePatterns = [
    // OAuth tokens
    /ya29\.[a-zA-Z0-9_-]+/g,  // Google access tokens
    /1\/\/[a-zA-Z0-9_-]+/g,   // Refresh tokens
    /access_token["\s:=]+[^"}\s]+/gi,
    /refresh_token["\s:=]+[^"}\s]+/gi,
    /token["\s:=]+[^"}\s]+/gi,
    // File paths
    /[A-Z]:\\[^:]+/g,  // Windows paths
    /\/[^\s:]+/g,      // Unix paths
    // Credentials
    /client_secret["\s:=]+[^"}\s]+/gi,
    /api[_-]?key["\s:=]+[^"}\s]+/gi,
  ];

  let sanitized = errorMessage;
  
  // Remove sensitive patterns
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  // Common error mappings for better user experience
  if (sanitized.includes('No token found') || sanitized.includes('Token expired')) {
    return {
      error: 'Authentication required. Please visit /auth/url to authenticate.',
      statusCode: 401,
    };
  }

  if (sanitized.includes('refresh failed') || sanitized.includes('refresh token')) {
    return {
      error: 'Authentication expired. Please re-authenticate via /auth/url',
      statusCode: 401,
    };
  }

  if (sanitized.includes('ENOENT') || sanitized.includes('file')) {
    return {
      error: 'Configuration error. Please check server configuration.',
      statusCode: 500,
    };
  }

  // Determine status code from error
  let statusCode = 500;
  if (error?.response?.status) {
    statusCode = error.response.status;
  } else if (error?.statusCode) {
    statusCode = error.statusCode;
  } else if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
    statusCode = 503; // Service unavailable
  }

  return {
    error: sanitized,
    statusCode,
  };
}

/**
 * Logs full error details server-side (for debugging)
 * but returns sanitized error to client
 */
export function handleError(error: any, context: string, res: Response): void {
  // Log full error server-side (includes sensitive info for debugging)
  console.error(`[${context}] Error:`, {
    message: error?.message,
    stack: error?.stack,
    response: error?.response?.data,
    status: error?.response?.status,
  });

  // Sanitize and send safe error to client
  const sanitized = sanitizeError(error, context);
  res.status(sanitized.statusCode || 500).json({ 
    error: sanitized.error 
  });
}

/**
 * Wraps async route handlers with error handling
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      const sanitized = sanitizeError(error, `${req.method} ${req.path}`);
      res.status(sanitized.statusCode || 500).json({ error: sanitized.error });
    });
  };
}

