# Google Sheets API v4 Endpoints Reference

This document provides a comprehensive reference of all available endpoints in the Google Sheets API v4, based on the [official discovery document](https://sheets.googleapis.com/$discovery/rest?version=v4).

---

## Base URL

```
https://sheets.googleapis.com
```

---

## Authentication

All endpoints require OAuth 2.0 authentication with one of the following **spreadsheets** scopes:

- `https://www.googleapis.com/auth/spreadsheets` - Full read/write access
- `https://www.googleapis.com/auth/spreadsheets.readonly` - Read-only access

**Note:** This document only includes endpoints that support the `spreadsheets` scope. Some endpoints may also support Drive scopes, but those are not listed here.

---

## 1. Spreadsheet Operations

### 1.1 Get Spreadsheet
**GET** `/v4/spreadsheets/{spreadsheetId}`

Returns the spreadsheet at the given ID.

**Parameters:**
- `spreadsheetId` (path, required) - The spreadsheet to request
- `ranges` (query, repeated) - The ranges to retrieve from the spreadsheet (A1 notation)
- `includeGridData` (query, boolean) - True if grid data should be returned
- `excludeTablesInBandedRanges` (query, boolean) - True if tables should be excluded in banded ranges

**Response:** `Spreadsheet` object

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)
- `https://www.googleapis.com/auth/spreadsheets.readonly` (read-only)

---

### 1.2 Create Spreadsheet
**POST** `/v4/spreadsheets`

Creates a spreadsheet, returning the newly created spreadsheet.

**Request Body:** `Spreadsheet` object

**Response:** `Spreadsheet` object

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)

---

### 1.3 Batch Update Spreadsheet
**POST** `/v4/spreadsheets/{spreadsheetId}:batchUpdate`

Applies one or more updates to the spreadsheet atomically. Each request is validated before being applied.

**Parameters:**
- `spreadsheetId` (path, required) - The spreadsheet to apply the updates to

**Request Body:** `BatchUpdateSpreadsheetRequest`
```json
{
  "requests": [
    {
      // Various request types: UpdateCellsRequest, InsertDimensionRequest, etc.
    }
  ],
  "includeSpreadsheetInResponse": false,
  "responseRanges": [],
  "responseIncludeGridData": false
}
```

**Response:** `BatchUpdateSpreadsheetResponse`

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)

---

### 1.4 Get Spreadsheet by Data Filter
**POST** `/v4/spreadsheets/{spreadsheetId}:getByDataFilter`

Returns the spreadsheet at the given ID, allowing selection of subsets using data filters.

**Parameters:**
- `spreadsheetId` (path, required) - The spreadsheet to request

**Request Body:** `GetSpreadsheetByDataFilterRequest`

**Response:** `Spreadsheet` object

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)

---

## 2. Values Operations

### 2.1 Get Values
**GET** `/v4/spreadsheets/{spreadsheetId}/values/{range}`

Returns a range of values from a spreadsheet.

**Parameters:**
- `spreadsheetId` (path, required) - The spreadsheet ID
- `range` (path, required) - The A1 notation of the values to retrieve
- `valueRenderOption` (query) - How values should be rendered (UNFORMATTED_VALUE, FORMATTED_VALUE, FORMULA)
- `dateTimeRenderOption` (query) - How dates should be rendered (SERIAL_NUMBER, FORMATTED_STRING)
- `majorDimension` (query) - The major dimension (ROWS, COLUMNS)

**Response:** `ValueRange` object

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)
- `https://www.googleapis.com/auth/spreadsheets.readonly` (read-only)

---

### 2.2 Batch Get Values
**GET** `/v4/spreadsheets/{spreadsheetId}/values:batchGet`

Returns one or more ranges of values from a spreadsheet.

**Parameters:**
- `spreadsheetId` (path, required) - The spreadsheet ID
- `ranges` (query, repeated) - The A1 notation ranges to retrieve
- `valueRenderOption` (query) - How values should be rendered
- `dateTimeRenderOption` (query) - How dates should be rendered
- `majorDimension` (query) - The major dimension

**Response:** `BatchGetValuesResponse`

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)
- `https://www.googleapis.com/auth/spreadsheets.readonly` (read-only)

---

### 2.3 Update Values
**PUT** `/v4/spreadsheets/{spreadsheetId}/values/{range}`

Sets values in a range of a spreadsheet.

**Parameters:**
- `spreadsheetId` (path, required) - The spreadsheet ID
- `range` (path, required) - The A1 notation of the values to update
- `valueInputOption` (query) - How input data should be interpreted (RAW, USER_ENTERED)
- `responseValueRenderOption` (query) - How values should be rendered in response
- `responseDateTimeRenderOption` (query) - How dates should be rendered in response
- `includeValuesInResponse` (query, boolean) - Whether to include updated values in response

**Request Body:** `ValueRange`
```json
{
  "range": "Sheet1!A1:B2",
  "majorDimension": "ROWS",
  "values": [
    ["Value1", "Value2"],
    ["Value3", "Value4"]
  ]
}
```

**Response:** `UpdateValuesResponse`

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)

---

### 2.4 Batch Update Values
**POST** `/v4/spreadsheets/{spreadsheetId}/values:batchUpdate`

Sets values in one or more ranges of a spreadsheet.

**Parameters:**
- `spreadsheetId` (path, required) - The spreadsheet ID
- `valueInputOption` (query) - How input data should be interpreted
- `responseValueRenderOption` (query) - How values should be rendered in response
- `responseDateTimeRenderOption` (query) - How dates should be rendered in response
- `includeValuesInResponse` (query, boolean) - Whether to include updated values in response

**Request Body:** `BatchUpdateValuesRequest`
```json
{
  "valueInputOption": "USER_ENTERED",
  "data": [
    {
      "range": "Sheet1!A1:B2",
      "values": [["Value1", "Value2"]]
    }
  ]
}
```

**Response:** `BatchUpdateValuesResponse`

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)

---

### 2.5 Append Values
**POST** `/v4/spreadsheets/{spreadsheetId}/values/{range}:append`

Appends values to a spreadsheet.

**Parameters:**
- `spreadsheetId` (path, required) - The spreadsheet ID
- `range` (path, required) - The A1 notation of a range to search for a table
- `valueInputOption` (query) - How input data should be interpreted
- `insertDataOption` (query) - How input data should be inserted (OVERWRITE, INSERT_ROWS)
- `responseValueRenderOption` (query) - How values should be rendered in response
- `responseDateTimeRenderOption` (query) - How dates should be rendered in response
- `includeValuesInResponse` (query, boolean) - Whether to include appended values in response

**Request Body:** `ValueRange`

**Response:** `AppendValuesResponse`

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)

---

### 2.6 Clear Values
**POST** `/v4/spreadsheets/{spreadsheetId}/values/{range}:clear`

Clears values from a spreadsheet.

**Parameters:**
- `spreadsheetId` (path, required) - The spreadsheet ID
- `range` (path, required) - The A1 notation of the values to clear

**Request Body:** `ClearValuesRequest` (optional)

**Response:** `ClearValuesResponse`

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)

---

### 2.7 Batch Clear Values
**POST** `/v4/spreadsheets/{spreadsheetId}/values:batchClear`

Clears one or more ranges of values from a spreadsheet.

**Parameters:**
- `spreadsheetId` (path, required) - The spreadsheet ID

**Request Body:** `BatchClearValuesRequest`
```json
{
  "ranges": ["Sheet1!A1:B2", "Sheet1!D1:E2"]
}
```

**Response:** `BatchClearValuesResponse`

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)

---

### 2.8 Batch Get Values by Data Filter
**POST** `/v4/spreadsheets/{spreadsheetId}/values:batchGetByDataFilter`

Returns one or more ranges of values that match the specified data filters.

**Parameters:**
- `spreadsheetId` (path, required) - The spreadsheet ID

**Request Body:** `BatchGetValuesByDataFilterRequest`

**Response:** `BatchGetValuesByDataFilterResponse`

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)

---

### 2.9 Batch Clear Values by Data Filter
**POST** `/v4/spreadsheets/{spreadsheetId}/values:batchClearByDataFilter`

Clears one or more ranges of values from a spreadsheet using data filters.

**Parameters:**
- `spreadsheetId` (path, required) - The spreadsheet ID

**Request Body:** `BatchClearValuesByDataFilterRequest`

**Response:** `BatchClearValuesByDataFilterResponse`

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)

---

## 3. Sheet Operations

### 3.1 Copy Sheet
**POST** `/v4/spreadsheets/{spreadsheetId}/sheets/{sheetId}:copyTo`

Copies a sheet from one spreadsheet to another.

**Parameters:**
- `spreadsheetId` (path, required) - The ID of the spreadsheet containing the sheet to copy
- `sheetId` (path, required) - The ID of the sheet to copy

**Request Body:** `CopySheetToAnotherSpreadsheetRequest`
```json
{
  "destinationSpreadsheetId": "target_spreadsheet_id"
}
```

**Response:** `SheetProperties`

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)

---

## 4. Developer Metadata Operations

### 4.1 Get Developer Metadata
**GET** `/v4/spreadsheets/{spreadsheetId}/developerMetadata/{metadataId}`

Returns the developer metadata with the specified ID.

**Parameters:**
- `spreadsheetId` (path, required) - The spreadsheet ID
- `metadataId` (path, required) - The developer metadata's unique metadata ID

**Response:** `DeveloperMetadata`

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)

---

### 4.2 Search Developer Metadata
**POST** `/v4/spreadsheets/{spreadsheetId}/developerMetadata:search`

Returns all developer metadata matching the specified DataFilter.

**Parameters:**
- `spreadsheetId` (path, required) - The ID of the spreadsheet to retrieve metadata from

**Request Body:** `SearchDeveloperMetadataRequest`

**Response:** `SearchDeveloperMetadataResponse`

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` (read/write)

---

## Common Request Types for batchUpdate

The `batchUpdate` endpoint accepts various request types in the `requests` array:

- **UpdateCellsRequest** - Updates cells in a range
- **InsertDimensionRequest** - Inserts rows or columns
- **DeleteDimensionRequest** - Deletes rows or columns
- **UpdateDimensionPropertiesRequest** - Updates dimension properties
- **InsertRangeRequest** - Inserts a new range
- **DeleteRangeRequest** - Deletes a range
- **AppendCellsRequest** - Appends cells
- **ClearBasicFilterRequest** - Clears the basic filter
- **SetBasicFilterRequest** - Sets the basic filter
- **UpdateBordersRequest** - Updates borders
- **UpdateCellsRequest** - Updates cells
- **AddSheetRequest** - Adds a new sheet
- **DeleteSheetRequest** - Deletes a sheet
- **UpdateSheetPropertiesRequest** - Updates sheet properties
- **CopyPasteRequest** - Copies and pastes data
- **CutPasteRequest** - Cuts and pastes data
- **MergeCellsRequest** - Merges cells
- **UnmergeCellsRequest** - Unmerges cells
- **UpdateBandingRequest** - Updates banded ranges
- **AddBandingRequest** - Adds banded ranges
- **DeleteBandingRequest** - Deletes banded ranges
- **AddChartRequest** - Adds a chart
- **UpdateChartSpecRequest** - Updates chart specifications
- **DeleteEmbeddedObjectRequest** - Deletes embedded objects
- **UpdateEmbeddedObjectPositionRequest** - Updates embedded object positions
- **AddConditionalFormatRuleRequest** - Adds conditional formatting rules
- **UpdateConditionalFormatRuleRequest** - Updates conditional formatting rules
- **DeleteConditionalFormatRuleRequest** - Deletes conditional formatting rules
- **SortRangeRequest** - Sorts a range
- **SetDataValidationRequest** - Sets data validation
- **DeleteProtectedRangeRequest** - Deletes protected ranges
- **AddProtectedRangeRequest** - Adds protected ranges
- **UpdateProtectedRangeRequest** - Updates protected ranges
- **AutoResizeDimensionsRequest** - Auto-resizes dimensions
- **AddDimensionGroupRequest** - Adds dimension groups
- **DeleteDimensionGroupRequest** - Deletes dimension groups
- **UpdateDimensionGroupRequest** - Updates dimension groups
- **CreateDeveloperMetadataRequest** - Creates developer metadata
- **UpdateDeveloperMetadataRequest** - Updates developer metadata
- **DeleteDeveloperMetadataRequest** - Deletes developer metadata
- **RandomizeRangeRequest** - Randomizes a range
- **AddDataSourceRequest** - Adds a data source
- **UpdateDataSourceRequest** - Updates a data source
- **DeleteDataSourceRequest** - Deletes a data source
- **RefreshDataSourceRequest** - Refreshes a data source
- **CancelDataSourceRefreshRequest** - Cancels a data source refresh

---

## Notes

- **Delete entire spreadsheet:** Not available in Sheets API. Use Google Drive API `files.delete` endpoint
- **A1 Notation:** Ranges use A1 notation (e.g., `Sheet1!A1:B2`) or R1C1 notation
- **Batch Operations:** Use `batchUpdate` for atomic operations that should succeed or fail together
- **Rate Limits:** Be aware of API rate limits when making multiple requests
- **Field Masks:** Use field masks to retrieve only specific fields and improve performance

---

## Reference Links

- [Official Google Sheets API Documentation](https://developers.google.com/sheets/api/reference/rest)
- [Discovery Document](https://sheets.googleapis.com/$discovery/rest?version=v4)
- [A1 Notation Guide](https://developers.google.com/workspace/sheets/api/guides/concepts#cell)
- [Field Masks Guide](https://developers.google.com/workspace/sheets/api/guides/field-masks)
