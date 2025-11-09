import { Request, Response } from 'express';
import axios from 'axios';

export const clearValuesFromRangeTool = {
  name: 'clearValuesFromRange',
  description: 'Clears values from a spreadsheet.',
  parameters: {
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet.',
      },
      range: {
        type: 'string',
        description: 'The A1 notation of the values to clear.',
      },
    },
    required: ['spreadsheetId', 'range'],
  },
};

export const clearValuesFromRangeHandler = async (req: Request, res: Response) => {
  const { spreadsheetId, range } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Missing required parameter: spreadsheetId' });
  }
  if (!range) {
    return res.status(400).json({ error: 'Missing required parameter: range' });
  }

  try {
    const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY; // Or ACCESS_TOKEN
    if (!GOOGLE_SHEETS_API_KEY) {
      return res.status(500).json({ error: 'Google Sheets API key not configured.' });
    }

    // The clear endpoint typically expects an empty request body
    const response = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`,
      {}, // Empty body
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
      res.status(500).json({ error: 'Failed to clear values from range via Google Sheets API' });
    }
  }
};
