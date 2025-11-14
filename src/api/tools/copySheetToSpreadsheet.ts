import { Request, Response } from 'express';
import axios from 'axios';

import { GOOGLE_SHEETS_API_SERVER_URL } from '../config';
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
    const response = await axios.post(
      `${GOOGLE_SHEETS_API_SERVER_URL}/spreadsheets/${spreadsheetId}/sheets/${sheetId}:copyTo`,
      { destinationSpreadsheetId },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data?.error?.message || 'Internal Google Sheets API server request failed',
      });
    } else {
      res.status(500).json({ error: 'Failed to copy sheet to spreadsheet via internal Google Sheets API server' });
    }
  }
};
