import { Request, Response } from 'express';
import axios from 'axios';

import { GOOGLE_SHEETS_API_SERVER_URL } from '../config';
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
    const response = await axios.post(
      `${GOOGLE_SHEETS_API_SERVER_URL}/spreadsheets/${spreadsheetId}/batchUpdate`,
      { requests },
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
      res.status(500).json({ error: 'Failed to batch update spreadsheet via internal Google Sheets API server' });
    }
  }
};
