-- Migration: Fix MCP Token Hash to Allow Nullable Values
-- This allows users to authenticate via Google OAuth first, then link MCP token later

-- Step 1: Drop the existing UNIQUE constraint on mcp_token_hash
ALTER TABLE mcp_users DROP CONSTRAINT IF EXISTS mcp_users_mcp_token_hash_key;

-- Step 2: Make mcp_token_hash nullable
ALTER TABLE mcp_users ALTER COLUMN mcp_token_hash DROP NOT NULL;

-- Step 3: Create a partial unique index that only applies to non-NULL values
-- This ensures uniqueness for actual MCP tokens while allowing multiple NULL values
CREATE UNIQUE INDEX IF NOT EXISTS mcp_users_mcp_token_hash_unique_idx 
ON mcp_users (mcp_token_hash) 
WHERE mcp_token_hash IS NOT NULL AND mcp_token_hash != '';

-- Step 4: Update any existing empty string values to NULL for consistency
UPDATE mcp_users SET mcp_token_hash = NULL WHERE mcp_token_hash = '';

-- Verification query (run this to check the changes)
-- SELECT user_id, email, mcp_token_hash, is_active FROM mcp_users;
