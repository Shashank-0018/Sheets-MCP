import { Request, Response } from 'express';
import axios from 'axios';
import { GOOGLE_SHEETS_API_SERVER_URL } from '../config';
import { createHeadersWithUserId } from '../../utils/userIdHelper';
export const clearValuesFromRangeTool = {
  name: 'clearValuesFromRange',
  description: 'Clears values from a spreadsheet.',
  parameters: {
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet.',
      },
      range: {
        type: 'string',
        description: 'The A1 notation of the values to clear.',
      },
    },
    required: ['spreadsheetId', 'range'],
  },
};

export const clearValuesFromRangeHandler = async (req: Request, res: Response) => {
  const { spreadsheetId, range } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Missing required parameter: spreadsheetId' });
  }
  if (!range) {
    return res.status(400).json({ error: 'Missing required parameter: range' });
  }

  try {
    // The clear endpoint typically expects an empty request body
    const response = await axios.post(
      `${GOOGLE_SHEETS_API_SERVER_URL}/spreadsheets/${spreadsheetId}/values/${range}/clear`,
      {}, // Empty body
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
      res.status(500).json({ error: 'Failed to clear values from range via internal Google Sheets API server' });
    }
  }
};
