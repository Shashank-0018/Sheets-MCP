# MCP Token Flow (Auto-Generated)

This document explains the authentication flow for the Google Sheets MCP Server, which uses auto-generated tokens for security and ease of use.

## The Flow

1.  **Initiation**:
    - User visits `http://localhost:3001/auth/url`.
    - No prior authentication is required.

2.  **Google OAuth**:
    - User logs in with their Google account.
    - Grants permissions to the app.

3.  **Token Generation (Server-Side)**:
    - The server receives the OAuth callback.
    - It extracts the user's email (e.g., `user@example.com`).
    - It generates a **secure, random MCP Token** (e.g., `mcp_a1b2c3...`).
    - It hashes this token and stores it in the `mcp_users` table, linked to the user's email.
    - It stores the Google OAuth tokens in the `google_oauth_tokens` table.

4.  **Token Delivery**:
    - The server displays the **MCP Token** to the user in the browser.
    - **Important:** This is the only time the raw token is shown.

5.  **Usage**:
    - The user configures their MCP client (Cursor, Gemini) with this `MCP_TOKEN`.
    - Every request from the client includes `Authorization: Bearer <MCP_TOKEN>`.

6.  **Verification**:
    - The server receives a request.
    - It hashes the provided token.
    - It looks up the hash in `mcp_users` to find the `user_id`.
    - It uses the `user_id` to retrieve the correct Google OAuth credentials.
    - The request proceeds with the user's identity.

## Diagram

```text
User Browser          MCP Server (Port 3001)          Supabase DB
     │                          │                          │
     │ 1. Request Auth URL      │                          │
     │─────────────────────────►│                          │
     │                          │                          │
     │ 2. Redirect to Google    │                          │
     │◄─────────────────────────│                          │
     │                          │                          │
     │ ... Google Login ...     │                          │
     │                          │                          │
     │ 3. Callback (Code)       │                          │
     │─────────────────────────►│                          │
     │                          │ 4. Generate Token        │
     │                          │ 5. Hash & Store ────────►│ Store (Hash, UserID)
     │                          │                          │ Store (UserID, OAuth)
     │ 6. Display Token         │                          │
     │◄─────────────────────────│                          │
     │                          │                          │
```
