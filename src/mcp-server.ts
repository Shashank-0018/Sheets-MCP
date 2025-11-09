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
          name: 'google-sheets-mcp-server',
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
