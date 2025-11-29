import { Request, Response } from 'express';
import axios from 'axios';
import { GOOGLE_SHEETS_API_SERVER_URL } from '../config';
import { createHeadersWithUserId } from '../../utils/userIdHelper';
export const batchClearValuesByDataFilterTool = {
  name: 'batchClearValuesByDataFilter',
  description: 'Clears one or more ranges of values from a spreadsheet using data filters.',
  parameters: {
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet.',
      },
      dataFilters: {
        type: 'array',
        description: 'The data filters to apply. Each item in the array should be an object representing a DataFilter.',
        items: {
          type: 'object', // DataFilter object structure can be complex
          description: 'A DataFilter object.',
        },
      },
    },
    required: ['spreadsheetId', 'dataFilters'],
  },
};

export const batchClearValuesByDataFilterHandler = async (req: Request, res: Response) => {
  const { spreadsheetId, dataFilters } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Missing required parameter: spreadsheetId' });
  }
  if (!dataFilters || !Array.isArray(dataFilters)) {
    return res.status(400).json({ error: 'Missing or invalid required parameter: dataFilters (must be an array)' });
  }

  try {
    const response = await axios.post(
      `${GOOGLE_SHEETS_API_SERVER_URL}/spreadsheets/${spreadsheetId}/values:batchClearByDataFilter`,
      { dataFilters },
      {
        headers: createHeadersWithUserId(req),
      }
    );

    res.json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data?.error?.message || 'Internal Google Sheets API server request failed',
      });
    } else {
      res.status(500).json({ error: 'Failed to batch clear values by data filter via internal Google Sheets API server' });
    }
  }
};
