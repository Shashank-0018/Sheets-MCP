# MCP Server Setup Guide

This guide will help you set up and test the Google Sheets MCP server with Cursor and Gemini.

## Prerequisites

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Ensure you have a valid `token.json` file:**
   - Run `npm start` and visit `http://localhost:3000/auth/url` to get the OAuth URL
   - Complete the OAuth flow to generate `token.json`

## Setup Steps

### 1. Start the HTTP API Server

The MCP server needs the HTTP API server running. Start it with:

```bash
npm start
```

This will start:
- Main HTTP API server on port 3000 (serves tools)
- Google Sheets API server on port 3001 (handles Google Sheets operations)

### 2. Configure Cursor MCP Settings

The MCP server is already configured in `.gemini/settings.json`. The configuration:

```json
{
  "mcpServers": {
    "google-sheets": {
      "command": "node",
      "args": ["dist/mcp-server.js"],
      "transport": "stdio",
      "trust": true,
      "env": {
        "MCP_HTTP_SERVER_URL": "http://localhost:3000"
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

### Test the HTTP Server

```bash
# Check if tools are available
curl http://localhost:3000/tools

# Test a tool
curl -X POST http://localhost:3000/api/tools/getValuesFromRange \
  -H "Content-Type: application/json" \
  -d '{"spreadsheetId": "YOUR_SPREADSHEET_ID", "range": "Sheet1!A1:B2"}'
```

### Test the MCP Server

You can test the MCP server directly:

```bash
# Build first
npm run build

# Test MCP server (requires HTTP server running)
npm run mcp
```

Then send JSON-RPC requests via stdin.

## Troubleshooting

1. **MCP server can't connect to HTTP server:**
   - Ensure `npm start` is running
   - Check that port 3000 is not blocked
   - Verify `MCP_HTTP_SERVER_URL` in `.gemini/settings.json` is correct

2. **"No token found" error:**
   - Run `npm start` and complete OAuth flow
   - Ensure `token.json` exists in the project root

3. **Tools not appearing:**
   - Rebuild: `npm run build`
   - Restart Cursor/Gemini
   - Check HTTP server is running: `curl http://localhost:3000/tools`

4. **TypeScript compilation errors:**
   - Run `npm run build` to see errors
   - Fix any TypeScript issues before testing

## Environment Variables

You can set these environment variables instead of using `secrets.json`:

- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth redirect URI (defaults to `http://localhost:3001/callback`)
- `MCP_HTTP_SERVER_URL` - HTTP server URL for MCP (defaults to `http://localhost:3000`)

