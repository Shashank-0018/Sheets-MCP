import 'dotenv/config';
import express from 'express';
import { app as mcpApp } from './index';
import { app as sheetsApp } from './google-sheets-api-server';

const app = express();
const port = process.env.PORT || 3000;

// Mount both apps
// Since they don't have conflicting routes, we can mount them at root
app.use(mcpApp);
app.use(sheetsApp);

// Health check for the unified server
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'unified-mcp-server' });
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Unified MCP Server running on port ${port}`);
        console.log(`- MCP API available`);
        console.log(`- Google Sheets API available`);
    });
}

export default app;
