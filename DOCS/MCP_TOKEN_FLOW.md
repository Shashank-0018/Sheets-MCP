# MCP Token Flow in Multi-User Mode

## Current Issue

When you authenticated, the OAuth callback received `state=default` (no MCP token), so the MCP token → user mapping wasn't created in the database.

## Solution: Two Options

### Option 1: Link MCP Token After OAuth (Recommended)

Since you've already authenticated, you can link your MCP token now:

```powershell
# Link your MCP token to your email
$body = @{
    mcpToken = "your_mcp_token_here"
    email = "shashank.asthana05@gmail.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/auth/link-token" -Method Post -Headers @{ "Content-Type" = "application/json" } -Body $body
```

### Option 2: Re-authenticate with MCP Token

1. Get OAuth URL with your MCP token:
```powershell
$mcpToken = "your_mcp_token_here"
$response = Invoke-RestMethod -Uri "http://localhost:3001/auth/url" -Headers @{ "Authorization" = "Bearer $mcpToken" }
$response.authUrl
```

2. Visit the authUrl and authenticate
3. The MCP token will be automatically linked to your email

## How It Works

1. **OAuth Flow:**
   - User provides MCP token in Authorization header when calling `/auth/url`
   - MCP token is passed in OAuth `state` parameter
   - After OAuth, callback extracts email and creates mapping: `mcp_token_hash → user_id (email)`

2. **API Requests:**
   - User provides MCP token in Authorization header
   - Middleware looks up token hash in `mcp_users` table
   - Gets `user_id` (email) from database
   - Loads Google OAuth token for that `user_id`

3. **Database Structure:**
   - `mcp_users`: Maps `mcp_token_hash` → `user_id` (email)
   - `google_oauth_tokens`: Stores Google tokens by `user_id` (email)

## Check Your Current Status

```powershell
# Check if your user exists
Invoke-RestMethod -Uri "http://localhost:3000/auth/mcp-token?email=shashank.asthana05@gmail.com"
```

This will tell you if your user record exists and if an MCP token is linked.

