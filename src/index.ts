import express from 'express';
import { app, port } from './mcp-server';

app.listen(port, () => {
  console.log(`MCP server listening at http://localhost:${port}`);
});
