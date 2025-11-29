# MCP Server Setup Guide

This guide will help you set up and test the Google Sheets MCP server with Cursor and Gemini, featuring the new multi-user architecture.

## Prerequisites

1.  **Node.js** (v18.x or higher)
2.  **Supabase Project**: Required for multi-user token storage.
3.  **Google Cloud Project**: With Google Sheets API enabled and OAuth credentials.

## Step 1: Environment Configuration

Create a `.env` file in the project root with the following variables:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID="your_client_id"
GOOGLE_CLIENT_SECRET="your_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/callback"

# Supabase Configuration (Required for Multi-User)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Server Configuration
PORT=3000
GOOGLE_SHEETS_API_SERVER_PORT=3001
```

## Step 2: Database Setup

1.  Go to your Supabase project's SQL Editor.
2.  Run the contents of `supabase/schema.sql` to create the necessary tables (`mcp_users`, `google_oauth_tokens`).

## Step 3: Build and Start

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Build the project:**
    ```bash
    npm run build
    ```

3.  **Start the servers:**
    ```bash
    npm start
    ```
    This starts:
    - **MCP HTTP Server** on port 3000
    - **Google Sheets API Server** on port 3001

## Step 4: Authentication & Token Generation

1.  **Get OAuth URL:**
    Visit `http://localhost:3001/auth/url` in your browser.

2.  **Authorize:**
    Log in with your Google account and grant permissions.

3.  **Get MCP Token:**
    After authorization, you will be redirected to a page displaying your **Auto-Generated MCP Token**.
    **Save this token!** You will need it to authenticate your MCP client.

## Step 5: Configure MCP Client (Cursor/Gemini)

Add the server to your MCP configuration (e.g., `.cursor/mcp.json` or global settings):

```json
{
  "mcpServers": {
    "google-sheets": {
      "command": "node",
      "args": ["path/to/google-sheets-mcp/dist/mcp-server.js"],
      "env": {
        "MCP_HTTP_SERVER_URL": "http://localhost:3000",
        "MCP_TOKEN": "your_auto_generated_mcp_token_here"
      }
    }
  }
}
```

**For Cursor**, you may need to add this to your Cursor settings. The location depends on your OS:

Or use Cursor's settings UI to add MCP servers.

### 3. Restart Cursor/Gemini

After updating the configuration, restart Cursor or reload the Gemini extension to pick up the new MCP server.

## Available Tools

The MCP server exposes the following Google Sheets tools:

1. **createSpreadsheet** - Create a new spreadsheet
2. **getSpreadsheetById** - Get spreadsheet metadata
3. **batchUpdateSpreadsheetById** - Apply batch updates to spreadsheet
4. **getValuesFromRange** - Read values from a range
5. **batchGetValues** - Read multiple ranges
6. **updateValuesInRange** - Update values in a range
7. **batchUpdateValues** - Update multiple ranges
8. **appendValuesToRange** - Append values to a range
9. **clearValuesFromRange** - Clear values from a range
10. **batchClearValues** - Clear multiple ranges
11. **getSpreadsheetByDataFilter** - Get spreadsheet using data filters
12. **batchGetValuesByDataFilter** - Get values using data filters
13. **batchClearValuesByDataFilter** - Clear values using data filters
14. **copySheetToSpreadsheet** - Copy a sheet to another spreadsheet

## Testing

### Test HTTP API (with Token)

```bash
curl http://localhost:3000/api/tools/listSpreadsheets \
  -H "Authorization: Bearer your_mcp_token"
```

### Test MCP Server

```bash
npm run mcp
```
Then paste a JSON-RPC request:
```json
{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
```

## Troubleshooting

1.  **"User ID is required for authorization"**:
    - This means you are not passing a valid `MCP_TOKEN`.
    - Ensure `MCP_TOKEN` is set in your client configuration.
    - Ensure the token matches the one generated during OAuth.

2.  **"Supabase not fully configured"**:
    - Check your `.env` file for `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

3.  **"Invalid MCP token"**:
    - The token provided does not match any user in the database.
    - Re-authenticate via `http://localhost:3001/auth/url` to get a new token.
