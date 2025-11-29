# Google Sheets MCP Server

This project implements a Model Context Protocol (MCP) server that allows AI assistants (like Gemini, Cursor, Claude) to interact with the Google Sheets API.

**🚀 Now with Multi-User Support & Strong Isolation!**

It follows a two-server architecture:
1.  **Internal Google Sheets API Server** (Port 3001): Handles OAuth2, token management (Supabase), and direct API calls.
2.  **MCP HTTP Server** (Port 3000): Exposes Google Sheets functionalities as MCP tools.

## Key Features

*   **Multi-User Support**: Each user has their own isolated token storage via Supabase.
*   **Auto-Generated MCP Tokens**: Secure tokens generated automatically upon Google OAuth login.
*   **Strict Authentication**: API access requires a valid MCP token; no default fallbacks.
*   **Comprehensive Toolset**: Create, read, update, and manage spreadsheets.

## Architecture Overview

```text
┌───────────────────────┐       ┌───────────────────────┐
│      LLM Client       │       │       Supabase        │
│ (Cursor, Gemini, etc.)│       │   (Token Storage)     │
└───────────┬───────────┘       └───────────▲───────────┘
            │                               │
            │ JSON-RPC / stdio              │
            ▼                               │
┌───────────────────────┐                   │
│  MCP Protocol Wrapper │                   │
└───────────┬───────────┘                   │
            │ HTTP                          │
            ▼                               │
┌───────────────────────┐       ┌───────────▼───────────┐
│   MCP HTTP Server     │──────►│ Internal API Server   │
│     (Port 3000)       │ HTTP  │     (Port 3001)       │
└───────────────────────┘       └───────────┬───────────┘
                                            │
                                            │ Google API
                                            ▼
                                ┌───────────────────────┐
                                │   Google Sheets API   │
                                └───────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js v18+
- Supabase Project
- Google Cloud Project (OAuth Credentials)

### Installation

1.  **Clone and Install:**
    ```bash
    git clone <repo>
    cd google-sheets-mcp-server
    npm install
    ```

2.  **Configure Environment:**
    Create `.env` (see `DOCS/MCP_SETUP.md` for details).

3.  **Setup Database:**
    Run `supabase/schema.sql` in your Supabase SQL Editor.

4.  **Start Servers:**
    ```bash
    npm start
    ```

5.  **Authenticate:**
    Visit `http://localhost:3001/auth/url` to log in and get your **MCP Token**.

6.  **Configure Client:**
    Add the MCP server to your client config with the generated `MCP_TOKEN`.

👉 **[Detailed Setup Guide](DOCS/MCP_SETUP.md)**

## Documentation

- **[System Architecture](System.md)**: Deep dive into the design.
- **[Setup Guide](DOCS/MCP_SETUP.md)**: Step-by-step installation.
- **[Usage Guide](DOCS/MCP_USAGE_GUIDE.md)**: How to use the tools.
- **[Token Flow](DOCS/MCP_TOKEN_FLOW.md)**: Understanding authentication.
- **[Auto-Generated Tokens](DOCS/Auto_Generated_MCP_Tokens.md)**: Details on the token system.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
