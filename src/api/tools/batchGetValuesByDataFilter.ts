import { Request, Response } from 'express';
import axios from 'axios';

export const batchGetValuesByDataFilterTool = {
  name: 'batchGetValuesByDataFilter',
  description: 'Returns one or more ranges of values that match the specified data filters.',
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
    required: ['spreadsheetId', 'dataFilters'],
  },
};

export const batchGetValuesByDataFilterHandler = async (req: Request, res: Response) => {
  const { spreadsheetId, dataFilters, valueRenderOption, dateTimeRenderOption } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Missing required parameter: spreadsheetId' });
  }
  if (!dataFilters || !Array.isArray(dataFilters)) {
    return res.status(400).json({ error: 'Missing or invalid required parameter: dataFilters (must be an array)' });
  }

  try {
    const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY; // Or ACCESS_TOKEN
    if (!GOOGLE_SHEETS_API_KEY) {
      return res.status(500).json({ error: 'Google Sheets API key not configured.' });
    }

    const requestBody: any = { dataFilters };
    if (valueRenderOption) {
      requestBody.valueRenderOption = valueRenderOption;
    }
    if (dateTimeRenderOption) {
      requestBody.dateTimeRenderOption = dateTimeRenderOption;
    }

    const response = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGetByDataFilter`,
      requestBody,
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
      res.status(500).json({ error: 'Failed to batch get values by data filter via Google Sheets API' });
    }
  }
};
