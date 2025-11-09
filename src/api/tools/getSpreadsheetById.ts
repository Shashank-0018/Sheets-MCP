import { Request, Response } from 'express';
import axios from 'axios';

export const getSpreadsheetByIdTool = {
  name: 'getSpreadsheetById',
  description: 'Returns the spreadsheet at the given ID.',
  parameters: {
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet.',
      },
      ranges: {
        type: 'string',
        description: 'The ranges to retrieve, in A1 notation.',
      },
      includeGridData: {
        type: 'boolean',
        description: 'True if grid data should be returned.',
      },
    },
    required: ['spreadsheetId'],
  },
};

export const getSpreadsheetByIdHandler = async (req: Request, res: Response) => {
  const { spreadsheetId, ranges, includeGridData } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Missing required parameter: spreadsheetId' });
  }

  try {
    const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY; // Or ACCESS_TOKEN
    if (!GOOGLE_SHEETS_API_KEY) {
      return res.status(500).json({ error: 'Google Sheets API key not configured.' });
    }

    const params: any = {};
    if (ranges) {
      params.ranges = ranges;
    }
    if (includeGridData !== undefined) {
      params.includeGridData = includeGridData;
    }

    const response = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: {
          'Authorization': `Bearer ${GOOGLE_SHEETS_API_KEY}`, // Assuming Bearer token for auth
        },
        params: params,
      }
    );

    res.json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data?.error?.message || 'Google Sheets API request failed',
      });
    } else {
      res.status(500).json({ error: 'Failed to get spreadsheet via Google Sheets API' });
    }
  }
};
