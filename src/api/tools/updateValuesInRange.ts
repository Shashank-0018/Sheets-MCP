import { Request, Response } from 'express';
import axios from 'axios';

import { GOOGLE_SHEETS_API_SERVER_URL } from '../config';

export const updateValuesInRangeTool = {
  name: 'updateValuesInRange',
  description: 'Sets values in a range of a spreadsheet.',
  parameters: {
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet.',
      },
      range: {
        type: 'string',
        description: 'The A1 notation of the range to update.',
      },
      valueInputOption: {
        type: 'string',
        description: 'How the input data should be interpreted (RAW, USER_ENTERED, INPUT_VALUE_OPTION_UNSPECIFIED).',
        enum: ['RAW', 'USER_ENTERED', 'INPUT_VALUE_OPTION_UNSPECIFIED'],
      },
      values: {
        type: 'array',
        description: 'The new values to apply to the spreadsheet. This should be an array of arrays, where each inner array represents a row.',
        items: {
          type: 'array',
          items: {
            type: ['string', 'number', 'boolean', 'null'],
          },
        },
      },
    },
    required: ['spreadsheetId', 'range', 'valueInputOption', 'values'],
  },
};

export const updateValuesInRangeHandler = async (req: Request, res: Response) => {
  const { spreadsheetId, range, valueInputOption, values } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Missing required parameter: spreadsheetId' });
  }
  if (!range) {
    return res.status(400).json({ error: 'Missing required parameter: range' });
  }
  if (!valueInputOption) {
    return res.status(400).json({ error: 'Missing required parameter: valueInputOption' });
  }
  if (!values || !Array.isArray(values)) {
    return res.status(400).json({ error: 'Missing or invalid required parameter: values (must be an array of arrays)' });
  }

  try {
    const response = await axios.put(
      `${GOOGLE_SHEETS_API_SERVER_URL}/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=${valueInputOption}`,
      { values },
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
      res.status(500).json({ error: 'Failed to update values in range via internal Google Sheets API server' });
    }
  }
};
