# The Complete Guide: Converting Any API into an MCP Server

This comprehensive guide will walk you through the entire process of converting any REST API into a Model Context Protocol (MCP) Server. This document is based on real-world implementation experience creating a production-ready MCP server with API endpoints.

## Table of Contents

1. [Understanding MCP Architecture](#understanding-mcp-architecture)
2. [Prerequisites](#prerequisites)
3. [Project Planning](#project-planning)
4. [Project Setup](#project-setup)
5. [Creating Your First Tool](#creating-your-first-tool)
6. [Building the HTTP API Server](#building-the-http-api-server)
7. [Building the MCP Protocol Wrapper](#building-the-mcp-protocol-wrapper)
8. [Testing Your MCP Server](#testing-your-mcp-server)
9. [Deployment](#deployment)
10. [Publishing to npm and MCP Registry](#publishing-to-npm-and-mcp-registry)
11. [CI/CD Automation](#cicd-automation)
12. [Client Configuration](#client-configuration)
13. [Troubleshooting](#troubleshooting)
14. [Best Practices](#best-practices)

---

## Understanding MCP Architecture

### What is MCP?

The Model Context Protocol (MCP) is a standardized protocol that allows AI assistants (like Claude, Gemini, Cursor) to interact with external tools and data sources. It provides a common interface for LLMs to access APIs, databases, and other services.

### Architecture Overview

An MCP server consists of three main components:

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
│                  HTTP API Server                            │
│              (index.ts - Express server)                    │
│  - GET /tools (list all tools)                              │
│  - POST /api/tools/{toolName} (execute tool)                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ API Calls
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              External API (Your Target API)                 │
│           (e.g., your.api, GitHub API, etc.)                │
└─────────────────────────────────────────────────────────────┘
```

### Key Concepts

1. **Tools**: Each API endpoint becomes a "tool" that LLMs can call
2. **Tool Definition**: Describes the tool's name, description, and parameters (JSON Schema)
3. **Tool Handler**: The function that executes the API call and returns data
4. **MCP Protocol**: JSON-RPC 2.0 over stdio (standard input/output)
5. **HTTP Bridge**: The HTTP server provides a REST interface, while the MCP wrapper handles stdio

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** (v20.x or higher recommended)
- **npm** or **yarn** package manager
- **TypeScript** knowledge (basic understanding)
- **Git** for version control
- **A target API** to convert (REST API with documentation)
- **Text Editor/IDE** (VS Code recommended)

### Required npm Packages

```bash
npm install express axios body-parser
npm install --save-dev typescript ts-node @types/node @types/express @types/body-parser
```

---

## Project Planning

### Step 1: Analyze Your API

Before writing code, analyze your target API:

1. **List all endpoints** you want to expose
2. **Identify parameter types** (strings, numbers, IDs, etc.)
3. **Document response formats**
4. **Note authentication requirements** (API keys, OAuth, etc.)
5. **Check rate limits** and usage constraints

### Example: API Analysis

For a hypothetical "Weather API":

```text
GET /weather/{city}          → Get weather by city name
GET /weather/forecast/{city} → Get forecast by city name
GET /weather/history/{city}  → Get historical data by city
```

Parameters:

- `city`: string (required)
- `days`: number (optional, for forecast)

### Step 2: Design Tool Names

Convert API endpoints to tool names following this pattern:

**Pattern**: `{action}{Resource}{ByIdentifier}`

Examples:

- `GET /users/{id}` → `getUserById`
- `POST /posts` → `createPost`
- `PUT /users/{id}` → `updateUserById`
- `DELETE /posts/{id}` → `deletePostById`

**Naming Guidelines**:

- Use camelCase
- Start with verb (get, create, update, delete)
- Be descriptive and clear
- Keep names under 50 characters

### Step 3: Map Endpoints to Tools

Create a spreadsheet or document mapping:

| API Endpoint | HTTP Method | Tool Name | Parameters | Description |
|-------------|-------------|-----------|------------|-------------|
| `/Resource/{name}` | GET | `getResourceByName` | `name: string` | Get Resource data |
| `/Resource/{id}` | GET | `getResourceById` | `id: number` | Get Resource by ID |

---

## Project Setup

### Step 1: Initialize Project

```bash
mkdir my-api-mcp-server
cd my-api-mcp-server
npm init -y
```

### Step 2: Install Dependencies

```bash
npm install express axios body-parser
npm install --save-dev typescript ts-node @types/node @types/express @types/body-parser
```

### Step 3: Create TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 4: Create Project Structure

```text
my-api-mcp-server/
├── src/
│   ├── index.ts              # HTTP API server
│   ├── mcp-server.ts         # MCP protocol wrapper
│   ├── tools.ts               # Tool registry (exports all tools)
│   ├── api/
│   │   ├── index.ts          # API routes
│   │   └── tools/             # Individual tool implementations
│   │       ├── getXxx.ts
│   │       ├── getYyy.ts
│   │       └── ...
│   └── testAllTools.ts        # Test suite
├── .cursor/
│   └── mcp.json              # Cursor configuration
├── .gemini/
│   └── settings.json         # Gemini CLI configuration
├── package.json
├── tsconfig.json
├── server.json               # MCP Registry configuration
└── README.md
```

### Step 5: Update package.json

Add these scripts to `package.json`:

```json
{
  "name": "my-api-mcp-server",
  "version": "1.0.0",
  "main": "index.js",
  "bin": {
    "my-api-mcp-server": "./dist/mcp-server.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "mcp": "ts-node src/mcp-server.ts",
    "testAllTools": "ts-node src/testAllTools.ts"
  },
  "files": [
    "dist",
    "package.json",
    "README.md"
  ]
}
```

---

## Creating Your First Tool

### Tool Structure

Each tool consists of two parts:

1. **Tool Definition**: JSON Schema describing the tool
2. **Tool Handler**: Function that executes the API call

### Example: Basic Tool Template

Create `src/api/tools/getXxx.ts`:

```typescript
import { Request, Response } from 'express';
import axios from 'axios';

// Tool Definition (JSON Schema)
export const getXxxTool = {
  name: 'getXxx',  // Tool name (camelCase)
  description: 'Clear description of what this tool does.',  // Important for LLMs
  parameters: {
    type: 'object',
    properties: {
      // Define parameters here
      param1: {
        type: 'string',  // or 'number', 'boolean', 'array', 'object'
        description: 'Description of parameter1',
      },
      param2: {
        type: 'number',
        description: 'Description of parameter2',
      },
    },
    required: ['param1'],  // Required parameters
  },
};

// Tool Handler (executes the API call)
export const getXxxHandler = async (req: Request, res: Response) => {
  const { param1, param2 } = req.body;

  // Validate required parameters
  if (!param1) {
    return res.status(400).json({ error: 'Missing required parameter: param1' });
  }

  try {
    // Make API call to your target API
    const apiUrl = `https://api.example.com/endpoint/${param1}`;
    const response = await axios.get(apiUrl, {
      // Add headers if needed (API keys, auth tokens, etc.)
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json',
      },
      // Add query parameters if needed
      params: {
        param2: param2,
      },
    });

    // Return the API response
    res.json(response.data);
  } catch (error: any) {
    // Handle errors gracefully
    if (error.response) {
      // API returned error
      res.status(error.response.status).json({
        error: error.response.data?.message || 'API request failed',
      });
    } else {
      // Network or other error
      res.status(500).json({ error: 'Failed to fetch data from API' });
    }
  }
};
```

### Real-World Example: getResourceByName

```typescript
import { Request, Response } from 'express';
import axios from 'axios';

export const getResourceByNameTool = {
  name: 'getResourceByName',
  description: 'Get information about a Resource by its name.',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the Resource.',
      },
    },
    required: ['name'],
  },
};

export const getResourceByNameHandler = async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Missing name parameter' });
  }

  try {
    const response = await axios.get(`https://your.api.co/api/v2/Resource/${name}`);
    res.json(response.data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      res.status(404).json({ error: `Resource "${name}" not found` });
    } else {
      res.status(500).json({ error: 'Failed to fetch data from your.api' });
    }
  }
};
```

### Parameter Types Reference

#### String Parameters

```typescript
name: {
  type: 'string',
  description: 'The name of the resource',
  // Optional: add constraints
  minLength: 1,
  maxLength: 100,
  pattern: '^[a-zA-Z0-9]+$',  // Regex pattern
}
```

#### Number Parameters

```typescript
id: {
  type: 'number',
  description: 'The unique identifier',
  // Optional: add constraints
  minimum: 1,
  maximum: 1000,
}
```

#### Boolean Parameters

```typescript
includeDetails: {
  type: 'boolean',
  description: 'Whether to include additional details',
  default: false,
}
```

#### Array Parameters

```typescript
tags: {
  type: 'array',
  description: 'List of tags',
  items: {
    type: 'string',
  },
  minItems: 1,
  maxItems: 10,
}
```

#### Object Parameters

```typescript
filters: {
  type: 'object',
  description: 'Filter criteria',
  properties: {
    minPrice: { type: 'number' },
    maxPrice: { type: 'number' },
    category: { type: 'string' },
  },
}
```

#### Optional Parameters

```typescript
// In parameters.required array, omit optional parameters
parameters: {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Required parameter' },
    limit: { type: 'number', description: 'Optional limit' },
  },
  required: ['name'],  // Only 'name' is required
}
```

### Handling Different HTTP Methods

#### GET Request

```typescript
const response = await axios.get(`https://api.example.com/resource/${id}`, {
  params: { query: 'value' },  // Query parameters
});
```

#### POST Request

```typescript
const response = await axios.post(
  'https://api.example.com/resource',
  { data: 'value' },  // Request body
  { headers: { 'Content-Type': 'application/json' } }
);
```

#### PUT Request

```typescript
const response = await axios.put(
  `https://api.example.com/resource/${id}`,
  { data: 'updated value' }
);
```

#### DELETE Request

```typescript
const response = await axios.delete(`https://api.example.com/resource/${id}`);
```

### Authentication Examples

#### API Key in Header

```typescript
const response = await axios.get(url, {
  headers: {
    'X-API-Key': process.env.API_KEY,
  },
});
```

#### Bearer Token

```typescript
const response = await axios.get(url, {
  headers: {
    'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
  },
});
```

#### Basic Authentication

```typescript
const response = await axios.get(url, {
  auth: {
    username: process.env.API_USERNAME,
    password: process.env.API_PASSWORD,
  },
});
```

---

## Building the HTTP API Server

### Step 1: Create the Main Server

Create `src/index.ts`:

```typescript
import express from 'express';
import bodyParser from 'body-parser';
import { tools } from './tools';
import apiRouter from './api';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MCP Server is running!',
    version: '1.0.0',
  });
});

// List all available tools
app.get('/tools', (req, res) => {
  res.json(tools);
});

// API routes
app.use('/api', apiRouter);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

### Step 2: Create Tool Registry

Create `src/tools.ts`:

```typescript
// Import all tool definitions
import { getXxxTool } from './api/tools/getXxx';
import { getYyyTool } from './api/tools/getYyy';
// ... import all other tools

// Export array of all tools
export const tools = [
  getXxxTool,
  getYyyTool,
  // ... add all other tools
];
```

### Step 3: Create API Routes

Create `src/api/index.ts`:

```typescript
import express from 'express';
import { getXxxHandler } from './tools/getXxx';
import { getYyyHandler } from './tools/getYyy';
// ... import all other handlers

const router = express.Router();

// Register routes for each tool
router.post('/tools/getXxx', getXxxHandler);
router.post('/tools/getYyy', getYyyHandler);
// ... register all other tools

export default router;
```

**Important**: The route pattern is `/api/tools/{toolName}` where `toolName` matches the tool's `name` property.

### Step 4: Test the HTTP Server

Start the server:

```bash
npm run dev
```

Test an endpoint:

```bash
# List all tools
curl http://localhost:3000/tools

# Call a tool
curl -X POST http://localhost:3000/api/tools/getXxx \
  -H "Content-Type: application/json" \
  -d '{"param1": "value"}'
```

---

## Building the MCP Protocol Wrapper

The MCP wrapper communicates with LLM clients via stdio using JSON-RPC 2.0.

### Step 1: Create MCP Server

Create `src/mcp-server.ts`:

```typescript
#!/usr/bin/env node

/**
 * MCP Server wrapper that implements the Model Context Protocol
 * This server communicates via stdio and forwards tool calls to the HTTP API server
 */

import * as readline from 'readline';
import axios from 'axios';

const HTTP_SERVER_URL = process.env.MCP_HTTP_SERVER_URL || 'http://localhost:3000';

interface MCPRequest {
  jsonrpc: '2.0';
  id?: number | string | null;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class MCPServer {
  private requestId: number = 1;
  private initialized: boolean = false;

  async handleRequest(request: MCPRequest): Promise<MCPResponse | null> {
    const isNotification = request.id === undefined || request.id === null;
    
    try {
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request);
        case 'tools/list':
          return await this.listTools(request);
        case 'tools/call':
          return await this.callTool(request);
        default:
          if (isNotification) return null;
          return {
            jsonrpc: '2.0',
            id: request.id!,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          };
      }
    } catch (error: any) {
      if (isNotification) return null;
      return {
        jsonrpc: '2.0',
        id: request.id!,
        error: {
          code: -32603,
          message: error.message || 'Internal error',
        },
      };
    }
  }

  private handleInitialize(request: MCPRequest): MCPResponse {
    if (this.initialized) {
      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        error: {
          code: -32000,
          message: 'Server already initialized',
        },
      };
    }
    
    this.initialized = true;
    const initResponse: MCPResponse = {
      jsonrpc: '2.0',
      id: request.id ?? null,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'my-api-mcp-server',
          version: '1.0.0',
        },
      },
    };
    
    // Send initialized notification
    setTimeout(() => {
      const notification = {
        jsonrpc: '2.0' as const,
        method: 'notifications/initialized',
        params: {},
      };
      process.stdout.write(JSON.stringify(notification) + '\n');
    }, 0);
    
    return initResponse;
  }

  private async listTools(request: MCPRequest): Promise<MCPResponse | null> {
    if (request.id === undefined || request.id === null) {
      return null;
    }
    
    try {
      const response = await axios.get(`${HTTP_SERVER_URL}/tools`);
      const tools = response.data;

      // Convert tools to MCP format
      const mcpTools = tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.parameters,
      }));

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: mcpTools,
        },
      };
    } catch (error: any) {
      return {
        jsonrpc: '2.0',
        id: request.id!,
        error: {
          code: -32603,
          message: `Failed to fetch tools: ${error.message}`,
        },
      };
    }
  }

  private async callTool(request: MCPRequest): Promise<MCPResponse | null> {
    if (request.id === undefined || request.id === null) {
      return null;
    }
    
    try {
      const { name, arguments: args } = request.params || {};
      
      if (!name) {
        return {
          jsonrpc: '2.0',
          id: request.id!,
          error: {
            code: -32602,
            message: 'Tool name is required',
          },
        };
      }

      // Call the HTTP API endpoint
      const response = await axios.post(
        `${HTTP_SERVER_URL}/api/tools/${name}`,
        args || {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        jsonrpc: '2.0',
        id: request.id!,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        },
      };
    } catch (error: any) {
      return {
        jsonrpc: '2.0',
        id: request.id!,
        error: {
          code: -32603,
          message: `Tool call failed: ${error.response?.data?.error || error.message}`,
        },
      };
    }
  }

  async start() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
      terminal: false,
    });

    rl.on('line', async (line) => {
      if (!line.trim()) return;

      let requestId: number | string | null = null;
      
      try {
        const rawRequest = JSON.parse(line);
        requestId = rawRequest.id || null;
        
        const request: MCPRequest = rawRequest;
        
        if (!request.jsonrpc || !request.method) {
          throw new Error('Missing required fields: jsonrpc or method');
        }
        
        const response = await this.handleRequest(request);
        if (response !== null) {
          process.stdout.write(JSON.stringify(response) + '\n');
        }
      } catch (error: any) {
        if (requestId === null) {
          try {
            const rawRequest = JSON.parse(line);
            requestId = rawRequest.id || null;
          } catch {
            return;
          }
        }
        
        if (requestId !== null) {
          const errorResponse: MCPResponse = {
            jsonrpc: '2.0',
            id: requestId,
            error: {
              code: -32700,
              message: `Parse error: ${error.message}`,
            },
          };
          process.stdout.write(JSON.stringify(errorResponse) + '\n');
        }
      }
    });

    process.on('SIGINT', () => {
      rl.close();
      process.exit(0);
    });
  }
}

// Verify HTTP server is accessible
async function verifyHTTPServer() {
  try {
    const response = await axios.get(`${HTTP_SERVER_URL}/tools`, { timeout: 2000 });
    return true;
  } catch (error) {
    process.stderr.write(
      `\n⚠️  WARNING: HTTP server at ${HTTP_SERVER_URL} is not accessible.\n` +
      `   Please start it with: npm start\n` +
      `   The MCP server will continue but tool calls will fail.\n\n`
    );
    return false;
  }
}

// Start the server
const server = new MCPServer();
verifyHTTPServer().then(() => {
  server.start().catch((error) => {
    process.stderr.write(`Failed to start MCP server: ${error.message}\n`);
    process.exit(1);
  });
});
```

### Step 2: Make it Executable

Add to `package.json`:

```json
{
  "bin": {
    "my-api-mcp-server": "./dist/mcp-server.js"
  }
}
```

Add shebang to `mcp-server.ts`:

```typescript
#!/usr/bin/env node
```

### Step 3: Test MCP Server

```bash
# Build first
npm run build

# Test MCP server
npm run mcp
```

You should see the server start without errors.

---

## Testing Your MCP Server

### Step 1: Create Test Suite

Create `src/testAllTools.ts`:

```typescript
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { tools } from './tools';

interface TestResult {
  toolName: string;
  status: 'PASSED' | 'FAILED';
  error?: string;
}

async function testAllTools() {
  // Test data for each tool
  const testData: { [key: string]: any } = {
    'getXxxTool': { param1: 'test-value' },
    'getYyyTool': { param2: 123 },
    // ... add test data for all tools
  };

  const results: TestResult[] = [];
  const HTTP_SERVER_URL = process.env.MCP_HTTP_SERVER_URL || 'http://localhost:3000';
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  async function testToolWithRetry(
    toolName: string,
    url: string,
    data: any,
    retries = MAX_RETRIES
  ): Promise<TestResult> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.post(url, data, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        });

        if (response.status === 200) {
          return { toolName, status: 'PASSED' };
        } else {
          return { toolName, status: 'FAILED', error: `Status: ${response.status}` };
        }
      } catch (error: any) {
        const isServerError = error.response?.status === 502 || 
                             error.response?.status === 503 || 
                             error.response?.status === 504;
        const isTimeout = error.code === 'ECONNABORTED';
        
        if ((isServerError || isTimeout) && attempt < retries) {
          console.log(`  ⚠️  ${toolName} failed (attempt ${attempt}/${retries}): ${error.response?.status || error.code}. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
          continue;
        }
        
        const errorMsg = error.response?.status 
          ? `Request failed with status code ${error.response.status}`
          : error.message;
        return { toolName, status: 'FAILED', error: errorMsg };
      }
    }
    return { toolName, status: 'FAILED', error: 'Max retries exceeded' };
  }

  for (const tool of tools) {
    const toolName = tool.name;
    const toolNameWithSuffix = `${toolName}Tool`;
    const url = `${HTTP_SERVER_URL}/api/tools/${toolName}`;
    const data: any = testData[toolNameWithSuffix];

    const result = await testToolWithRetry(toolName, url, data);
    results.push(result);
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
  }

  // Generate summary
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const failedTools = results.filter(r => r.status === 'FAILED');

  console.log('\n=== Test Results Summary ===');
  console.log(`Total Tools: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failedTools.length > 0) {
    console.log('\nFailed Tools:');
    failedTools.forEach(tool => {
      console.log(`  - ${tool.toolName}${tool.error ? ` (${tool.error})` : ''}`);
    });
  } else {
    console.log('\n✓ All tools passed!');
  }

  // Generate CSV
  const csvPath = path.join(process.cwd(), 'test-results.csv');
  const csvHeader = 'Tool Name,Status,Error\n';
  const csvRows = results.map(r => {
    const error = r.error ? `"${r.error.replace(/"/g, '""')}"` : '';
    return `${r.toolName},${r.status},${error}`;
  }).join('\n');
  const csvContent = csvHeader + csvRows;
  
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`\nResults saved to: ${csvPath}`);
}

testAllTools();
```

### Step 2: Run Tests

```bash
npm run testAllTools
```

---

## Deployment

### Option 1: Deploy to Render.com

Create `render.yaml`:

```yaml
services:
  - type: web
    name: my-api-mcp-server
    env: node
    buildCommand: npm install && npm run build
    startCommand: node dist/index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: API_KEY
        sync: false  # Set this in Render dashboard
```

### Option 2: Deploy to Other Platforms

#### Heroku

Create `Procfile`:

```bash
web: node dist/index.js
```

#### Vercel

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ]
}
```

---

## Publishing to npm and MCP Registry

### Step 1: Prepare package.json

Ensure your `package.json` includes:

```json
{
  "name": "my-api-mcp-server",
  "version": "1.0.0",
  "mcpName": "io.github.yourusername/my-api-mcp-server",
  "description": "MCP Server for Your API",
  "main": "index.js",
  "bin": {
    "my-api-mcp-server": "./dist/mcp-server.js"
  },
  "files": [
    "dist",
    "package.json",
    "README.md"
  ],
  "keywords": ["mcp", "api", "tools"],
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/my-api-mcp-server.git"
  }
}
```

### Step 2: Create server.json

Create `server.json` for MCP Registry:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-10-17/server.schema.json",
  "name": "io.github.yourusername/my-api-mcp-server",
  "description": "MCP Server for Your API",
  "version": "1.0.0",
  "repository": {
    "url": "https://github.com/yourusername/my-api-mcp-server",
    "source": "github"
  },
  "packages": [
    {
      "registryType": "npm",
      "identifier": "my-api-mcp-server",
      "version": "1.0.0",
      "transport": {
        "type": "stdio"
      }
    }
  ]
}
```

### Step 3: Publish to npm

```bash
# Build first
npm run build

# Publish
npm publish
```

### Step 4: Publish to MCP Registry

- Download MCP Publisher:

  ```bash
  curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher
  ```

- Login:

  ```bash
  ./mcp-publisher login github-oidc
  ```

- Publish:

  ```bash
  ./mcp-publisher publish
  ```

---

## CI/CD Automation

### GitHub Actions Workflow

Create `.github/workflows/publish-mcp.yml`:

```yaml
name: Publish to MCP Registry

on:
  push:
    tags:
      - "v*"

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    env:
      NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

    steps:
      - uses: actions/checkout@v5
      
      - uses: actions/setup-node@v5
        with:
          node-version: "lts/*"
          registry-url: "https://registry.npmjs.org"

      - run: npm ci
      - run: npm run build
      
      - name: Update versions from tag
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          npm version $VERSION --no-git-tag-version
          # Update server.json version

      - run: npm publish
      
      - name: Install MCP Publisher
        run: |
          curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher

      - name: Login to MCP Registry
        run: ./mcp-publisher login github-oidc

      - name: Publish to MCP Registry
        run: ./mcp-publisher publish
```

### Auto-Tagging Workflow

Create `.github/workflows/auto-tag.yml`:

```yaml
name: Auto Tag and Publish

on:
  push:
    branches:
      - main

jobs:
  create-tag:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      - name: Calculate next version
        id: next-version
        run: |
          git fetch --tags
          LATEST_TAG=$(git tag -l "v1.*.*" | sort -V | tail -n 1)
          
          if [ -z "$LATEST_TAG" ]; then
            NEXT_MINOR=5
          else
            MINOR=$(echo "$LATEST_TAG" | sed -E 's/v1\.([0-9]+)\..*/\1/')
            if [ "$MINOR" -lt 5 ]; then
              NEXT_MINOR=5
            else
              NEXT_MINOR=$((MINOR + 1))
            fi
          fi
          
          NEXT_VERSION="v1.$NEXT_MINOR.0"
          echo "next_version=$NEXT_VERSION" >> $GITHUB_OUTPUT

      - name: Create and push tag
        run: |
          NEXT_VERSION="${{ steps.next-version.outputs.next_version }}"
          git tag "$NEXT_VERSION"
          git push origin "$NEXT_VERSION"
```

---

## Client Configuration

### Cursor IDE

Create `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-api-mcp-server": {
      "command": "npx",
      "args": ["--yes", "my-api-mcp-server@latest"]
    }
  }
}
```

### Gemini CLI

Create `.gemini/settings.json`:

```json
{
  "mcpServers": {
    "my-api-mcp-server": {
      "command": "npx",
      "args": ["--yes", "my-api-mcp-server@latest"],
      "transport": "stdio",
      "trust": true,
      "env": {
        "MCP_HTTP_SERVER_URL": "https://your-server-url.com"
      }
    }
  }
}
```

### Claude Desktop

Edit `Claude>claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-api-mcp-server": {
      "command": "npx",
      "args": ["--yes", "my-api-mcp-server@latest"]
    }
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. MCP Server Not Connecting

**Symptoms**: Client shows "disconnected" status

**Solutions**:

- Verify HTTP server is running: `curl http://localhost:3000/tools`
- Check MCP_HTTP_SERVER_URL environment variable
- Ensure server.json path is correct
- Restart the client application

#### 2. Tools Not Loading

**Symptoms**: Tools list is empty

**Solutions**:

- Check `/tools` endpoint returns valid JSON
- Verify tool definitions have correct structure
- Check MCP server logs for errors
- Ensure HTTP server is accessible from MCP wrapper

#### 3. Tool Calls Failing

**Symptoms**: "Tool call failed" errors

**Solutions**:

- Check API endpoint is correct
- Verify authentication (API keys, tokens)
- Check network connectivity
- Review error logs in HTTP server
- Test API endpoint directly with curl

#### 4. TypeScript Compilation Errors

**Symptoms**: Build fails

**Solutions**:

- Ensure all dependencies are installed
- Check tsconfig.json is correct
- Verify all imports are correct
- Run `npm run build` to see detailed errors

---

## Best Practices

### 1. Tool Naming

- Use descriptive, consistent naming
- Follow camelCase convention
- Start with action verb (get, create, update, delete)
- Be specific about what the tool does

### 2. Error Handling

- Always validate input parameters
- Provide clear error messages
- Handle API errors gracefully
- Log errors for debugging

### 3. Documentation

- Write clear tool descriptions (LLMs read these!)
- Document all parameters
- Include examples in README
- Keep descriptions concise but informative

### 4. Performance

- Add rate limiting if needed
- Implement caching for frequently accessed data
- Use timeouts for API calls
- Handle concurrent requests properly

### 5. Security

- Never expose API keys in code
- Use environment variables for secrets
- Validate all user inputs
- Implement proper authentication

### 6. Testing

- Test each tool individually
- Create comprehensive test suite
- Test error cases
- Test with real API data

### 7. Versioning

- Follow semantic versioning
- Update version in package.json and server.json
- Tag releases properly
- Document breaking changes

---

## Quick Reference Checklist

Use this checklist when creating your MCP server:

- [ ] Analyze API and list all endpoints
- [ ] Design tool names following conventions
- [ ] Set up project structure
- [ ] Install dependencies
- [ ] Create TypeScript configuration
- [ ] Create first tool (definition + handler)
- [ ] Register tool in tools.ts
- [ ] Add route in api/index.ts
- [ ] Test HTTP server locally
- [ ] Create MCP wrapper
- [ ] Test MCP server
- [ ] Create test suite
- [ ] Deploy HTTP server
- [ ] Update server.json with deployment URL
- [ ] Publish to npm
- [ ] Publish to MCP Registry
- [ ] Set up CI/CD
- [ ] Configure client applications
- [ ] Write documentation
- [ ] Test end-to-end

---

## Conclusion

You now have a complete guide to convert any API into an MCP server. The process follows these key steps:

1. **Plan**: Analyze your API and design tool structure
2. **Build**: Create tools, HTTP server, and MCP wrapper
3. **Test**: Verify everything works correctly
4. **Deploy**: Publish to npm and MCP Registry
5. **Automate**: Set up CI/CD for continuous deployment

Remember: The goal is to make APIs accessible to AI assistants in a standardized way. Focus on clear descriptions, proper error handling, and good documentation.

Happy building! 🚀
