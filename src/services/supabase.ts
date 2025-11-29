/**
 * Supabase Client Service
 * 
 * Provides database access for multi-user token storage with strong isolation.
 * Each user's tokens are stored separately and cannot access other users' tokens.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// Supabase configuration from environment variables
// Support both DATABASE_URL (PostgreSQL connection string) and individual config
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key for admin operations
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY; // Anon key for client operations

// Extract Supabase URL and key from DATABASE_URL if provided
// Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
let resolvedSupabaseUrl = SUPABASE_URL;
let resolvedServiceRoleKey = SUPABASE_SERVICE_ROLE_KEY;

if (DATABASE_URL && !SUPABASE_URL) {
  try {
    // Extract project reference from DATABASE_URL
    // Format: db.[project-ref].supabase.co
    const urlMatch = DATABASE_URL.match(/@db\.([^.]+)\.supabase\.co/);
    if (urlMatch) {
      const projectRef = urlMatch[1];
      resolvedSupabaseUrl = `https://${projectRef}.supabase.co`;
    }
  } catch (err) {
    console.warn('⚠️  Could not extract Supabase URL from DATABASE_URL');
  }
}

if (!resolvedSupabaseUrl || !resolvedServiceRoleKey) {
  console.warn('⚠️  Supabase not fully configured.');
  if (!resolvedSupabaseUrl) {
    console.warn('   Set SUPABASE_URL or provide DATABASE_URL environment variable.');
  }
  if (!resolvedServiceRoleKey) {
    console.warn('   Set SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }
  console.warn('   Multi-user token storage will not be available. Falling back to single-user mode.');
}

// Create Supabase client with service role key (for server-side operations)
// Service role key bypasses RLS - we handle isolation at application level
export const supabase: SupabaseClient | null = resolvedSupabaseUrl && resolvedServiceRoleKey
  ? createClient(resolvedSupabaseUrl, resolvedServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  : null;

/**
 * Hash MCP token for secure storage
 * Uses SHA-256 for one-way hashing
 */
export function hashMcpToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Database Types
 */
export interface McpUser {
  id: string;
  user_id: string;
  mcp_token_hash: string | null;
  email?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface GoogleOAuthToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token?: string;
  token_type: string;
  scope?: string;
  expiry_date?: number;
  refresh_token_expires_in?: number;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
  is_revoked: boolean;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return supabase !== null && resolvedSupabaseUrl !== undefined && resolvedServiceRoleKey !== undefined;
}

/**
 * Get resolved Supabase URL (for logging/debugging)
 */
export function getSupabaseUrl(): string | undefined {
  return resolvedSupabaseUrl;
}

