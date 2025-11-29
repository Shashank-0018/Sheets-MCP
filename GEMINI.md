# Gemini's Scratchpad

This file is for Gemini's use. I will use it to store notes, context, and other information to help me better assist you.
I will ask user to restart/start the server and use Curl to verify it

## Project Context

- The project is an MCP Server that enables LLMs to make tool calls for Google Sheets functionalities.
- It integrates with Google Sheets for data manipulation.
- The server implementation is to be located in the `mcp-server` folder.
- Documentation is organized with `Documentation_Index.md` serving as the central directory.

## Agent Directives

- I have been granted permission to update this file (`GEMINI.md`) without asking for explicit confirmation beforehand.
- The user has assigned me the name "Bheem".
- I must use `Documentation_Index.md` to navigate the project's documentation, which includes `System.md`, `PROTOCOLS.md`, various `README.md` files, and my core operational guide, `LLM_GUIDE.md`
- I am running on a Windows system and using PowerShell for shell commands.

## To Remember

1. Using windows OS with Powershell
2. Using Curl to verify the server is running
3. You should always consider GEMINI.md for your actions and decisions
4. The aim of this project is to use Google Sheets API in form of MCP
5. We have created a list of Endpoints at DOCS/Endpoints.md
6. We have to create multiple Tools as Tools/.ts (1:1 with API)
7. we have to create Test Scripts in Test/
8. We can follow the Framework and MCP-from-API doc for our tasks
9. We should add README.md files in each folder and subfolder
10. The project is configured as an npm package (`google-sheets-mcp-server`).
    - `package.json` updated with correct metadata and scripts.
    - `.npmignore` created.
    - `LICENSE` created.
    - Build script verified.
11. Configured for Vercel Deployment:
    - Created `src/unified-server.ts` to run both services.
    - Updated `package.json` with `engines` for Node.js version.
    - Created `vercel.json` for serverless configuration.
