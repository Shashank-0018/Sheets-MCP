# Auto-Generated MCP Tokens

## Overview

When users authenticate via Google OAuth without providing an MCP token, the system now **automatically generates** a unique, secure MCP token for them.

## How It Works

### OAuth Flow

1. User visits `/auth/url` (without MCP token in Authorization header)
2. User authenticates with Google
3. System auto-generates a unique MCP token: `mcp_<32_random_hex_chars>`
4. User record is created with:
   - `user_id`: User's email from Google
   - `mcp_token_hash`: SHA-256 hash of the auto-generated token
   - `email`: User's email
5. OAuth tokens are stored
6. **Success page displays the auto-generated MCP token** for the user to save

### Token Format

- **Auto-generated**: `mcp_` + 32 random hexadecimal characters
- **Example**: `mcp_a1b2c3d4e5f6789012345678901234ab`
- **Security**: Cryptographically secure random bytes (16 bytes = 32 hex chars)

## Usage

### For Users

After completing OAuth authentication, you'll see:

```
Authentication successful! Token has been stored for user: your.email@gmail.com (your.email@gmail.com).

🔑 Your MCP Token (save this securely):
mcp_a1b2c3d4e5f6789012345678901234ab

Use this token in your MCP client configuration.

You can close this tab.
```

**Important:** Save this token securely! You'll need it to authenticate API requests.

### For Developers

#### Providing Your Own MCP Token

If you want to use a specific MCP token instead of auto-generated one:

```bash
curl http://localhost:3001/auth/url \
  -H "Authorization: Bearer your-custom-mcp-token"
```

#### Using Auto-Generated Token

Simply visit the auth URL without providing a token:

```bash
curl http://localhost:3001/auth/url
```

## Database Schema

### Before (NULL mcp_token_hash)

```sql
SELECT user_id, email, mcp_token_hash FROM mcp_users;
```

| user_id | email | mcp_token_hash |
|---------|-------|----------------|
| user@gmail.com | user@gmail.com | NULL |

### After (Auto-Generated)

```sql
SELECT user_id, email, mcp_token_hash FROM mcp_users;
```

| user_id | email | mcp_token_hash |
|---------|-------|----------------|
| user@gmail.com | user@gmail.com | 5f4dcc3b5aa765d61d8327deb882cf99... |

## Security Considerations

1. **Unique Tokens**: Each user gets a unique token
2. **Secure Generation**: Uses Node.js `crypto.randomBytes()` for cryptographic randomness
3. **Hashed Storage**: Only SHA-256 hash is stored in database
4. **One-Time Display**: Token is shown only once during OAuth callback
5. **User Responsibility**: Users must save their token securely

## Benefits

✅ **Seamless Onboarding**: Users don't need to generate MCP tokens manually
✅ **Always Populated**: `mcp_token_hash` is never NULL
✅ **Backward Compatible**: Still supports custom MCP tokens
✅ **Secure**: Cryptographically secure random generation
✅ **User-Friendly**: Clear instructions displayed after OAuth

## Migration from NULL Tokens

If you have existing users with NULL `mcp_token_hash`, they will get an auto-generated token on their next OAuth authentication.

## Testing

```bash
# 1. Get OAuth URL (no token provided)
curl http://localhost:3001/auth/url

# 2. Open the authUrl in browser and authenticate

# 3. Check database
SELECT user_id, email, mcp_token_hash FROM mcp_users;

# 4. Verify mcp_token_hash is populated (not NULL)
```
