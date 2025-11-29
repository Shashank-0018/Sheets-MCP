# Quick Start: Testing MCP with Supabase

Since you've added the Supabase environment variables, here's how to test:

## Step 1: Run Database Schema

First, make sure the database tables exist. Open Supabase SQL Editor and run:

```sql
-- Copy and paste the entire contents of supabase/schema.sql
```

Or run it directly from the file.

## Step 2: Start the Server

```bash
npm start
```

You should see:
- ✅ Supabase URL extracted from DATABASE_URL
- ✅ Supabase client initialized
- ✅ Multi-user mode enabled

## Step 3: Auto-Registration (Automatic!)

When you use an MCP token for the first time, the system will:
1. Auto-register the user with a generated `user_id`
2. Store the MCP token hash
3. Allow access immediately

**No manual registration needed!**

## Step 4: Get OAuth URL and Authenticate

```bash
# Get OAuth URL (use your MCP token)
curl http://localhost:3001/auth/url \
  -H "Authorization: Bearer YOUR_MCP_TOKEN"
```

Or if you have MCP_TOKEN in env:

```bash
curl http://localhost:3001/auth/url
```

Copy the `authUrl` and:
1. Open it in your browser
2. Authorize with Google
3. Token will be stored in Supabase for your user

## Step 5: Test MCP Access

```bash
# List available tools
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | npm run mcp

# Create a spreadsheet (example)
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "createSpreadsheet", "arguments": {"properties": {"title": "My Test Sheet"}}}}' | npm run mcp
```

## Troubleshooting

### "User not found" (shouldn't happen with auto-registration)
- Check Supabase connection in server logs
- Verify DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set

### "No token found"
- Complete OAuth flow (Step 4)
- Check `google_oauth_tokens` table in Supabase

### "Supabase not configured"
- Check environment variables are loaded
- Restart server after setting env vars

## Verify in Supabase

Check your Supabase dashboard:

1. **mcp_users table**: Should have your auto-registered user
2. **google_oauth_tokens table**: Should have your token after OAuth

