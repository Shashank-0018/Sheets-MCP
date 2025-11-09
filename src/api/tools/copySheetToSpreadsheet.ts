import { Request, Response } from 'express';
import axios from 'axios';

export const copySheetToSpreadsheetTool = {
  name: 'copySheetToSpreadsheet',
  description: 'Copies a sheet from one spreadsheet to another.',
  parameters: {
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet containing the sheet to copy.',
      },
      sheetId: {
        type: 'string',
        description: 'The ID of the sheet to copy.',
      },
      destinationSpreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet to copy the sheet to.',
      },
    },
    required: ['spreadsheetId', 'sheetId', 'destinationSpreadsheetId'],
  },
};

export const copySheetToSpreadsheetHandler = async (req: Request, res: Response) => {
  const { spreadsheetId, sheetId, destinationSpreadsheetId } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Missing required parameter: spreadsheetId' });
  }
  if (!sheetId) {
    return res.status(400).json({ error: 'Missing required parameter: sheetId' });
  }
  if (!destinationSpreadsheetId) {
    return res.status(400).json({ error: 'Missing required parameter: destinationSpreadsheetId' });
  }

  try {
    const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY; // Or ACCESS_TOKEN
    if (!GOOGLE_SHEETS_API_KEY) {
      return res.status(500).json({ error: 'Google Sheets API key not configured.' });
    }

    const response = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/sheets/${sheetId}:copyTo`,
      { destinationSpreadsheetId },
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
      res.status(500).json({ error: 'Failed to copy sheet to spreadsheet via Google Sheets API' });
    }
  }
};
