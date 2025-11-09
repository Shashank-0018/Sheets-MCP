import { Request, Response } from 'express';
import axios from 'axios';

export const batchUpdateSpreadsheetByIdTool = {
  name: 'batchUpdateSpreadsheetById',
  description: 'Applies one or more updates to the spreadsheet.',
  parameters: {
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet.',
      },
      requests: {
        type: 'array',
        description: 'A list of requests to apply to the spreadsheet.',
        items: {
          type: 'object', // The structure of requests can be complex and varied
          description: 'A single update request for the spreadsheet.',
        },
      },
    },
    required: ['spreadsheetId', 'requests'],
  },
};

export const batchUpdateSpreadsheetByIdHandler = async (req: Request, res: Response) => {
  const { spreadsheetId, requests } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Missing required parameter: spreadsheetId' });
  }
  if (!requests || !Array.isArray(requests)) {
    return res.status(400).json({ error: 'Missing or invalid required parameter: requests (must be an array)' });
  }

  try {
    const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY; // Or ACCESS_TOKEN
    if (!GOOGLE_SHEETS_API_KEY) {
      return res.status(500).json({ error: 'Google Sheets API key not configured.' });
    }

    const response = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests },
      {
        headers: {
          'Authorization': `Bearer ${GOOGLE_SHEETS_API_KEY}`, // Assuming Bearer token for auth
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data?.error?.message || 'Google Sheets API request failed',
      });
    } else {
      res.status(500).json({ error: 'Failed to batch update spreadsheet via Google Sheets API' });
    }
  }
};
