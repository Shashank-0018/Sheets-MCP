import { Request, Response } from 'express';
import axios from 'axios';
import { GOOGLE_SHEETS_API_SERVER_URL } from '../config';

export const getValuesFromRangeTool = {
  name: 'getValuesFromRange',
  description: 'Returns a range of values from a spreadsheet.',
  parameters: {
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet.',
      },
      range: {
        type: 'string',
        description: 'The A1 notation of the range to retrieve.',
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
    required: ['spreadsheetId', 'range'],
  },
};

export const getValuesFromRangeHandler = async (req: Request, res: Response) => {
  const { spreadsheetId, range, majorDimension, valueRenderOption, dateTimeRenderOption } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Missing required parameter: spreadsheetId' });
  }
  if (!range) {
    return res.status(400).json({ error: 'Missing required parameter: range' });
  }

  try {
    const params: any = {};
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
      `${GOOGLE_SHEETS_API_SERVER_URL}/spreadsheets/${spreadsheetId}/values/${range}`,
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
      res.status(500).json({ error: 'Failed to get values from range via internal Google Sheets API server' });
    }
  }
};
