// Load environment variables from .env file
import 'dotenv/config';

import express from 'express';
import { tools } from './tools';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import { sanitizeError, handleError } from './utils/errorHandler';
import { tokenStorage } from './services/tokenStorage';
import { isSupabaseConfigured, hashMcpToken, supabase } from './services/supabase';

export const app = express();
export const GOOGLE_SHEETS_API_SERVER_PORT = process.env.GOOGLE_SHEETS_API_SERVER_PORT || 3001; // Use a different port than the main HTTP API server

app.use(express.json());

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.email' // For getting user email
];

// Support both environment variables and secrets.json file
let credentials: any;
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  credentials = {
    web: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: [process.env.GOOGLE_REDIRECT_URI || `http://localhost:${GOOGLE_SHEETS_API_SERVER_PORT}/callback`]
    }
  };
} else {
  try {
    credentials = JSON.parse(fs.readFileSync('./secrets.json', 'utf8'));
  } catch (err) {
    throw new Error('Either set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables, or provide secrets.json file');
  }
}

// Token cache - stores tokens in memory instead of file
interface TokenData {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
  refresh_token_expires_in?: number;
}

class TokenCache {
  private cache: Map<string, TokenData> = new Map();
  private readonly CACHE_KEY = 'google_sheets_token';

  /**
   * Load token from environment variable, cache, or file (for backward compatibility)
   */
  loadToken(): TokenData | null {
    // 1. Check environment variable first (for MCP configuration)
    if (process.env.GOOGLE_ACCESS_TOKEN) {
      try {
        const token = JSON.parse(process.env.GOOGLE_ACCESS_TOKEN);
        this.cache.set(this.CACHE_KEY, token);
        return token;
      } catch (err) {
        console.warn('⚠️ Failed to parse GOOGLE_ACCESS_TOKEN, treating as plain access_token string');
        // If it's just a plain string, create a token object
        const token: TokenData = {
          access_token: process.env.GOOGLE_ACCESS_TOKEN,
          token_type: 'Bearer'
        };
        this.cache.set(this.CACHE_KEY, token);
        return token;
      }
    }

    // 2. Check cache
    if (this.cache.has(this.CACHE_KEY)) {
      return this.cache.get(this.CACHE_KEY)!;
    }

    // 3. Fall back to file for backward compatibility (optional)
    try {
      const token = JSON.parse(fs.readFileSync('token.json', 'utf8'));
      this.cache.set(this.CACHE_KEY, token);
      return token;
    } catch (err) {
      // File doesn't exist or is invalid - that's okay, we'll use OAuth flow
      return null;
    }
  }

  /**
   * Store token in cache
   */
  storeToken(token: TokenData): void {
    this.cache.set(this.CACHE_KEY, token);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: TokenData): boolean {
    if (!token.expiry_date) {
      // If no expiry date, assume it's valid (for tokens without expiry info)
      return false;
    }
    // Add 5 minute buffer before expiry
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() >= (token.expiry_date - bufferTime);
  }

  /**
   * Clear token from cache
   */
  clearToken(): void {
    this.cache.delete(this.CACHE_KEY);
  }
}

const tokenCache = new TokenCache();

// Import userId helper
import { getUserIdFromRequest } from './utils/userIdHelper';

/**
 * Authorize Google OAuth client with user-specific token
 * Strong isolation: Each user gets their own token
 */
async function authorize(userId?: string): Promise<OAuth2Client> {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris ? redirect_uris[0] : undefined);

  // Use multi-user token storage if Supabase is configured
  const useMultiUser = isSupabaseConfigured();
  if (!userId) {
    throw new Error('User ID is required for authorization. Please ensure you are authenticated.');
  }
  const targetUserId = userId;

  let token: TokenData | null = null;

  if (useMultiUser && tokenStorage) {
    // Multi-user mode: Load token from database for specific user
    token = await tokenStorage.loadToken(targetUserId);
  } else {
    // Single-user mode: Use legacy token cache
    token = tokenCache.loadToken();
  }

  // Fallback to environment variable if no token found
  if (!token && process.env.GOOGLE_ACCESS_TOKEN) {
    try {
      const envToken = JSON.parse(process.env.GOOGLE_ACCESS_TOKEN);
      if (useMultiUser && tokenStorage) {
        await tokenStorage.storeToken(targetUserId, envToken);
      } else {
        tokenCache.storeToken(envToken);
      }
      token = envToken;
    } catch (err) {
      // Plain string token
      const plainToken: TokenData = {
        access_token: process.env.GOOGLE_ACCESS_TOKEN,
        token_type: 'Bearer'
      };
      if (useMultiUser && tokenStorage) {
        await tokenStorage.storeToken(targetUserId, plainToken);
      } else {
        tokenCache.storeToken(plainToken);
      }
      token = plainToken;
    }
  }

  if (!token) {
    throw new Error(
      `No token found for user ${targetUserId}. Please visit http://localhost:${GOOGLE_SHEETS_API_SERVER_PORT}/auth/url to get the OAuth URL and authenticate.`
    );
  }

  // Check if token is expired and refresh if needed
  const isExpired = useMultiUser && tokenStorage
    ? tokenStorage.isTokenExpired(token)
    : tokenCache.isTokenExpired(token);

  if (isExpired && token.refresh_token) {
    console.log(`🔄 Token expired for user ${targetUserId}, attempting to refresh...`);
    try {
      oAuth2Client.setCredentials({
        refresh_token: token.refresh_token
      });
      const { credentials: newCredentials } = await oAuth2Client.refreshAccessToken();
      const updatedToken: TokenData = {
        ...token,
        access_token: newCredentials.access_token!,
        expiry_date: newCredentials.expiry_date || undefined,
      };

      // Store refreshed token
      if (useMultiUser && tokenStorage) {
        await tokenStorage.updateToken(targetUserId, updatedToken);
      } else {
        tokenCache.storeToken(updatedToken);
      }

      token = updatedToken;
      console.log(`✅ Token refreshed successfully for user ${targetUserId}`);
    } catch (refreshError) {
      // Best Practice: Cleanup on error - clear invalid token
      console.error(`❌ Failed to refresh token for user ${targetUserId}:`, refreshError);
      if (useMultiUser && tokenStorage) {
        await tokenStorage.clearToken(targetUserId);
      } else {
        tokenCache.clearToken();
      }
      // Sanitize error message - don't expose token details
      throw new Error(
        `Token expired and refresh failed. Please visit http://localhost:${GOOGLE_SHEETS_API_SERVER_PORT}/auth/url to re-authenticate.`
      );
    }
  }

  // Convert TokenData to Credentials format for setCredentials
  const tokenCredentials: any = {
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    scope: token.scope,
    token_type: token.token_type || 'Bearer',
    expiry_date: token.expiry_date,
  };
  oAuth2Client.setCredentials(tokenCredentials);
  return oAuth2Client;
}

// OAuth callback handler - supports both /callback and /oauth2callback
async function handleOAuthCallback(req: express.Request, res: express.Response) {
  const code = req.query.code as string;
  let mcpToken = req.query.state as string; // MCP token passed in state parameter

  if (!code) {
    res.status(400).send('Authorization code not found.');
    return;
  }

  try {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris ? redirect_uris[0] : undefined);
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Get user email from Google OAuth token
    let userEmail: string | null = null;
    let userId: string = 'default_user';
    let autoGeneratedToken = false;

    const useMultiUser = isSupabaseConfigured();
    if (useMultiUser && tokenStorage) {
      try {
        // Get user info from Google to extract email
        const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
        const userInfo = await oauth2.userinfo.get();
        userEmail = userInfo.data.email || null;

        if (userEmail) {
          // Use email as user_id for automatic user management
          userId = userEmail;

          // Auto-generate MCP token if not provided or if it's 'default'
          if (!mcpToken || mcpToken === 'default') {
            // Generate a unique, secure MCP token for this user
            // Format: mcp_<random_32_chars>
            const crypto = require('crypto');
            mcpToken = `mcp_${crypto.randomBytes(16).toString('hex')}`;
            autoGeneratedToken = true;
          }

          // Always create/update user record with MCP token
          const created = await tokenStorage.createOrUpdateUser(mcpToken, userId, userEmail);
          if (created) {
          } else {
            console.error(`❌ Failed to create user record for: ${userId}`);
          }

          // Store token for this user
          await tokenStorage.storeToken(userId, tokens as TokenData);
          console.log(`✅ Token stored for user: ${userId} (${userEmail})`);
        } else {
          // Fallback if email not available
          if (!mcpToken || mcpToken === 'default') {
            const crypto = require('crypto');
            mcpToken = `mcp_${crypto.randomBytes(16).toString('hex')}`;
            autoGeneratedToken = true;
          }
          userId = `user_${hashMcpToken(mcpToken).substring(0, 8)}`;
          await tokenStorage.createOrUpdateUser(mcpToken, userId);
          await tokenStorage.storeToken(userId, tokens as TokenData);
        }
      } catch (userInfoError: any) {
        console.warn('⚠️  Could not fetch user email, using fallback user_id');
        // Fallback: auto-generate MCP token if needed
        if (!mcpToken || mcpToken === 'default') {
          const crypto = require('crypto');
          mcpToken = `mcp_${crypto.randomBytes(16).toString('hex')}`;
          autoGeneratedToken = true;
        }
        userId = `user_${hashMcpToken(mcpToken).substring(0, 8)}`;
        await tokenStorage.createOrUpdateUser(mcpToken, userId);
        await tokenStorage.storeToken(userId, tokens as TokenData);
      }
    } else {
      // Single-user mode: use legacy cache
      tokenCache.storeToken(tokens as TokenData);

      // Also write to file for backward compatibility
      try {
        fs.writeFileSync('token.json', JSON.stringify(tokens))
      } catch (fileErr) {
        console.warn('⚠️ Could not write token.json, but token is cached');
      }
    }

    // Display success message with MCP token if auto-generated
    let successMessage = `Authentication successful! Token has been stored for user: ${userId}${userEmail ? ` (${userEmail})` : ''}.`;
    if (autoGeneratedToken) {
      successMessage += `\n\n🔑 Your MCP Token (save this securely):\n${mcpToken}\n\nUse this token in your MCP client configuration.`;
    }
    successMessage += '\n\nYou can close this tab.';

    res.send(`<html><body><pre>${successMessage}</pre></body></html>`);
  } catch (err) {
    // Use sanitized error handling to avoid leaking token details
    handleError(err, 'OAuth Callback', res);
  }
}

app.get('/callback', handleOAuthCallback);
app.get('/oauth2callback', handleOAuthCallback);

// Helper endpoint to get OAuth URL
app.get('/auth/url', (req, res) => {
  try {
    // Get MCP token from Authorization header (if provided)
    const authHeader = req.headers.authorization;
    const mcpToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : process.env.MCP_TOKEN || null;

    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris ? redirect_uris[0] : undefined);

    // Pass MCP token in state parameter so we can link it to the user after OAuth
    // The user's email will be extracted from Google OAuth and used as user_id
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [...SCOPES, 'https://www.googleapis.com/auth/userinfo.email'], // Add email scope
      state: mcpToken || 'default', // Pass MCP token in state for linking
    });

    res.json({
      authUrl,
      message: 'Visit this URL to authorize the application. User will be automatically created from your Google email.',
      note: 'After authorization, your email will be used as user_id automatically.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Token revocation endpoint (for multi-user support)
app.post('/auth/revoke', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!isSupabaseConfigured() || !tokenStorage) {
      return res.status(400).json({
        error: 'Token revocation requires Supabase configuration. Multi-user mode not enabled.'
      });
    }

    const revoked = await tokenStorage.revokeToken(userId);
    if (revoked) {
      res.json({
        message: `Token revoked successfully for user: ${userId}`,
        userId: userId
      });
    } else {
      res.status(500).json({ error: 'Failed to revoke token' });
    }
  } catch (error: any) {
    handleError(error, 'POST /auth/revoke', res);
  }
});

// Public URL fetcher - reads any publicly accessible URL
app.get('/fetch', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      res.status(400).json({
        error: 'URL parameter is required',
        example: '/fetch?url=https://api.example.com/data'
      });
      return;
    }

    // Validate URL
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch (e) {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    // Only allow http and https protocols for security
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      res.status(400).json({ error: 'Only HTTP and HTTPS URLs are allowed' });
      return;
    }

    // Use Node.js built-in fetch (Node 18+)
    const method = (req.query.method as string) || 'GET';
    const customHeaders = req.query.headers ? JSON.parse(req.query.headers as string) : {};

    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: {
        'User-Agent': 'MCP-Server/1.0',
        'Accept': 'application/json, text/plain, */*',
        ...customHeaders,
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const contentType = response.headers.get('content-type') || '';
    let data: any;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      url: url,
    });
  } catch (error: any) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      res.status(408).json({ error: 'Request timeout' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.get('/tools', (req, res) => {
  res.json(tools);
});

app.post('/spreadsheets', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const auth = await authorize(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.create({
      requestBody: req.body,
    });
    res.json(response.data);
  } catch (error: any) {
    // Use sanitized error handling - never expose tokens or internal details
    handleError(error, 'POST /spreadsheets', res);
  }
});

app.get('/spreadsheets/:spreadsheetId', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const auth = await authorize(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.get({
      spreadsheetId: req.params.spreadsheetId,
      ranges: typeof req.query.ranges === 'string' ? [req.query.ranges] : req.query.ranges as string[] | undefined,
      includeGridData: req.query.includeGridData === 'true',
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in GET /spreadsheets/:spreadsheetId:', error);
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: error.response.data || error.message
      });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.get('/spreadsheets/:spreadsheetId/values:batchGet', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const auth = await authorize(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: req.params.spreadsheetId,
      ranges: req.query.ranges as string[],
      majorDimension: req.query.majorDimension as string,
      valueRenderOption: req.query.valueRenderOption as string,
      dateTimeRenderOption: req.query.dateTimeRenderOption as string,
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in GET /spreadsheets/:spreadsheetId/values:batchGet:', error);
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: error.response.data || error.message
      });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.get('/spreadsheets/:spreadsheetId/values/:range', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const auth = await authorize(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    const range = decodeURIComponent(req.params.range);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: req.params.spreadsheetId,
      range: range,
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in GET /spreadsheets/:spreadsheetId/values/:range:', error);
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: error.response.data || error.message
      });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.put('/spreadsheets/:spreadsheetId/values/:range', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const auth = await authorize(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    const range = decodeURIComponent(req.params.range);
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: req.params.spreadsheetId,
      range: range,
      valueInputOption: req.query.valueInputOption as string,
      requestBody: req.body,
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in PUT /spreadsheets/:spreadsheetId/values/:range:', error);
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: error.response.data || error.message
      });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.post('/spreadsheets/:spreadsheetId/values:batchUpdate', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const auth = await authorize(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: req.params.spreadsheetId,
      requestBody: req.body,
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in POST /spreadsheets/:spreadsheetId/values:batchUpdate:', error);
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: error.response.data || error.message
      });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.post('/spreadsheets/:spreadsheetId/values/:range/append', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const auth = await authorize(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    const range = decodeURIComponent((req.params as any).range);
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: req.params.spreadsheetId,
      range: range,
      valueInputOption: req.query.valueInputOption as string,
      insertDataOption: req.query.insertDataOption as string,
      requestBody: req.body,
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in POST /spreadsheets/:spreadsheetId/values/:range:append:', error);
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: error.response.data || error.message
      });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.post('/spreadsheets/:spreadsheetId/values/:range/clear', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const auth = await authorize(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    const range = decodeURIComponent((req.params as any).range);
    const response = await sheets.spreadsheets.values.clear({
      spreadsheetId: req.params.spreadsheetId,
      range: range,
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in POST /spreadsheets/:spreadsheetId/values/:range:clear:', error);
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: error.response.data || error.message
      });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.post('/spreadsheets/:spreadsheetId/values:batchClear', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const auth = await authorize(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.batchClear({
      spreadsheetId: req.params.spreadsheetId,
      requestBody: req.body,
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in POST /spreadsheets/:spreadsheetId/values:batchClear:', error);
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: error.response.data || error.message
      });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.post('/spreadsheets/:spreadsheetId/getByDataFilter', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const auth = await authorize(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.getByDataFilter({
      spreadsheetId: req.params.spreadsheetId,
      requestBody: req.body,
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in POST /spreadsheets/:spreadsheetId/getByDataFilter:', error);
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: error.response.data || error.message
      });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.post('/spreadsheets/:spreadsheetId/values:batchGetByDataFilter', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const auth = await authorize(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.batchGetByDataFilter({
      spreadsheetId: req.params.spreadsheetId,
      requestBody: req.body,
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in POST /spreadsheets/:spreadsheetId/values:batchGetByDataFilter:', error);
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: error.response.data || error.message
      });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.post('/spreadsheets/:spreadsheetId/values:batchClearByDataFilter', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const auth = await authorize(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.batchClearByDataFilter({
      spreadsheetId: req.params.spreadsheetId,
      requestBody: req.body,
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in POST /spreadsheets/:spreadsheetId/values:batchClearByDataFilter:', error);
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: error.response.data || error.message
      });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.post('/spreadsheets/:spreadsheetId/batchUpdate', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const auth = await authorize(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    const batchUpdateResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: req.params.spreadsheetId,
      requestBody: req.body,
    });
    res.json(batchUpdateResponse.data);
  } catch (error: any) {
    console.error('Error in POST /spreadsheets/:spreadsheetId/batchUpdate:', error);
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: error.response.data || error.message
      });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.post('/spreadsheets/:spreadsheetId/sheets/:sheetId/copyTo', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const auth = await authorize(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetId = parseInt(req.params.sheetId, 10);
    if (isNaN(sheetId)) {
      res.status(400).json({ error: 'Invalid sheetId. Must be a number.' });
      return;
    }
    const response = await sheets.spreadsheets.sheets.copyTo({
      spreadsheetId: req.params.spreadsheetId,
      sheetId: sheetId,
      requestBody: {
        destinationSpreadsheetId: req.body.destinationSpreadsheetId,
      },
    });
    res.json(response.data);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Start the server if this file is executed directly
if (require.main === module) {
  app.listen(GOOGLE_SHEETS_API_SERVER_PORT, () => {
    console.log(`Google Sheets API internal server running on port ${GOOGLE_SHEETS_API_SERVER_PORT}`);
  });
}

