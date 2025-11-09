import { Request, Response } from 'express';
import axios from 'axios';

const GOOGLE_SHEETS_API_SERVER_URL = process.env.GOOGLE_SHEETS_API_SERVER_URL ;

export const batchGetValuesTool = {
  name: 'batchGetValues',
  description: 'Returns one or more ranges of values from a spreadsheet.',
  parameters: {
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet.',
      },
      ranges: {
        type: 'string',
        description: 'The A1 notation of the ranges to retrieve (comma-separated).',
      },
      majorDimension: {
        type: 'string',
        description: 'The major dimension of the values (ROWS or COLUMNS).',
        enum: ['ROWS', 'COLUMNS'],
      },
      valueRenderOption: {
        type: 'string',
        description: 'How values should be represented in the output (FORMATTED_VALUE, UNFORMATTED_VALUE, FORMULA).',
        enum: ['FORMATTED_VALUE', 'UNFORMATTED_VALUE', 'FORMULA'],
      },
      dateTimeRenderOption: {
        type: 'string',
        description: 'How dates, times, and durations should be represented in the output (SERIAL_NUMBER, FORMATTED_STRING).',
        enum: ['SERIAL_NUMBER', 'FORMATTED_STRING'],
      },
    },
    required: ['spreadsheetId', 'ranges'],
  },
};

export const batchGetValuesHandler = async (req: Request, res: Response) => {
  const { spreadsheetId, ranges, majorDimension, valueRenderOption, dateTimeRenderOption } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Missing required parameter: spreadsheetId' });
  }
  if (!ranges) {
    return res.status(400).json({ error: 'Missing required parameter: ranges' });
  }

  try {
    const params: any = { ranges }; // Ranges can be multiple, comma-separated
    if (majorDimension) {
      params.majorDimension = majorDimension;
    }
    if (valueRenderOption) {
      params.valueRenderOption = valueRenderOption;
    }
    if (dateTimeRenderOption) {
      params.dateTimeRenderOption = dateTimeRenderOption;
    }

    const response = await axios.get(
      `${GOOGLE_SHEETS_API_SERVER_URL}/spreadsheets/${spreadsheetId}/values:batchGet`,
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
      res.status(500).json({ error: 'Failed to batch get values via internal Google Sheets API server' });
    }
  }
};
