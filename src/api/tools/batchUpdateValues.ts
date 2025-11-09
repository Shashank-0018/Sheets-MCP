import { Request, Response } from 'express';
import axios from 'axios';

const GOOGLE_SHEETS_API_SERVER_URL = process.env.GOOGLE_SHEETS_API_SERVER_URL || 'http://localhost:3001';

export const batchUpdateValuesTool = {
  name: 'batchUpdateValues',
  description: 'Sets values in one or more ranges of a spreadsheet.',
  parameters: {
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet.',
      },
      data: {
        type: 'array',
        description: 'The new values to apply to the spreadsheet. Each item in the array should be an object containing "range" and "values".',
        items: {
          type: 'object',
          properties: {
            range: {
              type: 'string',
              description: 'The A1 notation of the range to update.',
            },
            majorDimension: {
              type: 'string',
              description: 'The major dimension of the values (ROWS or COLUMNS).',
              enum: ['ROWS', 'COLUMNS'],
            },
            values: {
              type: 'array',
              description: 'The new values to apply to the specified range. This should be an array of arrays, where each inner array represents a row.',
              items: {
                type: 'array',
                items: {
                  type: ['string', 'number', 'boolean', 'null'],
                },
              },
            },
          },
          required: ['range', 'values'],
        },
      },
      valueInputOption: {
        type: 'string',
        description: 'How the input data should be interpreted (RAW, USER_ENTERED, INPUT_VALUE_OPTION_UNSPECIFIED).',
        enum: ['RAW', 'USER_ENTERED', 'INPUT_VALUE_OPTION_UNSPECIFIED'],
      },
    },
    required: ['spreadsheetId', 'data', 'valueInputOption'],
  },
};

export const batchUpdateValuesHandler = async (req: Request, res: Response) => {
  const { spreadsheetId, data, valueInputOption } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Missing required parameter: spreadsheetId' });
  }
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Missing or invalid required parameter: data (must be an array)' });
  }
  if (!valueInputOption) {
    return res.status(400).json({ error: 'Missing required parameter: valueInputOption' });
  }

  try {
    const response = await axios.post(
      `${GOOGLE_SHEETS_API_SERVER_URL}/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      { data, valueInputOption },
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
      res.status(500).json({ error: 'Failed to batch update values via internal Google Sheets API server' });
    }
  }
};
