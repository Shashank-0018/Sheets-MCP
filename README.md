# Google Sheets MCP Server

This project implements a Model Context Protocol (MCP) server that allows AI assistants (like Gemini, Cursor, Claude) to interact with the Google Sheets API. It follows a two-server architecture: an internal Google Sheets API server handling OAuth2 and direct API calls, and an external-facing MCP HTTP server that exposes Google Sheets functionalities as tools.

## Architecture Overview

The system comprises three main components:

1.  **Internal Google Sheets API Server (`src/google-sheets-api-server.ts`)**:
    *   Runs on port `3001`.
    *   Handles all direct communication with the Google Sheets API.
    *   Manages OAuth2 authentication and token storage (`token.json`).
    *   Exposes REST endpoints for each Google Sheets API operation.
2.  **Main MCP HTTP Server (`src/index.ts`)**:
    *   Runs on port `3000`.
    *   Serves as the primary interface for tool definitions and execution.
    *   Routes tool execution calls (`/api/tools/{toolName}`) to the corresponding handlers.
    *   Tool handlers then make HTTP requests to the internal Google Sheets API server.
3.  **MCP Protocol Wrapper (`src/mcp-server.ts`)**:
    *   Communicates with LLM clients via JSON-RPC 2.0 over standard input/output (stdio).
    *   Handles `initialize`, `tools/list`, and `tools/call` methods.
    *   Forwards `tools/list` requests to the Main MCP HTTP Server's `/tools` endpoint.
    *   Forwards `tools/call` requests to the Main MCP HTTP Server's `/api/tools/{toolName}` endpoint.

```text
┌─────────────────────────────────────────────────────────────┐
│                    LLM Client                               │
│              (Cursor IDE, Gemini CLI, Claude Desktop)       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ JSON-RPC 2.0 over stdio
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  MCP Protocol Wrapper                       │
│              (mcp-server.ts - stdio handler)                │
│  - Handles initialize, tools/list, tools/call               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP Requests
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  Main MCP HTTP Server                       │
│              (index.ts - Express server)                    │
│  - GET /tools (list all tools)                              │
│  - POST /api/tools/{toolName} (execute tool)                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP Requests
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Internal Google Sheets API Server              │
│           (google-sheets-api-server.ts)                     │
│  - Handles OAuth2 and direct Google Sheets API calls        │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Google Sheets API Calls
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Google Sheets API                              │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Prerequisites

*   **Node.js** (v18.x or higher recommended)
*   **npm** or **yarn** package manager
*   **Google Cloud Project:** A Google Cloud Project with the Google Sheets API enabled.
*   **OAuth 2.0 Client ID:** Credentials for a Web application (Client ID and Client Secret) from your Google Cloud Project.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd google-sheets-mcp-server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Environment Variables

Create a `secrets.json` file in the project root with your Google OAuth 2.0 client credentials:

```json
{
  "web": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost:3001/callback"]
  }
}
```

Alternatively, you can set these as environment variables:

```bash
export GOOGLE_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET"
export GOOGLE_REDIRECT_URI="http://localhost:3001/callback"
```

## Running the Servers

To start both the Main MCP HTTP Server and the Internal Google Sheets API Server:

```bash
npm start
```

This command uses `npm-run-all` to run `start:main` (port 3000) and `start:sheets` (port 3001) concurrently.

*   **`npm run start:main`**: Starts the Main MCP HTTP Server (`src/index.ts`) on port `3000`.
*   **`npm run start:sheets`**: Starts the Internal Google Sheets API Server (`src/google-sheets-api-server.ts`) on port `3001`.

## Google Sheets API Authorization

The internal Google Sheets API server requires OAuth2 authorization to interact with Google Sheets.

1.  **Start the servers:** Ensure both servers are running using `npm start`.
2.  **Get Authorization URL:** Access the `/auth/url` endpoint of the internal server:
    ```bash
    curl http://localhost:3001/auth/url
    ```
    This will return a JSON object containing an `authUrl`.
3.  **Authorize in Browser:** Open the `authUrl` in your web browser. Grant the necessary permissions to your Google account.
4.  **Token Storage:** After successful authorization, Google will redirect to `http://localhost:3001/callback`, and the server will save the OAuth tokens to a `token.json` file in the project root.

## MCP Server Usage

The `mcp-server.ts` acts as a JSON-RPC 2.0 over stdio wrapper.

To run the MCP server:

```bash
npm run mcp
```

You can interact with it by piping JSON-RPC requests to its standard input.

### Initialize

```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}' | npm run mcp
```

### List Tools

```bash
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}' | npm run mcp
```

### Call a Tool (Example: `createSpreadsheet`)

```bash
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "createSpreadsheet", "arguments": {"properties": {"title": "My New Spreadsheet"}}}}' | npm run mcp
```

## Tooling

All Google Sheets API operations are exposed as "tools". Each tool consists of:

*   **Tool Definition**: A JSON Schema describing the tool's name, description, and parameters.
*   **Tool Handler**: An Express.js route handler that processes the tool call, makes an HTTP request to the internal Google Sheets API server, and returns the result.

Tool definitions are registered in `src/tools.ts`, and their handlers are routed in `src/api/index.ts`. Individual tool implementations are located in `src/api/tools/`.

## Testing

To run the test suite:

```bash
npm test
```

## Future Enhancements

*   **Multi-User Token Storage:** Implement a robust system for storing and managing Google Sheets API tokens for multiple users, potentially using Firebase (email as unique ID) for authentication and secure token storage.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
