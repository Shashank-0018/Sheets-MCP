import express from 'express';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';

export const app = express();
export const port = 3000;

app.use(express.json());

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Support both environment variables and secrets.json file
let credentials: any;
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  credentials = {
    web: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: [process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/callback']
    }
  };
} else {
  try {
    credentials = JSON.parse(fs.readFileSync('./secrets.json', 'utf8'));
  } catch (err) {
    throw new Error('Either set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables, or provide secrets.json file');
  }
}

const TOKEN_PATH = 'token.json';

async function authorize(): Promise<OAuth2Client> {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris ? redirect_uris[0] : undefined);

  try {
    const token = fs.readFileSync(TOKEN_PATH, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    // If token.json doesn't exist, we need to get authorization
    // In a test environment, this will fail - user needs to run the server first to get token
    throw new Error(`No token found. Please run the server and visit the OAuth URL to authenticate. Token file expected at: ${TOKEN_PATH}`);
  }
}

function getAccessToken(oAuth2Client: OAuth2Client): Promise<OAuth2Client> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this URL:', authUrl);
  console.log('After authorization, the token will be saved to', TOKEN_PATH);
  
  // Set up the callback route if it doesn't already exist
  if (!app._router || !app._router.stack.some((layer: any) => layer.route?.path === '/oauth2callback')) {
    app.get('/oauth2callback', async (req, res) => {
      const code = req.query.code as string;
      if (!code) {
        res.status(400).send('Authorization code not found.');
        return;
      }
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        console.log('Token stored to', TOKEN_PATH);
        res.send('Authentication successful! You can close this tab.');
      } catch (err) {
        console.error('Error retrieving access token', err);
        res.status(500).send('Error retrieving access token.');
      }
    });
  }
  
  return new Promise((resolve, reject) => {
    // Set a timeout to reject if no callback happens
    const timeout = setTimeout(() => {
      reject(new Error('OAuth timeout: Please visit the authorization URL and complete the flow. Make sure the server is running.'));
    }, 300000); // 5 minutes timeout
    
    app.get('/oauth2callback', async (req, res) => {
      const code = req.query.code as string;
      if (!code) {
        res.status(400).send('Authorization code not found.');
        clearTimeout(timeout);
        return reject('Authorization code not found.');
      }
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        console.log('Token stored to', TOKEN_PATH);
        res.send('Authentication successful! You can close this tab.');
        clearTimeout(timeout);
        resolve(oAuth2Client);
      } catch (err) {
        console.error('Error retrieving access token', err);
        res.status(500).send('Error retrieving access token.');
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}



// OAuth callback handler - supports both /callback and /oauth2callback
async function handleOAuthCallback(req: express.Request, res: express.Response) {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).send('Authorization code not found.');
    return;
  }
  
  try {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris ? redirect_uris[0] : undefined);
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log('✅ Token stored to', TOKEN_PATH);
    res.send('Authentication successful! You can close this tab.');
  } catch (err) {
    console.error('Error retrieving access token', err);
    res.status(500).send('Error retrieving access token.');
  }
}

app.get('/callback', handleOAuthCallback);
app.get('/oauth2callback', handleOAuthCallback);

// Helper endpoint to get OAuth URL
app.get('/auth/url', (req, res) => {
  try {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris ? redirect_uris[0] : undefined);
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    res.json({ authUrl, message: 'Visit this URL to authorize the application' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Public URL fetcher - reads any publicly accessible URL
app.get('/fetch', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      res.status(400).json({ 
        error: 'URL parameter is required',
        example: '/fetch?url=https://api.example.com/data'
      });
      return;
    }

    // Validate URL
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch (e) {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    // Only allow http and https protocols for security
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      res.status(400).json({ error: 'Only HTTP and HTTPS URLs are allowed' });
      return;
    }

    // Use Node.js built-in fetch (Node 18+)
    const method = (req.query.method as string) || 'GET';
    const customHeaders = req.query.headers ? JSON.parse(req.query.headers as string) : {};
    
    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: {
        'User-Agent': 'MCP-Server/1.0',
        'Accept': 'application/json, text/plain, */*',
        ...customHeaders,
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const contentType = response.headers.get('content-type') || '';
    let data: any;
    
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      url: url,
    });
  } catch (error: any) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      res.status(408).json({ error: 'Request timeout' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.get('/spreadsheets/:spreadsheetId/values/:range', async (req, res) => {
    try {
        const auth = await authorize();
        const sheets = google.sheets({ version: 'v4', auth });
        const range = decodeURIComponent(req.params.range);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: req.params.spreadsheetId,
            range: range,
        });
        res.json(response.data);
    } catch (error: any) {
        console.error('Error in GET /spreadsheets/:spreadsheetId/values/:range:', error);
        if (error.response) {
            res.status(error.response.status || 500).json({ 
                error: error.response.data || error.message 
            });
        } else if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});

app.post('/spreadsheets/:spreadsheetId/batchUpdate', async (req, res) => {
    try {
        const auth = await authorize();
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId: req.params.spreadsheetId,
            requestBody: {
                requests: req.body.requests,
            },
        });
        res.json(response.data);
    } catch (error: any) {
        console.error('Error in POST /spreadsheets/:spreadsheetId/batchUpdate:', error);
        if (error.response) {
            res.status(error.response.status || 500).json({ 
                error: error.response.data || error.message 
            });
        } else if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});

app.post('/spreadsheets/:spreadsheetId/sheets/:sheetId/copyTo', async (req, res) => {
    try {
        const auth = await authorize();
        const sheets = google.sheets({ version: 'v4', auth });
        const sheetId = parseInt(req.params.sheetId, 10);
        if (isNaN(sheetId)) {
            res.status(400).json({ error: 'Invalid sheetId. Must be a number.' });
            return;
        }
        const response = await sheets.spreadsheets.sheets.copyTo({
            spreadsheetId: req.params.spreadsheetId,
            sheetId: sheetId,
            requestBody: {
                destinationSpreadsheetId: req.body.destinationSpreadsheetId,
            },
        });
        res.json(response.data);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});
