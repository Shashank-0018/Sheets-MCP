# System Design Document: Google Sheets MCP Server

## 1. System Overview

The Google Sheets Model Context Protocol (MCP) Server enables AI assistants to programmatically interact with Google Sheets. It acts as an intermediary, translating MCP JSON-RPC requests from LLM clients into Google Sheets API calls. The system is designed with a clear separation of concerns, utilizing a two-tier server architecture and **Supabase** for secure, multi-user token management.

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
*   **Purpose:** Entry point for LLM clients (JSON-RPC over stdio).
*   **Responsibilities:** Parses requests, forwards them to the HTTP server, and formats responses.

### 3.2. Main MCP HTTP Server (`src/index.ts`)
*   **Purpose:** RESTful interface for tool management.
*   **Responsibilities:**
    *   Exposes `/tools` and `/api/tools/{toolName}`.
    *   **Authentication:** Enforces Bearer token auth using `mcpAuthMiddleware`.
    *   **User Resolution:** Resolves MCP tokens to `userId` using Supabase.
    *   Forwards requests to the Internal API Server with `X-User-Id` header.

### 3.3. Internal Google Sheets API Server (`src/google-sheets-api-server.ts`)
*   **Purpose:** Direct interaction with Google Sheets API.
*   **Responsibilities:**
    *   **OAuth2 Management:** Handles Google OAuth flow.
    *   **Token Storage:** Stores/retrieves tokens in **Supabase** (`google_oauth_tokens` table).
    *   **Authorization:** Uses `userId` (from header) to load the correct user's OAuth token.
    *   **API Execution:** Calls Google Sheets API methods.

### 3.4. Supabase (Database)
*   **Purpose:** Persistent, secure storage for users and tokens.
*   **Tables:**
    *   `mcp_users`: Maps `mcp_token_hash` to `user_id`.
    *   `google_oauth_tokens`: Stores encrypted Google OAuth tokens per `user_id`.

## 4. Data Flow (Tool Call)

1.  **LLM Client** sends JSON-RPC request (`tools/call`) to Wrapper.
2.  **Wrapper** sends HTTP POST to Main Server (`/api/tools/...`) with `Authorization: Bearer <MCP_TOKEN>`.
3.  **Main Server** middleware:
    *   Hashes `MCP_TOKEN`.
    *   Lookups `userId` in Supabase `mcp_users`.
    *   If valid, attaches `userId` to request.
4.  **Tool Handler** sends HTTP request to Internal Server with `X-User-Id: <userId>`.
5.  **Internal Server**:
    *   Extracts `userId`.
    *   Loads Google OAuth token from Supabase `google_oauth_tokens` for that user.
    *   Refreshes token if needed.
    *   Calls Google Sheets API.
6.  **Response** propagates back up the chain.

## 5. Authentication Flow

1.  **User** visits `http://localhost:3001/auth/url`.
2.  **User** logs in with Google.
3.  **Callback** (`/callback`) is triggered.
4.  **Server**:
    *   Exchanges code for Google tokens.
    *   Gets user email.
    *   **Auto-Generates** a secure MCP Token.
    *   Hashes MCP Token.
    *   Creates/Updates `mcp_users` record.
    *   Stores Google tokens in `google_oauth_tokens`.
5.  **User** is shown the **MCP Token** to use in their client.

## 6. Security

*   **Isolation:** Each user's tokens are logically isolated in the database.
*   **Encryption:** Google tokens should be encrypted at rest (Supabase handles this if configured, or app-level encryption).
*   **Hashing:** MCP tokens are hashed before storage; raw tokens are never stored.
*   **Strict Auth:** No default users; every request requires valid authentication.
