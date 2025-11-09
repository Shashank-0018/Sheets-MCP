# Google Sheets API v4 Endpoints

This document lists the primary Google Sheets API v4 endpoints for reading, writing, and updating spreadsheet data.

## Spreadsheet Endpoints

### Create Spreadsheet

- **POST** `/v4/spreadsheets`
- **Description:** Creates a spreadsheet, returning the newly created spreadsheet.
- **Request Body:**
  - `properties` (object): Spreadsheet properties (title, locale, etc.)
  - `sheets` (array): Initial sheets to create

### Get Spreadsheet

- **GET** `/v4/spreadsheets/{spreadsheetId}`
- **Description:** Returns the spreadsheet at the given ID.
- **Parameters:**
  - `spreadsheetId` (string, path): The spreadsheet ID.
  - `ranges` (string, query): The ranges to retrieve, in A1 notation.
  - `includeGridData` (boolean, query): True if grid data should be returned.

### Batch Update Spreadsheet

- **POST** `/v4/spreadsheets/{spreadsheetId}:batchUpdate`
- **Description:** Applies one or more updates to the spreadsheet.
- **Parameters:**
  - `spreadsheetId` (string, path): The spreadsheet ID.
- **Request Body:**
  - `requests` (array): A list of requests to apply to the spreadsheet.

## Values Endpoints

### Get Values

- **GET** `/v4/spreadsheets/{spreadsheetId}/values/{range}`
- **Description:** Returns a range of values from a spreadsheet.
- **Parameters:**
  - `spreadsheetId` (string, path): The spreadsheet ID.
  - `range` (string, path): The A1 notation of the range to retrieve.
  - `majorDimension` (string, query): The major dimension of the values.
  - `valueRenderOption` (string, query): How values should be represented in the output.
  - `dateTimeRenderOption` (string, query): How dates, times, and durations should be represented in the output.

### Batch Get Values

- **GET** `/v4/spreadsheets/{spreadsheetId}/values:batchGet`
- **Description:** Returns one or more ranges of values from a spreadsheet.
- **Parameters:**
  - `spreadsheetId` (string, path): The spreadsheet ID.
  - `ranges` (string, query): The A1 notation of the ranges to retrieve.
  - `majorDimension` (string, query): The major dimension of the values.
  - `valueRenderOption` (string, query): How values should be represented in the output.
  - `dateTimeRenderOption` (string, query): How dates, times, and durations should be represented in the output.

### Update Values

- **PUT** `/v4/spreadsheets/{spreadsheetId}/values/{range}`
- **Description:** Sets values in a range of a spreadsheet.
- **Parameters:**
  - `spreadsheetId` (string, path): The spreadsheet ID.
  - `range` (string, path): The A1 notation of the range to update.
  - `valueInputOption` (string, query): How the input data should be interpreted.
- **Request Body:**
  - `values` (array): The new values to apply to the spreadsheet.

### Batch Update Values

- **POST** `/v4/spreadsheets/{spreadsheetId}/values:batchUpdate`
- **Description:** Sets values in one or more ranges of a spreadsheet.
- **Parameters:**
  - `spreadsheetId` (string, path): The spreadsheet ID.
- **Request Body:**
  - `data` (array): The new values to apply to the spreadsheet.
  - `valueInputOption` (string): How the input data should be interpreted.

### Append Values

- **POST** `/v4/spreadsheets/{spreadsheetId}/values/{range}:append`
- **Description:** Appends values to a spreadsheet.
- **Parameters:**
  - `spreadsheetId` (string, path): The spreadsheet ID.
  - `range` (string, path): The A1 notation of a range to search for a logical table of data.
  - `valueInputOption` (string, query): How the input data should be interpreted.
  - `insertDataOption` (string, query): How the input data should be inserted.
- **Request Body:**
  - `values` (array): The new values to apply to the spreadsheet.

### Clear Values

- **POST** `/v4/spreadsheets/{spreadsheetId}/values/{range}:clear`
- **Description:** Clears values from a spreadsheet.
- **Parameters:**
  - `spreadsheetId` (string, path): The spreadsheet ID.
  - `range` (string, path): The A1 notation of the values to clear.

### Batch Clear Values

- **POST** `/v4/spreadsheets/{spreadsheetId}/values:batchClear`
- **Description:** Clears one or more ranges of values from a spreadsheet.
- **Parameters:**
  - `spreadsheetId` (string, path): The spreadsheet ID.
- **Request Body:**
  - `ranges` (array): The A1 notation ranges to clear.

### Get Spreadsheet by Data Filter

- **POST** `/v4/spreadsheets/{spreadsheetId}:getByDataFilter`
- **Description:** Returns the spreadsheet at the given ID, allowing selection of subsets using data filters.
- **Parameters:**
  - `spreadsheetId` (string, path): The spreadsheet ID.
- **Request Body:**
  - `dataFilters` (array): The data filters to apply.

### Batch Get Values by Data Filter

- **POST** `/v4/spreadsheets/{spreadsheetId}/values:batchGetByDataFilter`
- **Description:** Returns one or more ranges of values that match the specified data filters.
- **Parameters:**
  - `spreadsheetId` (string, path): The spreadsheet ID.
- **Request Body:**
  - `dataFilters` (array): The data filters to apply.
  - `valueRenderOption` (string): How values should be rendered.
  - `dateTimeRenderOption` (string): How dates should be rendered.

### Batch Clear Values by Data Filter

- **POST** `/v4/spreadsheets/{spreadsheetId}/values:batchClearByDataFilter`
- **Description:** Clears one or more ranges of values from a spreadsheet using data filters.
- **Parameters:**
  - `spreadsheetId` (string, path): The spreadsheet ID.
- **Request Body:**
  - `dataFilters` (array): The data filters to apply.

## Sheet Operations

### Copy Sheet

- **POST** `/v4/spreadsheets/{spreadsheetId}/sheets/{sheetId}:copyTo`
- **Description:** Copies a sheet from one spreadsheet to another.
- **Parameters:**
  - `spreadsheetId` (string, path): The ID of the spreadsheet containing the sheet to copy.
  - `sheetId` (string, path): The ID of the sheet to copy.
- **Request Body:**
  - `destinationSpreadsheetId` (string): The ID of the spreadsheet to copy the sheet to.
