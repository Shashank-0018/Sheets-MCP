# The Complete MCP Server Conversion Framework

> Technical Design Document | Implementation Guide | Architecture Specification | Developer Handbook | Conversion Blueprint

This comprehensive document serves as a complete reference for converting any REST API into a Model Context Protocol (MCP) Server. Based on production-ready implementation experience with 47+ API endpoints, this framework provides everything needed to build, deploy, and maintain MCP servers.

---

## Document Structure

This document combines five essential perspectives:

1. **Technical Design Document (TDD)** - Design decisions, architecture patterns, and technical specifications
2. **Implementation Guide (IG)** - Step-by-step implementation instructions with code examples
3. **Architecture Specification (Spec Doc)** - Detailed system architecture, protocols, and interfaces
4. **Developer Guide / Handbook** - Developer reference, best practices, and maintenance procedures
5. **Conversion Framework Blueprint** - Reusable framework and patterns for API-to-MCP conversion

---

## Table of Contents

### Part I: Technical Design Document (TDD)

- [1. Executive Summary](#1-executive-summary)
- [2. System Architecture](#2-system-architecture)
- [3. Design Decisions](#3-design-decisions)
- [4. Technical Specifications](#4-technical-specifications)

### Part II: Architecture Specification

- [5. MCP Protocol Specification](#5-mcp-protocol-specification)
- [6. Component Architecture](#6-component-architecture)
- [7. Data Flow & Communication](#7-data-flow--communication)
- [8. Interface Definitions](#8-interface-definitions)

### Part III: Implementation Guide

- [9. Prerequisites & Setup](#9-prerequisites--setup)
- [10. Project Planning](#10-project-planning)
- [11. Project Setup](#11-project-setup)
- [12. Creating Your First Tool](#12-creating-your-first-tool)
- [13. Building the HTTP API Server](#13-building-the-http-api-server)
- [14. Building the MCP Protocol Wrapper](#14-building-the-mcp-protocol-wrapper)
- [15. Testing Your MCP Server](#15-testing-your-mcp-server)
- [16. Deployment](#16-deployment)

### Part IV: Conversion Framework Blueprint

- [17. Conversion Methodology](#17-conversion-methodology)
- [18. Tool Generation Patterns](#18-tool-generation-patterns)
- [19. API Mapping Framework](#19-api-mapping-framework)
- [20. Automation Templates](#20-automation-templates)

### Part V: Developer Handbook

- [21. Publishing to npm and MCP Registry](#21-publishing-to-npm-and-mcp-registry)
- [22. CI/CD Automation](#22-cicd-automation)
- [23. Client Configuration](#23-client-configuration)
- [24. Troubleshooting Guide](#24-troubleshooting-guide)
- [25. Best Practices & Patterns](#25-best-practices--patterns)
- [26. Maintenance & Updates](#26-maintenance--updates)

---

## Part I: Technical Design Document

### 1. Executive Summary

#### 1.1 Purpose

This document defines the technical design for a framework that converts any REST API into a Model Context Protocol (MCP) Server, enabling AI assistants to interact with external APIs through a standardized interface.

#### 1.2 Scope

- Complete conversion methodology from REST API to MCP Server

- Production-ready implementation patterns
- Automated testing and deployment pipelines
- Multi-client support (Cursor, Gemini CLI, Claude Desktop)

#### 1.3 Objectives

- Provide a reusable framework for API-to-MCP conversion
- Ensure standardization across different API implementations
- Enable rapid development and deployment
- Maintain high code quality and reliability

#### 1.4 Key Design Principles

1. **Separation of Concerns**: HTTP API layer separated from MCP protocol layer
2. **Modularity**: Each tool is a self-contained module
3. **Extensibility**: Easy to add new tools without modifying core infrastructure
4. **Reliability**: Comprehensive error handling and retry logic
5. **Developer Experience**: Clear patterns, templates, and documentation

---

### 2. System Architecture

#### 2.1 High-Level Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                         LLM Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Cursor     │  │ Gemini CLI   │  │   Claude     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    JSON-RPC 2.0 over stdio
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                    MCP Protocol Layer                              │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              MCP Server Wrapper (mcp-server.ts)           │    │
│  │  • initialize() - Protocol handshake                     │    │
│  │  • tools/list() - List available tools                   │    │
│  │  • tools/call() - Execute tool calls                    │    │
│  │  • Error handling & validation                           │    │
│  └───────────────────────┬──────────────────────────────────┘    │
└──────────────────────────┼────────────────────────────────────────┘
                           │
                    HTTP/REST Protocol
                           │
┌──────────────────────────▼────────────────────────────────────────┐
│                    HTTP API Server Layer                           │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Express Server (index.ts)                     │    │
│  │  • GET /tools - List all tools                            │    │
│  │  • POST /api/tools/{toolName} - Execute tool             │    │
│  │  • Middleware: CORS, body-parser, error handling         │    │
│  └───────────────────────┬──────────────────────────────────┘    │
└──────────────────────────┼────────────────────────────────────────┘
                           │
                    Tool Registry
                           │
┌──────────────────────────▼────────────────────────────────────────┐
│                    Tool Implementation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Tool 1      │  │  Tool 2      │  │  Tool N      │          │
│  │  Definition  │  │  Definition  │  │  Definition  │          │
│  │  Handler     │  │  Handler     │  │  Handler     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                    HTTP Requests (axios)
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                    External API Layer                             │
│              (Target API - PokeAPI, GitHub, etc.)                 │
└──────────────────────────────────────────────────────────────────┘
```

#### 2.2 Component Breakdown

Layer 1: MCP Protocol Wrapper :-

- **Responsibility**: Implements JSON-RPC 2.0 protocol over stdio
- **Technologies**: Node.js, TypeScript, readline
- **Key Features**: Protocol compliance, request routing, error handling

Layer 2: HTTP API Server :-

- **Responsibility**: RESTful API for tool execution
- **Technologies**: Express.js, body-parser
- **Key Features**: Tool registry, request routing, response formatting

Layer 3: Tool Implementation :-

- **Responsibility**: Individual tool definitions and handlers
- **Technologies**: TypeScript, axios
- **Key Features**: JSON Schema validation, API integration, error handling

Layer 4: External API :-

- **Responsibility**: Target REST API to be converted
- **Technologies**: Varies by API
- **Key Features**: Data source, business logic

#### 2.3 Communication Protocols

1. **MCP Protocol (stdio)**
   - Format: JSON-RPC 2.0
   - Transport: Standard input/output (stdio)
   - Encoding: UTF-8 JSON
   - Request/Response pattern

2. **HTTP Protocol (internal)**
   - Format: RESTful API
   - Transport: HTTP/HTTPS
   - Encoding: JSON
   - Methods: GET, POST

3. **External API Protocol**
   - Format: Varies (typically REST)
   - Transport: HTTP/HTTPS
   - Encoding: JSON (typically)
   - Methods: GET, POST, PUT, DELETE (as needed)

---

### 3. Design Decisions

#### 3.1 Architecture Patterns

Pattern: Layered Architecture :-

- **Rationale**: Separation of concerns enables maintainability and testability
- **Implementation**: Four distinct layers (MCP, HTTP, Tools, External API)
- **Benefits**:

  - Easy to modify individual layers
  - Clear responsibility boundaries
  - Facilitates testing

Pattern: Bridge Pattern :-

- **Rationale**: Bridge between stdio (MCP) and HTTP (API)
- **Implementation**: MCP wrapper bridges JSON-RPC to HTTP requests
- **Benefits**:
  - Protocol independence
  - Reusable HTTP server
  - Standard MCP interface

Pattern: Registry Pattern

- **Rationale**: Centralized tool management
- **Implementation**: `tools.ts` exports all tool definitions
- **Benefits**:
  - Easy tool discovery
  - Consistent tool structure
  - Simplified registration

#### 3.2 Technology Choices

TypeScript

- **Rationale**: Type safety, better IDE support, easier maintenance
- **Alternatives Considered**: JavaScript, Python
- **Decision**: TypeScript for better developer experience and type safety

- Express.js

- **Rationale**: Mature, well-documented, widely used
- **Alternatives Considered**: Fastify, Koa
- **Decision**: Express for ecosystem and simplicity

- Axios

- **Rationale**: Promise-based, interceptors, better error handling
- **Alternatives Considered**: fetch API, node-fetch
- **Decision**: Axios for features and reliability

- JSON-RPC 2.0

- **Rationale**: MCP protocol standard
- **Alternatives**: Not applicable (protocol requirement)
- **Decision**: Required by MCP specification

#### 3.3 Data Flow Design

**Request Flow:**

```text
LLM Client → JSON-RPC Request → MCP Wrapper → HTTP Request → Tool Handler → External API
```

**Response Flow:**

```text
External API → Tool Handler → HTTP Response → MCP Wrapper → JSON-RPC Response → LLM Client
```

**Error Flow:**

```text
Error at any layer → Error handler → Formatted error → JSON-RPC error → LLM Client
```

#### 3.4 Error Handling Strategy

**Multi-Level Error Handling:**

1. **Tool Level**: Catch API errors, format for HTTP response
2. **HTTP Server Level**: Catch handler errors, return 500 status
3. **MCP Wrapper Level**: Catch HTTP errors, format JSON-RPC error
4. **Client Level**: Display user-friendly error messages

Error Categories:

- **Validation Errors** (400): Invalid parameters
- **API Errors** (404, 500): External API failures
- **Protocol Errors** (-32600 to -32700): JSON-RPC errors
- **Network Errors**: Connection timeouts, DNS failures

---

### 4. Technical Specifications

#### 4.1 MCP Protocol Specification

**Protocol Version**: `2024-11-05`

**Required Methods:**

- `initialize` - Protocol handshake
- `tools/list` - List available tools
- `tools/call` - Execute tool

**Message Format:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "getPokemonByName",
    "arguments": {
      "name": "pikachu"
    }
  }
}
```

**Response Format:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{...tool result...}"
      }
    ]
  }
}
```

#### 4.2 Tool Definition Schema

**Tool Structure:**

```typescript
interface Tool {
  name: string;                    // Unique tool identifier
  description: string;              // LLM-readable description
  parameters: JSONSchema;           // Input parameter schema
}

interface ToolHandler {
  (req: Request, res: Response): Promise<void>;
}
```

**Parameter Schema (JSON Schema):**

```json
{
  "type": "object",
  "properties": {
    "paramName": {
      "type": "string",
      "description": "Parameter description"
    }
  },
  "required": ["paramName"]
}
```

#### 4.3 HTTP API Specification

**Endpoints:**

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/` | Health check | JSON status |
| GET | `/tools` | List all tools | Array of tool definitions |
| POST | `/api/tools/{toolName}` | Execute tool | Tool result or error |

**Request Format:**

```json
{
  "param1": "value1",
  "param2": 123
}
```

**Response Format:**

```json
{
  "result": { /* API response data */ }
}
```

**Error Format:**

```json
{
  "error": "Error message"
}
```

#### 4.4 Performance Requirements

- **Response Time**: < 2 seconds for tool execution (excluding external API latency)
- **Throughput**: Support 100+ concurrent requests
- **Reliability**: 99.9% uptime
- **Error Rate**: < 1% internal errors

#### 4.5 Security Requirements

- **Authentication**: Support API keys via environment variables
- **Input Validation**: All inputs validated against JSON Schema
- **Error Sanitization**: No sensitive data in error messages
- **Rate Limiting**: Optional rate limiting per tool
- **HTTPS**: Required for production deployments

---

## Part II: Architecture Specification :-

### 5. MCP Protocol Specification

#### 5.1 Protocol Overview

The Model Context Protocol (MCP) is a standardized protocol for AI assistants to interact with external tools. It uses JSON-RPC 2.0 over stdio for communication.

**Key Characteristics:**

- **Transport**: Standard input/output (stdio)
- **Format**: JSON-RPC 2.0
- **Encoding**: UTF-8
- **Request-Response**: Synchronous request-response pattern
- **Notifications**: Optional async notifications

#### 5.2 Protocol Handshake

**Initialize Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "cursor",
      "version": "1.0.0"
    }
  }
}
```

**Initialize Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "my-api-mcp-server",
      "version": "1.0.0"
    }
  }
}
```

**Initialized Notification:**

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized",
  "params": {}
}
```

#### 5.3 Tool Discovery

**List Tools Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

**List Tools Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "getPokemonByName",
        "description": "Get information about a Pokemon",
        "inputSchema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "description": "Pokemon name"
            }
          },
          "required": ["name"]
        }
      }
    ]
  }
}
```

#### 5.4 Tool Execution

**Call Tool Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "getPokemonByName",
    "arguments": {
      "name": "pikachu"
    }
  }
}
```

**Call Tool Response (Success):**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"id\":25,\"name\":\"pikachu\",...}"
      }
    ]
  }
}
```

**Call Tool Response (Error):**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "error": {
    "code": -32603,
    "message": "Tool call failed: Pokemon not found"
  }
}
```

#### 5.5 JSON-RPC Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid Request | Invalid JSON-RPC structure |
| -32601 | Method not found | Unknown method |
| -32602 | Invalid params | Missing or invalid parameters |
| -32603 | Internal error | Server error |
| -32000 to -32099 | Server error | Custom server errors |

---

### 6. Component Architecture

#### 6.1 MCP Server Wrapper Component

**File**: `src/mcp-server.ts`

**Responsibilities:**

- Parse JSON-RPC messages from stdin
- Route requests to appropriate handlers
- Format responses as JSON-RPC
- Handle protocol initialization
- Manage tool discovery and execution

**Key Classes/Interfaces:**

```typescript
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
  private requestId: number;
  private initialized: boolean;
  
  async handleRequest(request: MCPRequest): Promise<MCPResponse | null>;
  private async listTools(request: MCPRequest): Promise<MCPResponse | null>;
  private async callTool(request: MCPRequest): Promise<MCPResponse | null>;
  async start(): Promise<void>;
}
```

**State Management:**

- `initialized`: Tracks initialization state (prevents double initialization)
- `requestId`: Auto-incrementing request ID counter

#### 6.2 HTTP API Server Component

**File**: `src/index.ts`

**Responsibilities:**

- Serve REST API endpoints
- Register tool routes
- Handle HTTP requests/responses
- Provide health check endpoint
- Manage middleware (CORS, body-parser, etc.)

**Key Components:**

```typescript
// Express app setup
const app = express();
app.use(bodyParser.json());

// Routes
app.get('/', healthCheckHandler);
app.get('/tools', listToolsHandler);
app.use('/api', apiRouter);
```

**Middleware Stack:**

1. `body-parser`: Parse JSON request bodies
2. Error handler: Catch and format errors
3. CORS (optional): Enable cross-origin requests

#### 6.3 Tool Registry Component

**File**: `src/tools.ts`

**Responsibilities:**

- Aggregate all tool definitions
- Export unified tools array
- Provide tool discovery mechanism

**Structure:**

```typescript
import { tool1 } from './api/tools/tool1';
import { tool2 } from './api/tools/tool2';
// ... import all tools

export const tools = [
  tool1,
  tool2,
  // ... all tools
];
```

#### 6.4 Tool Implementation Component

**File**: `src/api/tools/{toolName}.ts`

**Structure:**

- Tool Definition (JSON Schema)
- Tool Handler (Express route handler)

**Pattern:**

```typescript
// Tool Definition
export const toolName = {
  name: 'toolName',
  description: 'Tool description',
  parameters: { /* JSON Schema */ }
};

// Tool Handler
export const toolNameHandler = async (req: Request, res: Response) => {
  // 1. Validate input
  // 2. Call external API
  // 3. Return response
  // 4. Handle errors
};
```

#### 6.5 API Router Component

**File**: `src/api/index.ts`

**Responsibilities:**

- Register tool handler routes
- Map tool names to handlers
- Provide centralized routing

**Pattern:**

```typescript
router.post('/tools/toolName1', toolName1Handler);
router.post('/tools/toolName2', toolName2Handler);
// ... register all tools
```

---

### 7. Data Flow & Communication

#### 7.1 Request Flow Diagram

```text
┌─────────────┐
│ LLM Client  │
│  (Cursor)   │
└──────┬──────┘
       │
       │ JSON-RPC Request (stdin)
       │ {"method": "tools/call", "params": {...}}
       │
┌──────▼──────────────────────────────────────┐
│ MCP Server Wrapper                          │
│ 1. Parse JSON-RPC message                   │
│ 2. Validate request structure               │
│ 3. Route to appropriate handler             │
└──────┬──────────────────────────────────────┘
       │
       │ HTTP POST Request
       │ POST /api/tools/{toolName}
       │ Body: {parameters}
       │
┌──────▼──────────────────────────────────────┐
│ HTTP API Server                             │
│ 1. Receive HTTP request                     │
│ 2. Route to tool handler                    │
└──────┬──────────────────────────────────────┘
       │
       │ Tool Handler Execution
       │
┌──────▼──────────────────────────────────────┐
│ Tool Handler                                │
│ 1. Validate parameters                      │
│ 2. Construct API request                    │
│ 3. Call external API (axios)                │
└──────┬──────────────────────────────────────┘
       │
       │ HTTP Request
       │ GET/POST External API
       │
┌──────▼──────────────────────────────────────┐
│ External API                                │
│ (PokeAPI, GitHub, etc.)                     │
└──────┬──────────────────────────────────────┘
       │
       │ Response flows back up the chain
```

#### 7.2 Response Flow

**Success Path:**

```text
External API → Tool Handler → HTTP 200 → MCP Wrapper → JSON-RPC result → LLM Client
```

**Error Path:**

```text
Error occurs → Error Handler → HTTP 4xx/5xx → MCP Wrapper → JSON-RPC error → LLM Client
```

#### 7.3 Message Formats

**JSON-RPC Request (from LLM Client):**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "getPokemonByName",
    "arguments": {"name": "pikachu"}
  }
}
```

**HTTP Request (MCP to HTTP Server):**

```http
POST /api/tools/getPokemonByName HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{"name": "pikachu"}
```

**External API Request (Tool Handler to External API):**

```http
GET https://api.example.com/pokemon/pikachu HTTP/1.1
Authorization: Bearer {token}
```

**JSON-RPC Response (to LLM Client):**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{"type": "text", "text": "{...data...}"}]
  }
}
```

---

### 8. Interface Definitions

#### 8.1 Tool Definition Interface

```typescript
interface ToolDefinition {
  name: string;                    // Unique identifier (camelCase)
  description: string;              // LLM-readable description
  parameters: {
    type: 'object';
    properties: {
      [key: string]: {
        type: 'string' | 'number' | 'boolean' | 'array' | 'object';
        description: string;
        // Optional constraints
        minLength?: number;
        maxLength?: number;
        minimum?: number;
        maximum?: number;
        pattern?: string;
        enum?: any[];
        items?: any;                // For array types
        properties?: any;           // For object types
      };
    };
    required?: string[];
  };
}
```

#### 8.2 Tool Handler Interface

```typescript
type ToolHandler = (
  req: express.Request,
  res: express.Response
) => Promise<void>;

// Request body structure
interface ToolRequest {
  [paramName: string]: any;        // Tool-specific parameters
}

// Response structure
interface ToolResponse {
  [key: string]: any;              // API response data
}

// Error response structure
interface ToolError {
  error: string;                    // Error message
}
```

#### 8.3 MCP Request/Response Interfaces

```typescript
interface MCPRequest {
  jsonrpc: '2.0';
  id?: number | string | null;     // null for notifications
  method: string;                   // Method name
  params?: any;                      // Method parameters
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: any;                      // Success result
  error?: {                          // Error result
    code: number;
    message: string;
    data?: any;
  };
}

interface MCPNotification {
  jsonrpc: '2.0';
  method: string;                   // No id field
  params?: any;
}
```

#### 8.4 HTTP API Interfaces

```typescript
// GET /tools response
interface ToolsListResponse {
  [toolName: string]: ToolDefinition;
}

// POST /api/tools/{toolName} request
interface ToolExecutionRequest {
  [paramName: string]: any;
}

// POST /api/tools/{toolName} response (success)
interface ToolExecutionResponse {
  [key: string]: any;               // API-specific response
}

// POST /api/tools/{toolName} response (error)
interface ToolExecutionError {
  error: string;
}
```

---

## Part III: Implementation Guide :-

### 9. Prerequisites & Setup

#### 9.1 Prerequisites

Before starting, ensure you have:

- **Node.js** (v20.x or higher recommended)
- **npm** or **yarn** package manager
- **TypeScript** knowledge (basic understanding)
- **Git** for version control
- **A target API** to convert (REST API with documentation)
- **Text Editor/IDE** (VS Code recommended)

#### 9.2 Required npm Packages

```bash
npm install express axios body-parser
npm install --save-dev typescript ts-node @types/node @types/express @types/body-parser
```

---

### 10. Project Planning

#### 10.1 Analyze Your API

Before writing code, analyze your target API:

1. **List all endpoints** you want to expose
2. **Identify parameter types** (strings, numbers, IDs, etc.)
3. **Document response formats**
4. **Note authentication requirements** (API keys, OAuth, etc.)
5. **Check rate limits** and usage constraints

#### 10.2 Design Tool Names

Convert API endpoints to tool names following this pattern:

**Pattern**: `{action}{Resource}{ByIdentifier}`

Examples:

- `GET /pokemon/{name}` → `getPokemonByName`
- `GET /users/{id}` → `getUserById`
- `POST /posts` → `createPost`
- `PUT /users/{id}` → `updateUserById`
- `DELETE /posts/{id}` → `deletePostById`

**Naming Guidelines**:

- Use camelCase
- Start with verb (get, create, update, delete)
- Be descriptive and clear
- Keep names under 50 characters

#### 10.3 Map Endpoints to Tools

Create a spreadsheet or document mapping:

| API Endpoint | HTTP Method | Tool Name | Parameters | Description |
|-------------|-------------|-----------|------------|-------------|
| `/pokemon/{name}` | GET | `getPokemonByName` | `name: string` | Get Pokemon data |
| `/pokemon/{id}` | GET | `getPokemonById` | `id: number` | Get Pokemon by ID |

---

## Part IV: Conversion Framework Blueprint :-

### 17. Conversion Methodology

#### 17.1 The Conversion Process

The conversion from API to MCP follows a systematic 5-step process:

```text
Step 1: API Analysis → Step 2: Tool Design → Step 3: Implementation → Step 4: Testing → Step 5: Deployment
```

#### 17.2 Step-by-Step Conversion Framework

Step 1: API Analysis & Documentation

```typescript
// Analysis checklist
interface APIAnalysis {
  endpoints: Endpoint[];
  authentication: AuthMethod;
  rateLimits: RateLimit;
  errorFormats: ErrorFormat[];
  dataFormats: DataFormat[];
}

interface Endpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  parameters: Parameter[];
  response: ResponseType;
  description: string;
}
```

Step 2: Tool Design & Mapping

```typescript
// Tool mapping template
interface ToolMapping {
  apiEndpoint: string;
  toolName: string;
  toolDescription: string;
  parameterMapping: ParameterMapping[];
  responseMapping: ResponseMapping;
}

interface ParameterMapping {
  apiParam: string;
  toolParam: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
}
```

Step 3: Code Generation Pattern

```typescript
// Standard tool template
const toolTemplate = {
  definition: {
    name: '{{toolName}}',
    description: '{{description}}',
    parameters: {
      type: 'object',
      properties: {
        // Generated from API parameters
      },
      required: [
        // Generated from API requirements
      ]
    }
  },
  handler: async (req: Request, res: Response) => {
    // Generated handler logic
  }
};
```

Step 4: Validation & Testing

```typescript
// Test template
interface ToolTest {
  toolName: string;
  testCases: TestCase[];
}

interface TestCase {
  name: string;
  input: any;
  expectedOutput: any;
  expectedStatus: number;
}
```

Step 5: Integration & Deployment

- Register tool in `tools.ts`
- Add route in `api/index.ts`
- Test end-to-end
- Deploy HTTP server
- Publish to npm/MCP Registry

#### 17.3 Conversion Decision Tree

```text
Is API endpoint suitable for conversion?
├─ YES → Does it have clear input/output?
│   ├─ YES → Is it idempotent/safe?
│   │   ├─ YES → Convert to tool
│   │   └─ NO → Consider side effects, document carefully
│   └─ NO → Review API docs, may need transformation
└─ NO → Skip or document why not suitable
```

#### 17.4 Tool Suitability Criteria

**Good candidates for conversion:**

- ✅ GET endpoints (read-only)
- ✅ Clear input parameters
- ✅ Structured JSON responses
- ✅ Well-documented API
- ✅ No complex state management

**Requires special handling:**

- ⚠️ POST/PUT/DELETE (write operations)
- ⚠️ Streaming responses
- ⚠️ WebSocket connections
- ⚠️ File uploads/downloads
- ⚠️ Authentication tokens

**Not suitable (or requires wrapper):**

- ❌ Real-time bidirectional communication
- ❌ Binary protocols
- ❌ Stateful sessions
- ❌ Complex multi-step workflows

---

### 18. Tool Generation Patterns

#### 18.1 Pattern: Simple GET by Identifier

**API Pattern**: `GET /resource/{identifier}`

**Tool Pattern**:

```typescript
export const getResourceByIdentifierTool = {
  name: 'getResourceByIdentifier',
  description: 'Get {{resource}} by {{identifier}}.',
  parameters: {
    type: 'object',
    properties: {
      identifier: {
        type: '{{type}}',  // string or number
        description: 'The {{identifier}} of the {{resource}}.',
      },
    },
    required: ['identifier'],
  },
};

export const getResourceByIdentifierHandler = async (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Missing identifier parameter' });
  }
  try {
    const response = await axios.get(`https://api.example.com/resource/${identifier}`);
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};
```

#### 18.2 Pattern: GET with Query Parameters

**API Pattern**: `GET /resource?param1=value1&param2=value2`

**Tool Pattern**:

```typescript
export const getResourceTool = {
  name: 'getResource',
  description: 'Get {{resource}} with optional filters.',
  parameters: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Filter by param1',
      },
      param2: {
        type: 'number',
        description: 'Filter by param2',
      },
    },
    // No required fields - all optional
  },
};

export const getResourceHandler = async (req: Request, res: Response) => {
  const { param1, param2 } = req.body;
  try {
    const response = await axios.get('https://api.example.com/resource', {
      params: { param1, param2 },
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};
```

#### 18.3 Pattern: POST with Body

**API Pattern**: `POST /resource` with JSON body

**Tool Pattern**:

```typescript
export const createResourceTool = {
  name: 'createResource',
  description: 'Create a new {{resource}}.',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the resource',
      },
      data: {
        type: 'object',
        description: 'Additional data',
      },
    },
    required: ['name'],
  },
};

export const createResourceHandler = async (req: Request, res: Response) => {
  const { name, data } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Missing name parameter' });
  }
  try {
    const response = await axios.post('https://api.example.com/resource', {
      name,
      ...data,
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create resource' });
  }
};
```

#### 18.4 Pattern: PUT/UPDATE

**API Pattern**: `PUT /resource/{id}` with JSON body

**Tool Pattern**:

```typescript
export const updateResourceByIdTool = {
  name: 'updateResourceById',
  description: 'Update an existing {{resource}} by ID.',
  parameters: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'The ID of the resource',
      },
      updates: {
        type: 'object',
        description: 'Fields to update',
      },
    },
    required: ['id', 'updates'],
  },
};
```

#### 18.5 Pattern: DELETE

**API Pattern**: `DELETE /resource/{id}`

**Tool Pattern**:

```typescript
export const deleteResourceByIdTool = {
  name: 'deleteResourceById',
  description: 'Delete a {{resource}} by ID.',
  parameters: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'The ID of the resource to delete',
      },
    },
    required: ['id'],
  },
};
```

#### 18.6 Pattern: Nested Resources

**API Pattern**: `GET /resource/{id}/subresource`

**Tool Pattern**:

```typescript
export const getSubresourceByResourceIdTool = {
  name: 'getSubresourceByResourceId',
  description: 'Get {{subresource}} for a specific {{resource}}.',
  parameters: {
    type: 'object',
    properties: {
      resourceId: {
        type: 'number',
        description: 'The ID of the parent resource',
      },
    },
    required: ['resourceId'],
  },
};
```

---

### 19. API Mapping Framework

#### 19.1 Endpoint to Tool Name Mapping Rules

**Rule Set:**

1. **HTTP Method Prefix**:
   - `GET` → `get`
   - `POST` → `create`
   - `PUT` → `update`
   - `PATCH` → `patch`
   - `DELETE` → `delete`

2. **Resource Name**:
   - Extract resource from path: `/pokemon/{name}` → `Pokemon`
   - Convert to PascalCase: `pokemon` → `Pokemon`

3. **Identifier Type**:
   - `{name}` → `ByName`
   - `{id}` → `ById`
   - `{slug}` → `BySlug`

4. **Examples**:

   ```text
   GET /pokemon/{name}        → getPokemonByName
   GET /users/{id}            → getUserById
   POST /posts                → createPost
   PUT /users/{id}            → updateUserById
   DELETE /posts/{id}         → deletePostById
   GET /pokemon/{id}/moves    → getMovesByPokemonId
   ```

#### 19.2 Parameter Mapping Rules

**Type Mapping:**

| API Type | Tool Type | Notes |
|----------|-----------|-------|
| `string` | `string` | Direct mapping |
| `integer` | `number` | Convert to number |
| `boolean` | `boolean` | Direct mapping |
| `array` | `array` | Preserve array structure |
| `object` | `object` | Preserve object structure |
| `enum` | `string` with `enum` | Add enum constraint |

**Naming Convention:**

- Use camelCase for parameter names
- Match API parameter names when possible
- Use descriptive names (`userId` not `id`)

**Required vs Optional:**

- Path parameters: Always required
- Query parameters: Usually optional
- Body parameters: Follow API specification

#### 19.3 Response Mapping

**Response Structure:**

- Preserve API response structure
- Return full response object
- Don't transform unless necessary

**Error Mapping:**

| API Status | Tool Error | HTTP Status |
|------------|------------|-------------|
| 400 | Invalid params | 400 |
| 401 | Unauthorized | 401 |
| 404 | Not found | 404 |
| 500 | Internal error | 500 |
| Timeout | Network error | 500 |

#### 19.4 Authentication Mapping

**API Key in Header:**

```typescript
headers: {
  'X-API-Key': process.env.API_KEY
}
```

**Bearer Token:**

```typescript
headers: {
  'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
}
```

**OAuth 2.0:**

```typescript
// Requires token refresh logic
headers: {
  'Authorization': `Bearer ${await getAccessToken()}`
}
```

---

### 20. Automation Templates

#### 20.1 Tool Generator Script Template

```typescript
// generate-tool.ts
import * as fs from 'fs';
import * as path from 'path';

interface ToolConfig {
  toolName: string;
  description: string;
  apiEndpoint: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
}

function generateTool(config: ToolConfig) {
  const toolFile = `
import { Request, Response } from 'express';
import axios from 'axios';

export const ${config.toolName}Tool = {
  name: '${config.toolName}',
  description: '${config.description}',
  parameters: {
    type: 'object',
    properties: {
      ${config.parameters.map(p => `
      ${p.name}: {
        type: '${p.type}',
        description: '${p.description}',
      },`).join('')}
    },
    required: [${config.parameters.filter(p => p.required).map(p => `'${p.name}'`).join(', ')}],
  },
};

export const ${config.toolName}Handler = async (req: Request, res: Response) => {
  ${config.parameters.filter(p => p.required).map(p => `
  const { ${p.name} } = req.body;
  if (!${p.name}) {
    return res.status(400).json({ error: 'Missing ${p.name} parameter' });
  }`).join('')}

  try {
    const response = await axios.${config.httpMethod.toLowerCase()}(
      '${config.apiEndpoint}',
      ${config.httpMethod === 'GET' ? `
      {
        params: { ${config.parameters.map(p => p.name).join(', ')} }
      }` : `
      { ${config.parameters.map(p => p.name).join(', ')} }`}
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};
`;

  const filePath = path.join(__dirname, `src/api/tools/${config.toolName}.ts`);
  fs.writeFileSync(filePath, toolFile);
  console.log(`Generated: ${filePath}`);
}
```

#### 20.2 Batch Tool Generation

```typescript
// generate-all-tools.ts
const apiEndpoints = [
  {
    toolName: 'getPokemonByName',
    description: 'Get Pokemon by name',
    apiEndpoint: 'https://pokeapi.co/api/v2/pokemon/{name}',
    httpMethod: 'GET' as const,
    parameters: [
      { name: 'name', type: 'string', description: 'Pokemon name', required: true },
    ],
  },
  // ... more endpoints
];

apiEndpoints.forEach(endpoint => {
  generateTool(endpoint);
});
```

#### 20.3 Tool Registration Template

```typescript
// auto-register-tools.ts
import * as fs from 'fs';
import * as path from 'path';

const toolsDir = path.join(__dirname, 'src/api/tools');
const toolsFile = path.join(__dirname, 'src/tools.ts');

// Read all tool files
const toolFiles = fs.readdirSync(toolsDir)
  .filter(file => file.endsWith('.ts') && file !== 'index.ts');

// Generate imports
const imports = toolFiles.map(file => {
  const toolName = file.replace('.ts', '');
  const camelName = toolName.charAt(0).toLowerCase() + toolName.slice(1);
  return `import { ${camelName}Tool } from './api/tools/${toolName}';`;
}).join('\n');

// Generate exports
const exports = toolFiles.map(file => {
  const toolName = file.replace('.ts', '');
  const camelName = toolName.charAt(0).toLowerCase() + toolName.slice(1);
  return `  ${camelName}Tool,`;
}).join('\n');

const content = `${imports}\n\nexport const tools = [\n${exports}\n];\n`;

fs.writeFileSync(toolsFile, content);
```

#### 20.4 Route Registration Template

```typescript
// auto-register-routes.ts
import * as fs from 'fs';
import * as path from 'path';

const toolsDir = path.join(__dirname, 'src/api/tools');
const routesFile = path.join(__dirname, 'src/api/index.ts');

const toolFiles = fs.readdirSync(toolsDir)
  .filter(file => file.endsWith('.ts'));

// Generate imports
const imports = toolFiles.map(file => {
  const toolName = file.replace('.ts', '');
  const camelName = toolName.charAt(0).toLowerCase() + toolName.slice(1);
  return `import { ${camelName}Handler } from './tools/${toolName}';`;
}).join('\n');

// Generate routes
const routes = toolFiles.map(file => {
  const toolName = file.replace('.ts', '');
  const camelName = toolName.charAt(0).toLowerCase() + toolName.slice(1);
  return `router.post('/tools/${camelName}', ${camelName}Handler);`;
}).join('\n');

const content = `${imports}\n\nconst router = express.Router();\n\n${routes}\n\nexport default router;\n`;

fs.writeFileSync(routesFile, content);
```

---

### 11. Project Setup

#### 11.1 Initialize Project

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

### 12. Creating Your First Tool

#### 12.1 Tool Structure

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

### 13. Building the HTTP API Server

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

### 14. Building the MCP Protocol Wrapper

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

### 15. Testing Your MCP Server

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

### 16. Deployment

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

## Part V: Developer Handbook :-

### 21. Publishing to npm and MCP Registry

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

### 22. CI/CD Automation

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

### 23. Client Configuration

#### 23.1 Cursor IDE

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

#### 23.2 Gemini CLI

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

#### 23.3 Claude Desktop

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

### 24. Troubleshooting Guide

#### 24.1 Common Issues

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

### 25. Best Practices & Patterns

#### 25.1 Tool Naming

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

### 26. Maintenance & Updates

#### 26.1 Version Management

**Semantic Versioning:**

- `MAJOR.MINOR.PATCH` (e.g., 1.5.0)
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

**Version Update Process:**

1. Update `package.json` version
2. Update `server.json` version
3. Create git tag: `git tag v1.5.0`
4. Push tag: `git push origin v1.5.0`
5. CI/CD automatically publishes

#### 26.2 Adding New Tools

**Process:**

1. Create tool file: `src/api/tools/newTool.ts`
2. Export tool definition and handler
3. Import in `src/tools.ts`
4. Add route in `src/api/index.ts`
5. Test locally
6. Deploy and test

#### 26.3 Monitoring & Performance

**Key Metrics:**

- Tool call success rate
- Response times
- Error rates by tool
- API rate limit usage

#### 26.4 Security Updates

**Regular Tasks:**

- Update dependencies: `npm audit fix`
- Review API key usage
- Check for exposed secrets
- Update authentication tokens

---

## Conclusion

You now have a complete all-rounder framework for converting any API into an MCP server. This document combines:

1. **Technical Design Document (TDD)** - Complete design specifications
2. **Architecture Specification** - Detailed system architecture  
3. **Implementation Guide** - Step-by-step instructions
4. **Conversion Framework Blueprint** - Reusable patterns and templates
5. **Developer Handbook** - Maintenance and best practices

### Key Takeaways

1. **Plan First**: Analyze your API thoroughly before implementation
2. **Follow Patterns**: Use the provided patterns for consistency
3. **Test Thoroughly**: Comprehensive testing ensures reliability
4. **Automate Everything**: CI/CD saves time and reduces errors
5. **Document Well**: Clear descriptions help LLMs use tools effectively

### The Conversion Process

```text
API Analysis → Tool Design → Implementation → Testing → Deployment → Maintenance
```

**Remember**: The goal is to make APIs accessible to AI assistants in a standardized way. Focus on clear descriptions, proper error handling, and good documentation.

**Happy building!** 🚀
