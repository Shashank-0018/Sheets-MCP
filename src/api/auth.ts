/**
 * Authentication endpoints for MCP token management
 */

import { Request, Response } from 'express';
import { tokenStorage } from '../services/tokenStorage';
import { isSupabaseConfigured, hashMcpToken } from '../services/supabase';
import { supabase } from '../services/supabase';

/**
 * Get or create MCP token for a user
 * This endpoint allows users to get their MCP token after OAuth
 */
export async function getMcpTokenHandler(req: Request, res: Response) {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return res.status(400).json({ 
        error: 'Multi-user mode not enabled. Supabase not configured.' 
      });
    }

    // Get user email from query parameter or request
    const userEmail = req.query.email as string || req.body.email;
    
    if (!userEmail) {
      return res.status(400).json({ 
        error: 'Email is required. Provide ?email=your@email.com' 
      });
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('mcp_users')
      .select('user_id, mcp_token_hash, email')
      .eq('user_id', userEmail)
      .eq('is_active', true)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ 
        error: 'User not found. Please complete OAuth authentication first.',
        hint: 'Visit /auth/url to authenticate with Google'
      });
    }

    // Note: We can't return the actual MCP token (it's hashed in DB)
    // The user needs to provide their MCP token when making requests
    // This endpoint just confirms the user exists
    res.json({
      message: 'User found. Use your MCP token in Authorization header.',
      userId: userData.user_id,
      email: userData.email,
      hint: 'If you don\'t have an MCP token, you can generate one and link it via OAuth'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Link MCP token to user (after OAuth)
 * This is called automatically during OAuth callback, but can be called manually
 */
export async function linkMcpTokenHandler(req: Request, res: Response) {
  try {
    if (!isSupabaseConfigured() || !tokenStorage) {
      return res.status(400).json({ 
        error: 'Multi-user mode not enabled.' 
      });
    }

    const { mcpToken, email } = req.body;

    if (!mcpToken || !email) {
      return res.status(400).json({ 
        error: 'Both mcpToken and email are required.' 
      });
    }

    const linked = await tokenStorage.createOrUpdateUser(mcpToken, email, email);
    
    if (linked) {
      res.json({
        message: 'MCP token linked to user successfully',
        userId: email,
        email: email
      });
    } else {
      res.status(500).json({ error: 'Failed to link MCP token' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

