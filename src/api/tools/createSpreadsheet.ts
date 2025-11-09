import { Request, Response } from 'express';
import axios from 'axios';

export const createSpreadsheetTool = {
  name: 'createSpreadsheet',
  description: 'Creates a new Google Sheet spreadsheet.',
  parameters: {
    type: 'object',
    properties: {
      properties: {
        type: 'object',
        description: 'Properties of the spreadsheet, such as title and locale.',
        properties: {
          title: { type: 'string', description: 'The title of the spreadsheet.' },
          locale: { type: 'string', description: 'The locale of the spreadsheet (e.g., "en_US").' },
          autoRecalculation: { type: 'string', description: 'How formulas are recalculated (e.g., "ON_CHANGE").' },
          defaultFormat: { type: 'object', description: 'The default format of a cell in the spreadsheet.' },
          timezone: { type: 'string', description: 'The time zone of the spreadsheet (e.g., "America/Los_Angeles").' },
        },
        required: ['title'], // Assuming title is required for properties
      },
      sheets: {
        type: 'array',
        description: 'Initial sheets to create within the spreadsheet.',
        items: {
          type: 'object',
          properties: {
            properties: {
              type: 'object',
              description: 'Properties of the sheet.',
              properties: {
                sheetId: { type: 'number', description: 'The ID of the sheet.' },
                title: { type: 'string', description: 'The title of the sheet.' },
                index: { type: 'number', description: 'The index of the sheet in the spreadsheet.' },
                sheetType: { type: 'string', description: 'The type of the sheet (e.g., "GRID").' },
                gridProperties: { type: 'object', description: 'Properties of the grid, if it is a grid sheet.' },
              },
              required: ['title'], // Assuming title is required for sheet properties
            },
          },
        },
      },
    },
    required: ['properties'], // Assuming at least properties with a title is required to create a spreadsheet
  },
};

export const createSpreadsheetHandler = async (req: Request, res: Response) => {
  const { properties, sheets } = req.body;

  if (!properties || !properties.title) {
    return res.status(400).json({ error: 'Missing required parameter: properties.title' });
  }

  try {
    const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY; // Or ACCESS_TOKEN
    if (!GOOGLE_SHEETS_API_KEY) {
      return res.status(500).json({ error: 'Google Sheets API key not configured.' });
    }

    const response = await axios.post(
      'https://sheets.googleapis.com/v4/spreadsheets',
      { properties, sheets },
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
      res.status(500).json({ error: 'Failed to create spreadsheet via Google Sheets API' });
    }
  }
};
