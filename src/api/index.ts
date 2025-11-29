import express from 'express';
import { mcpAuthMiddleware } from '../middleware/auth';
import { createSpreadsheetHandler } from './tools/createSpreadsheet';
import { getSpreadsheetByIdHandler } from './tools/getSpreadsheetById';
import { batchUpdateSpreadsheetByIdHandler } from './tools/batchUpdateSpreadsheetById';
import { getValuesFromRangeHandler } from './tools/getValuesFromRange';
import { batchGetValuesHandler } from './tools/batchGetValues';
import { updateValuesInRangeHandler } from './tools/updateValuesInRange';
import { batchUpdateValuesHandler } from './tools/batchUpdateValues';
import { appendValuesToRangeHandler } from './tools/appendValuesToRange';
import { clearValuesFromRangeHandler } from './tools/clearValuesFromRange';
import { batchClearValuesHandler } from './tools/batchClearValues';
import { getSpreadsheetByDataFilterHandler } from './tools/getSpreadsheetByDataFilter';
import { batchGetValuesByDataFilterHandler } from './tools/batchGetValuesByDataFilter';
import { batchClearValuesByDataFilterHandler } from './tools/batchClearValuesByDataFilter';
import { copySheetToSpreadsheetHandler } from './tools/copySheetToSpreadsheet';

const router = express.Router();

// Apply MCP Bearer token authentication to all API routes
// Best Practice: Enforce MCP Bearer token auth for all tool endpoints
router.use(mcpAuthMiddleware);

router.post('/tools/createSpreadsheet', createSpreadsheetHandler);
router.post('/tools/getSpreadsheetById', getSpreadsheetByIdHandler);
router.post('/tools/batchUpdateSpreadsheetById', batchUpdateSpreadsheetByIdHandler);
router.post('/tools/getValuesFromRange', getValuesFromRangeHandler);
router.post('/tools/batchGetValues', batchGetValuesHandler);
router.post('/tools/updateValuesInRange', updateValuesInRangeHandler);
router.post('/tools/batchUpdateValues', batchUpdateValuesHandler);
router.post('/tools/appendValuesToRange', appendValuesToRangeHandler);
router.post('/tools/clearValuesFromRange', clearValuesFromRangeHandler);
router.post('/tools/batchClearValues', batchClearValuesHandler);
router.post('/tools/getSpreadsheetByDataFilter', getSpreadsheetByDataFilterHandler);
router.post('/tools/batchGetValuesByDataFilter', batchGetValuesByDataFilterHandler);
router.post('/tools/batchClearValuesByDataFilter', batchClearValuesByDataFilterHandler);
router.post('/tools/copySheetToSpreadsheet', copySheetToSpreadsheetHandler);

export default router;
