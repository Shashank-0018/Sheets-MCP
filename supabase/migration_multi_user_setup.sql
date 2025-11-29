-- Multi-User Token Storage Schema for Google Sheets MCP Server
-- Strong isolation: Each user has isolated token storage
-- Revocable: Tokens can be revoked/deleted per user

-- Users table: Maps MCP tokens to users
-- This provides strong isolation - each user has their own tokens
CREATE TABLE IF NOT EXISTS mcp_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) UNIQUE NOT NULL, -- Unique identifier (email, username, etc.)
    mcp_token_hash VARCHAR(255) UNIQUE NOT NULL, -- Hashed MCP token for authentication
    email VARCHAR(255), -- Optional: user email
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Index for fast lookups
    CONSTRAINT mcp_users_user_id_key UNIQUE (user_id),
    CONSTRAINT mcp_users_mcp_token_hash_key UNIQUE (mcp_token_hash)
);

-- Google OAuth tokens table: Per-user token storage
-- Strong isolation: Each row is tied to a specific user_id
CREATE TABLE IF NOT EXISTS google_oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES mcp_users(user_id) ON DELETE CASCADE,
    
    -- Google OAuth token data (encrypted at application level)
    access_token TEXT NOT NULL,
    refresh_token TEXT, -- Optional: for token refresh
    token_type VARCHAR(50) DEFAULT 'Bearer',
    scope TEXT,
    expiry_date BIGINT, -- Unix timestamp in milliseconds
    refresh_token_expires_in INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_revoked BOOLEAN DEFAULT FALSE,
    
    -- Ensure one active token per user (soft delete via is_revoked)
    CONSTRAINT google_oauth_tokens_user_id_key UNIQUE (user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_user_id ON google_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_is_revoked ON google_oauth_tokens(is_revoked);
CREATE INDEX IF NOT EXISTS idx_mcp_users_mcp_token_hash ON mcp_users(mcp_token_hash);

-- Row Level Security (RLS) policies for strong isolation
-- Note: Supabase RLS requires authentication, but we'll handle isolation at application level
-- This is a backup security measure

-- Enable RLS
ALTER TABLE mcp_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_mcp_users_updated_at
    BEFORE UPDATE ON mcp_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_oauth_tokens_updated_at
    BEFORE UPDATE ON google_oauth_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View for active tokens (excludes revoked tokens)
CREATE OR REPLACE VIEW active_google_tokens AS
SELECT 
    t.*,
    u.email,
    u.is_active as user_is_active
FROM google_oauth_tokens t
JOIN mcp_users u ON t.user_id = u.user_id
WHERE t.is_revoked = FALSE 
  AND u.is_active = TRUE;

-- Comments for documentation
COMMENT ON TABLE mcp_users IS 'Maps MCP tokens to users for strong isolation';
COMMENT ON TABLE google_oauth_tokens IS 'Per-user Google OAuth tokens with strong isolation';
COMMENT ON COLUMN google_oauth_tokens.user_id IS 'Foreign key to mcp_users - ensures token isolation';
COMMENT ON COLUMN google_oauth_tokens.is_revoked IS 'Soft delete flag - allows token revocation';

