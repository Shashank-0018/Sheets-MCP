/**
 * Multi-User Token Storage Service
 * 
 * Provides secure, isolated token storage for multiple users.
 * Each user's tokens are stored separately with strong isolation.
 * 
 * Best Practice: Strong isolation - users cannot access each other's tokens
 */

import { supabase, hashMcpToken, isSupabaseConfigured, GoogleOAuthToken } from './supabase';
import * as crypto from 'crypto';

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
  refresh_token_expires_in?: number;
}

/**
 * Multi-User Token Storage with Strong Isolation
 * 
 * Features:
 * - Per-user token storage (strong isolation)
 * - Token revocation support
 * - Automatic token refresh tracking
 * - Fallback to single-user mode if Supabase not configured
 */
export class MultiUserTokenStorage {
  private singleUserCache: Map<string, TokenData> = new Map();
  private readonly SINGLE_USER_KEY = 'default_user';

  /**
   * Get user_id from MCP token
   * Maps MCP token to user_id for token isolation
   */
  async getUserIdFromMcpToken(mcpToken: string): Promise<string | null> {
    if (!isSupabaseConfigured()) {
      // Single-user mode: return default user
      return this.SINGLE_USER_KEY;
    }

    try {
      const tokenHash = hashMcpToken(mcpToken);
      const { data, error } = await supabase!
        .from('mcp_users')
        .select('user_id')
        .eq('mcp_token_hash', tokenHash)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.warn(`⚠️  User not found for MCP token. Error: ${error?.message}`);
        return null;
      }

      return data.user_id;
    } catch (error: any) {
      console.error('Error getting user_id from MCP token:', error);
      return null;
    }
  }

  /**
   * Create or update user mapping (MCP token → user_id)
   * This establishes the user identity for token isolation
   */
  async createOrUpdateUser(
    mcpToken: string,
    userId: string,
    email?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      // Single-user mode: no-op
      return true;
    }

    try {
      const tokenHash = hashMcpToken(mcpToken);
      
      // First, check if user exists without MCP token (created during OAuth)
      const { data: existingUser } = await supabase!
        .from('mcp_users')
        .select('user_id, mcp_token_hash')
        .eq('user_id', userId)
        .single();

      // If user exists with empty mcp_token_hash, update it
      // Otherwise, create new or update existing
      const { error } = await supabase!
        .from('mcp_users')
        .upsert({
          user_id: userId,
          mcp_token_hash: tokenHash,
          email: email || userId, // Use userId as email if not provided
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error creating/updating user:', error);
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Error in createOrUpdateUser:', error);
      return false;
    }
  }

  /**
   * Load token for a specific user
   * Strong isolation: Only returns tokens for the specified user_id
   */
  async loadToken(userId: string): Promise<TokenData | null> {
    if (!isSupabaseConfigured()) {
      // Single-user mode: use in-memory cache
      return this.singleUserCache.get(this.SINGLE_USER_KEY) || null;
    }

    try {
      const { data, error } = await supabase!
        .from('google_oauth_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_revoked', false)
        .single();

      if (error || !data) {
        // Token not found for this user
        return null;
      }

      // Convert database format to TokenData
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        scope: data.scope,
        token_type: data.token_type,
        expiry_date: data.expiry_date,
        refresh_token_expires_in: data.refresh_token_expires_in,
      };
    } catch (error: any) {
      console.error(`Error loading token for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Store token for a specific user
   * Strong isolation: Token is stored with user_id, cannot be accessed by other users
   */
  async storeToken(userId: string, token: TokenData): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      // Single-user mode: use in-memory cache
      this.singleUserCache.set(this.SINGLE_USER_KEY, token);
      return true;
    }

    try {
      const { error } = await supabase!
        .from('google_oauth_tokens')
        .upsert({
          user_id: userId,
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          token_type: token.token_type || 'Bearer',
          scope: token.scope,
          expiry_date: token.expiry_date,
          refresh_token_expires_in: token.refresh_token_expires_in,
          is_revoked: false,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error(`Error storing token for user ${userId}:`, error);
        return false;
      }

      console.log(`✅ Token stored for user: ${userId}`);
      return true;
    } catch (error: any) {
      console.error(`Error in storeToken for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Update token (e.g., after refresh)
   * Strong isolation: Only updates token for the specified user_id
   */
  async updateToken(userId: string, token: Partial<TokenData>): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      // Single-user mode: update in-memory cache
      const existing = this.singleUserCache.get(this.SINGLE_USER_KEY);
      if (existing) {
        this.singleUserCache.set(this.SINGLE_USER_KEY, { ...existing, ...token });
      }
      return true;
    }

    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      };

      if (token.access_token) updateData.access_token = token.access_token;
      if (token.refresh_token !== undefined) updateData.refresh_token = token.refresh_token;
      if (token.expiry_date !== undefined) updateData.expiry_date = token.expiry_date;
      if (token.scope) updateData.scope = token.scope;

      const { error } = await supabase!
        .from('google_oauth_tokens')
        .update(updateData)
        .eq('user_id', userId)
        .eq('is_revoked', false);

      if (error) {
        console.error(`Error updating token for user ${userId}:`, error);
        return false;
      }

      return true;
    } catch (error: any) {
      console.error(`Error in updateToken for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: TokenData): boolean {
    if (!token.expiry_date) {
      return false; // No expiry date, assume valid
    }
    // 5 minute buffer before expiry
    const bufferTime = 5 * 60 * 1000;
    return Date.now() >= (token.expiry_date - bufferTime);
  }

  /**
   * Revoke token for a user (soft delete)
   * Strong isolation: Only revokes token for the specified user_id
   */
  async revokeToken(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      // Single-user mode: clear cache
      this.singleUserCache.delete(this.SINGLE_USER_KEY);
      return true;
    }

    try {
      const { error } = await supabase!
        .from('google_oauth_tokens')
        .update({ is_revoked: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        console.error(`Error revoking token for user ${userId}:`, error);
        return false;
      }

      console.log(`✅ Token revoked for user: ${userId}`);
      return true;
    } catch (error: any) {
      console.error(`Error in revokeToken for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Clear token from cache (hard delete for single-user mode)
   */
  async clearToken(userId: string): Promise<boolean> {
    return this.revokeToken(userId);
  }
}

// Export singleton instance
export const tokenStorage = new MultiUserTokenStorage();

