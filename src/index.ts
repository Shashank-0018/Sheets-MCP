// Load environment variables from .env file
import 'dotenv/config';

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
    message: 'MCP HTTP API Server is running!',
    version: '1.0.0',
  });
});

// List all available tools
app.get('/tools', (req, res) => {
  res.json(tools);
});

// API routes
app.use('/api', apiRouter);

// Auth routes (for MCP token management)
import { getMcpTokenHandler, linkMcpTokenHandler } from './api/auth';
app.get('/auth/mcp-token', getMcpTokenHandler);
app.post('/auth/link-token', linkMcpTokenHandler);

// Start server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`MCP HTTP API Server is running on port ${port}`);
  });
}

export { app };