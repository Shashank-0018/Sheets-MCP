# System Design Document: Google Sheets MCP Server

## 1. System Overview

The Google Sheets Model Context Protocol (MCP) Server enables AI assistants to programmatically interact with Google Sheets. It acts as an intermediary, translating MCP JSON-RPC requests from LLM clients into Google Sheets API calls. The system is designed with a clear separation of concerns, utilizing a two-tier server architecture to manage API interactions and protocol handling efficiently.

## 2. Architectural Diagram

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

## 3. Component Breakdown

### 3.1. MCP Protocol Wrapper (`src/mcp-server.ts`)

*   **Purpose:** The entry point for LLM clients, responsible for implementing the JSON-RPC 2.0 over stdio protocol.
*   **Technology:** Node.js, `readline` module for stdio, `axios` for HTTP communication.
*   **Key Responsibilities:**
    *   Parses incoming JSON-RPC requests from `stdin`.
    *   Handles core MCP methods: `initialize`, `tools/list`, `tools/call`.
    *   For `initialize`, it sends server capabilities and an `initialized` notification.
    *   For `tools/list`, it makes an HTTP GET request to the `Main MCP HTTP Server`'s `/tools` endpoint.
    *   For `tools/call`, it makes an HTTP POST request to the `Main MCP HTTP Server`'s `/api/tools/{toolName}` endpoint, passing the tool arguments in the request body.
    *   Formats responses according to the JSON-RPC 2.0 specification and writes them to `stdout`.
    *   Includes a mechanism to verify the accessibility of the `Main MCP HTTP Server` at startup.

### 3.2. Main MCP HTTP Server (`src/index.ts`)

*   **Purpose:** Exposes a RESTful HTTP interface for tool management and execution, acting as a bridge between the MCP wrapper and the actual tool implementations.
*   **Technology:** Express.js.
*   **Key Responsibilities:**
    *   Provides a health check endpoint (`/`).
    *   Exposes a `/tools` endpoint (GET) that returns a JSON array of all available tool definitions. This list is compiled from `src/tools.ts`.
    *   Exposes dynamic `/api/tools/{toolName}` endpoints (POST) for each tool.
    *   Each tool endpoint receives parameters from the MCP wrapper, validates them, and then makes an HTTP request to the `Internal Google Sheets API Server` to perform the actual Google Sheets API operation.
    *   Handles errors from tool execution and returns appropriate HTTP status codes and error messages.

### 3.3. Internal Google Sheets API Server (`src/google-sheets-api-server.ts`)

*   **Purpose:** Encapsulates all direct interactions with the Google Sheets API, including OAuth2 authentication and token management. This server isolates the sensitive Google API credentials and OAuth flow from the external-facing MCP components.
*   **Technology:** Express.js, `googleapis` library, `google-auth-library`.
*   **Key Responsibilities:**
    *   Manages OAuth2 authorization flow, including generating authorization URLs and handling callbacks.
    *   Stores and retrieves OAuth tokens (access and refresh tokens) in `token.json` (for single-user/development setup).
    *   Provides a `authorize()` function that ensures a valid `OAuth2Client` instance is available for Google API calls.
    *   Exposes RESTful endpoints that directly map to Google Sheets API operations (e.g., `/spreadsheets`, `/spreadsheets/:spreadsheetId/values/:range/append`).
    *   Each endpoint calls the corresponding method in the `googleapis` library using the authorized `OAuth2Client`.
    *   Handles Google API-specific errors and propagates them back to the `Main MCP HTTP Server`.

## 4. Data Flow

### 4.1. Tool Listing Flow

1.  **LLM Client** sends `{"method": "tools/list"}` JSON-RPC request to `MCP Protocol Wrapper` via `stdin`.
2.  **MCP Protocol Wrapper** receives the request and makes an HTTP GET request to `http://localhost:3000/tools`.
3.  **Main MCP HTTP Server** receives the GET request, retrieves the list of tool definitions from `src/tools.ts`, and returns them as a JSON array.
4.  **MCP Protocol Wrapper** receives the tool list, formats it into an MCP `tools/list` response, and sends it back to the `LLM Client` via `stdout`.

### 4.2. Tool Calling Flow

1.  **LLM Client** sends `{"method": "tools/call", "params": {"name": "toolName", "arguments": {...}}}` JSON-RPC request to `MCP Protocol Wrapper` via `stdin`.
2.  **MCP Protocol Wrapper** receives the request and makes an HTTP POST request to `http://localhost:3000/api/tools/toolName`, with the `arguments` as the request body.
3.  **Main MCP HTTP Server** receives the POST request, identifies the `toolName`, and dispatches it to the corresponding tool handler (e.g., `createSpreadsheetHandler`).
4.  **Tool Handler** (e.g., `createSpreadsheetHandler`) constructs an HTTP request to the `Internal Google Sheets API Server` (e.g., `http://localhost:3001/spreadsheets`), passing the necessary parameters.
5.  **Internal Google Sheets API Server** receives the request, uses its authorized `OAuth2Client` to make the actual call to the Google Sheets API.
6.  **Google Sheets API** processes the request and returns a response.
7.  **Internal Google Sheets API Server** sends the Google API response back to the `Main MCP HTTP Server`.
8.  **Main MCP HTTP Server** sends the response back to the `MCP Protocol Wrapper`.
9.  **MCP Protocol Wrapper** formats the response into an MCP `tools/call` result and sends it back to the `LLM Client` via `stdout`.

## 5. Authentication Flow (OAuth2 for Google Sheets API)

1.  **Initial State:** The `Internal Google Sheets API Server` starts without a valid `token.json` file.
2.  **Authorization Request:** An external client (or manual intervention) requests the OAuth URL from `http://localhost:3001/auth/url`.
3.  **User Consent:** The user opens the provided URL in a browser, logs into their Google account, and grants permission for the application to access their Google Sheets data.
4.  **Callback Handling:** Google redirects the user's browser to `http://localhost:3001/callback` with an authorization code.
5.  **Token Exchange:** The `Internal Google Sheets API Server` intercepts this callback, exchanges the authorization code for access and refresh tokens with Google.
6.  **Token Storage:** The server saves these tokens to `token.json` in the project root.
7.  **Subsequent API Calls:** For all subsequent Google Sheets API calls, the `authorize()` function in the `Internal Google Sheets API Server` loads the tokens from `token.json` and uses them to authenticate requests.

## 6. Error Handling Strategy

*   **Component-Specific Error Handling:** Each component (MCP Wrapper, Main HTTP Server, Internal API Server, Tool Handlers) implements its own try-catch blocks to handle errors relevant to its layer.
*   **Standardized Error Responses:** Errors are transformed into standardized JSON-RPC error objects (for the MCP wrapper) or HTTP error responses (for the HTTP servers), including error codes and messages.
*   **Logging:** Errors are logged to `stderr` (for MCP wrapper) or `console.error` (for HTTP servers) for debugging purposes.
*   **Graceful Degradation:** The MCP wrapper is designed to continue running even if the HTTP server is inaccessible, providing warnings to the user.

## 7. Scalability Considerations

*   **Stateless HTTP Servers:** Both the `Main MCP HTTP Server` and the `Internal Google Sheets API Server` are largely stateless (apart from `token.json` for the internal server in the current single-user setup). This allows for easy horizontal scaling by running multiple instances behind a load balancer.
*   **Token Management:** For a multi-user environment, the `token.json` approach is a bottleneck. A future enhancement involves storing tokens in a centralized, scalable database (e.g., Firebase Firestore) and associating them with individual users, enabling per-user authorization and scaling.
*   **Asynchronous Operations:** The use of `async/await` and `axios` for HTTP requests ensures non-blocking I/O, improving concurrency.
*   **Resource Isolation:** Separating the Google Sheets API interaction into a dedicated internal server helps isolate resource usage and potential bottlenecks.

## 8. Future Enhancements

*   **Multi-User Token Storage:** Implement a robust system for storing and managing Google Sheets API tokens for multiple users, potentially using Firebase (email as unique ID) for authentication and secure token storage.
*   **Rate Limiting:** Implement rate limiting for external API calls to prevent abuse and adhere to Google API quotas.
*   **Configuration Management:** Externalize more configuration parameters (e.g., port numbers, API keys) into environment variables or a dedicated configuration file.
*   **Improved Logging:** Implement a more structured logging solution (e.g., Winston, Pino) for better observability.
*   **Comprehensive Testing:** Expand unit and integration tests to cover all edge cases and error scenarios.
