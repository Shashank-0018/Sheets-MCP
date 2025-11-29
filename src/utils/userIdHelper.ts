/**
 * Helper utilities for extracting and passing userId
 */

import { Request } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Extract userId from request (from header or authenticated request)
 */
export function getUserIdFromRequest(req: Request): string {
  // Try to get from authenticated request first
  const authReq = req as AuthenticatedRequest;
  if (authReq.userId) {
    // console.log('DEBUG: Found userId in AuthenticatedRequest:', authReq.userId);
    return authReq.userId;
  }

  // Fall back to header (for Google Sheets API server)
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    // console.log('DEBUG: Found userId in X-User-Id header:', userId);
  } else {
    console.log('DEBUG: No userId found in request. Headers:', JSON.stringify(req.headers));
  }
  return userId;
}

/**
 * Create headers with userId for forwarding to Google Sheets API server
 */
export function createHeadersWithUserId(req: Request): Record<string, string> {
  const userId = getUserIdFromRequest(req);
  console.log('DEBUG: Creating headers with userId:', userId);
  return {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
  };
}

