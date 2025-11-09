import { Request, Response } from 'express';
import axios from 'axios';

const GOOGLE_SHEETS_API_SERVER_URL = process.env.GOOGLE_SHEETS_API_SERVER_URL || 'http://localhost:3001';

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
    const params: any = {};
    if (ranges) {
      params.ranges = ranges;
    }
    if (includeGridData !== undefined) {
      params.includeGridData = includeGridData;
    }

    const response = await axios.get(
      `${GOOGLE_SHEETS_API_SERVER_URL}/spreadsheets/${spreadsheetId}`,
      {
        params: params,
      }
    );

    res.json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data?.error?.message || 'Internal Google Sheets API server request failed',
      });
    } else {
      res.status(500).json({ error: 'Failed to get spreadsheet via internal Google Sheets API server' });
    }
  }
};
