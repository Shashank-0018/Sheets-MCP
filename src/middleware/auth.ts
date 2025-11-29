import { Request, Response, NextFunction } from 'express';
import { tokenStorage } from '../services/tokenStorage';
import { isSupabaseConfigured, hashMcpToken } from '../services/supabase';

/**
 * Extended Request interface with user_id
 */
export interface AuthenticatedRequest extends Request {
  userId?: string;
  mcpToken?: string;
}

/**
 * MCP Bearer Token Authentication Middleware
 * 
 * Enforces Bearer token authentication for MCP API requests.
 * Maps MCP token to user_id for multi-user token isolation.
 * 
 * Best Practice: Never expose raw Google OAuth tokens to clients.
 * This MCP token is separate from Google OAuth tokens.
 */
export async function mcpAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Extract Bearer token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized. Missing or invalid Authorization header.',
      hint: 'Include Authorization: Bearer <token> header'
    });
    return;
  }

  const providedToken = authHeader.substring(7); // Remove 'Bearer ' prefix

  // For backward compatibility: check single MCP_TOKEN if Supabase not configured
  const expectedToken = process.env.MCP_TOKEN;
  if (!tokenStorage || !isSupabaseConfigured()) {
    // Single-user mode: use simple token comparison
    if (!expectedToken) {
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          error: 'MCP authentication not configured. Set MCP_TOKEN environment variable.'
        });
        return;
      }
      // Development mode: allow requests without token
      console.warn('⚠️  MCP_TOKEN not set - allowing unauthenticated requests (development mode)');
      // Note: We do NOT set default_user here anymore to enforce strict auth
      next();
      return;
    }

    // Secure token comparison (constant-time comparison to prevent timing attacks)
    if (!secureTokenCompare(providedToken, expectedToken)) {
      res.status(403).json({
        error: 'Forbidden. Invalid MCP token.'
      });
      return;
    }

    // Single-user mode
    // Note: We do NOT set default_user here anymore to enforce strict auth
    (req as AuthenticatedRequest).mcpToken = providedToken;
    next();
    return;
  }

  // Multi-user mode: Map MCP token to user_id
  // Users are automatically created when they complete OAuth (using their email)
  try {
    const userId = await tokenStorage.getUserIdFromMcpToken(providedToken);

    if (!userId) {
      res.status(403).json({
        error: 'Forbidden. Invalid MCP token or user not found.',
        hint: 'Please complete OAuth authentication first. Visit /auth/url to get the OAuth URL. Your user account will be created automatically from your Google email.'
      });
      return;
    }

    // Attach user_id to request for token isolation
    (req as AuthenticatedRequest).userId = userId;
    (req as AuthenticatedRequest).mcpToken = providedToken;
    next();
  } catch (error: any) {
    console.error('Error in MCP auth middleware:', error);
    res.status(500).json({
      error: 'Internal authentication error.'
    });
  }
}

/**
 * Constant-time token comparison to prevent timing attacks
 */
function secureTokenCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
