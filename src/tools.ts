import { createSpreadsheetTool } from './api/tools/createSpreadsheet';
import { getSpreadsheetByIdTool } from './api/tools/getSpreadsheetById';
import { batchUpdateSpreadsheetByIdTool } from './api/tools/batchUpdateSpreadsheetById';
import { getValuesFromRangeTool } from './api/tools/getValuesFromRange';
import { batchGetValuesTool } from './api/tools/batchGetValues';
import { updateValuesInRangeTool } from './api/tools/updateValuesInRange';
import { batchUpdateValuesTool } from './api/tools/batchUpdateValues';
import { appendValuesToRangeTool } from './api/tools/appendValuesToRange';
import { clearValuesFromRangeTool } from './api/tools/clearValuesFromRange';
import { batchClearValuesTool } from './api/tools/batchClearValues';
import { getSpreadsheetByDataFilterTool } from './api/tools/getSpreadsheetByDataFilter';
import { batchGetValuesByDataFilterTool } from './api/tools/batchGetValuesByDataFilter';
import { batchClearValuesByDataFilterTool } from './api/tools/batchClearValuesByDataFilter';
import { copySheetToSpreadsheetTool } from './api/tools/copySheetToSpreadsheet';

export const tools = [
  createSpreadsheetTool,
  getSpreadsheetByIdTool,
  batchUpdateSpreadsheetByIdTool,
  getValuesFromRangeTool,
  batchGetValuesTool,
  updateValuesInRangeTool,
  batchUpdateValuesTool,
  appendValuesToRangeTool,
  clearValuesFromRangeTool,
  batchClearValuesTool,
  getSpreadsheetByDataFilterTool,
  batchGetValuesByDataFilterTool,
  batchClearValuesByDataFilterTool,
  copySheetToSpreadsheetTool,
];
