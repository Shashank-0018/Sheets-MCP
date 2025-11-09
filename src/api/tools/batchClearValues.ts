import { Request, Response } from 'express';
import axios from 'axios';

export const batchClearValuesTool = {
  name: 'batchClearValues',
  description: 'Clears one or more ranges of values from a spreadsheet.',
  parameters: {
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet.',
      },
      ranges: {
        type: 'array',
        description: 'The A1 notation ranges to clear.',
        items: {
          type: 'string',
        },
      },
    },
    required: ['spreadsheetId', 'ranges'],
  },
};

export const batchClearValuesHandler = async (req: Request, res: Response) => {
  const { spreadsheetId, ranges } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Missing required parameter: spreadsheetId' });
  }
  if (!ranges || !Array.isArray(ranges)) {
    return res.status(400).json({ error: 'Missing or invalid required parameter: ranges (must be an array of strings)' });
  }

  try {
    const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY; // Or ACCESS_TOKEN
    if (!GOOGLE_SHEETS_API_KEY) {
      return res.status(500).json({ error: 'Google Sheets API key not configured.' });
    }

    const response = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
      { ranges },
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
      res.status(500).json({ error: 'Failed to batch clear values via Google Sheets API' });
    }
  }
};
