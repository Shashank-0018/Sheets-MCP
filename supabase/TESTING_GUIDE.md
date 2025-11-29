# Testing Guide: MCP Token Hash Fix

## What Was Fixed

The `mcp_token_hash` was not being created after Google OAuth login because:
- Schema required `mcp_token_hash` to be UNIQUE NOT NULL
- Code was inserting empty string `''` when no MCP token was provided
- This caused constraint violations

## Changes Made

1. **Database Schema**: Made `mcp_token_hash` nullable with partial unique index
2. **Application Code**: Changed empty string to NULL when no MCP token provided
3. **TypeScript Interface**: Updated to allow `mcp_token_hash: string | null`

## How to Apply the Fix

### Step 1: Run Migration Script

Open Supabase SQL Editor and run:

```bash
# Copy and paste the entire contents of:
supabase/migration_fix_mcp_token_hash.sql
```

This will:
- Drop the old UNIQUE constraint
- Make `mcp_token_hash` nullable
- Create a partial unique index (only for non-NULL values)
- Clean up any existing empty string values

### Step 2: Restart the Server

```bash
# Stop the current server (Ctrl+C)
npm start
```

### Step 3: Test OAuth Flow

#### Test 1: OAuth Without MCP Token

```bash
# Get OAuth URL (no MCP token)
curl http://localhost:3001/auth/url
```

1. Open the `authUrl` in your browser
2. Authorize with Google
3. Check Supabase `mcp_users` table:
   - ✅ `user_id` should be your email
   - ✅ `email` should be populated
   - ✅ `mcp_token_hash` should be NULL
   - ✅ `is_active` should be TRUE

4. Check `google_oauth_tokens` table:
   - ✅ Token should be stored for your email

#### Test 2: OAuth With MCP Token

```bash
# Get OAuth URL with MCP token
curl http://localhost:3001/auth/url \
  -H "Authorization: Bearer your-test-mcp-token"
```

1. Open the `authUrl` in your browser
2. Authorize with Google
3. Check Supabase `mcp_users` table:
   - ✅ `user_id` should be your email
   - ✅ `mcp_token_hash` should be populated (SHA-256 hash)
   - ✅ `email` should be populated

## Verification Queries

Run these in Supabase SQL Editor:

```sql
-- Check all users
SELECT user_id, email, mcp_token_hash, is_active 
FROM mcp_users 
ORDER BY created_at DESC;

-- Check users without MCP token
SELECT user_id, email, created_at 
FROM mcp_users 
WHERE mcp_token_hash IS NULL;

-- Check users with MCP token
SELECT user_id, email, created_at 
FROM mcp_users 
WHERE mcp_token_hash IS NOT NULL;

-- Check all tokens
SELECT t.user_id, u.email, t.is_revoked, t.created_at
FROM google_oauth_tokens t
JOIN mcp_users u ON t.user_id = u.user_id
ORDER BY t.created_at DESC;
```

## Expected Behavior

### Before Fix
- ❌ OAuth login failed with constraint violation
- ❌ `mcp_token_hash` was empty string `''`
- ❌ Multiple users couldn't authenticate without MCP token

### After Fix
- ✅ OAuth login works with or without MCP token
- ✅ `mcp_token_hash` is NULL when not provided
- ✅ `mcp_token_hash` is populated when MCP token is provided
- ✅ Multiple users can authenticate without MCP tokens
- ✅ MCP token uniqueness is still enforced

## Troubleshooting

### "duplicate key value violates unique constraint"

This means the migration wasn't run. Execute:
```sql
-- Run the migration script
-- supabase/migration_fix_mcp_token_hash.sql
```

### "User created but mcp_token_hash is still empty string"

Restart the server to load the updated code:
```bash
npm start
```

### "Cannot read property 'mcp_token_hash' of null"

The TypeScript types need to be recompiled:
```bash
npm run build
npm start
```
