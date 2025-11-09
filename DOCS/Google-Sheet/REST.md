# Google Sheets API

Reads and writes Google Sheets.

- [REST Resource: v4.spreadsheets](https://developers.google.com/workspace/sheets/api/reference/rest#v4.spreadsheets)
- [REST Resource: v4.spreadsheets.developerMetadata](https://developers.google.com/workspace/sheets/api/reference/rest#v4.spreadsheets.developerMetadata)
- [REST Resource: v4.spreadsheets.sheets](https://developers.google.com/workspace/sheets/api/reference/rest#v4.spreadsheets.sheets)
- [REST Resource: v4.spreadsheets.values](https://developers.google.com/workspace/sheets/api/reference/rest#v4.spreadsheets.values)

## Service: sheets.googleapis.com

To call this service, we recommend that you use the Google-provided [client libraries](https://cloud.google.com/apis/docs/client-libraries-explained). If your application needs to use your own libraries to call this service, use the following information when you make the API requests.

### Discovery document

A [Discovery Document](https://developers.google.com/discovery/v1/reference/apis) is a machine-readable specification for describing and consuming REST APIs. It is used to build client libraries, IDE plugins, and other tools that interact with Google APIs. One service may provide multiple discovery documents. This service provides the following discovery document:

- <https://sheets.googleapis.com/$discovery/rest?version=v4>

### Service endpoint

A [service endpoint](https://cloud.google.com/apis/design/glossary#api_service_endpoint) is a base URL that specifies the network address of an API service. One service might have multiple service endpoints. This service has the following service endpoint and all URIs below are relative to this service endpoint:

- `https://sheets.googleapis.com`

## REST Resource: [v4.spreadsheets](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets)

|                                                                                                          Methods                                                                                                          ||
|----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| [batchUpdate](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate)         | `POST /v4/spreadsheets/{spreadsheetId}:batchUpdate` Applies one or more updates to the spreadsheet. |
| [create](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/create)                   | `POST /v4/spreadsheets` Creates a spreadsheet, returning the newly created spreadsheet.             |
| [get](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/get)                         | `GET /v4/spreadsheets/{spreadsheetId}` Returns the spreadsheet at the given ID.                     |
| [getByDataFilter](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/getByDataFilter) | `POST /v4/spreadsheets/{spreadsheetId}:getByDataFilter` Returns the spreadsheet at the given ID.    |

## REST Resource: [v4.spreadsheets.developerMetadata](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.developerMetadata)

|                                                                                                                                                                   Methods                                                                                                                                                                   ||
|----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [get](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.developerMetadata/get)       | `GET /v4/spreadsheets/{spreadsheetId}/developerMetadata/{metadataId}` Returns the developer metadata with the specified ID.                                                                                           |
| [search](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.developerMetadata/search) | `POST /v4/spreadsheets/{spreadsheetId}/developerMetadata:search` Returns all developer metadata matching the specified [DataFilter](https://developers.google.com/workspace/sheets/api/reference/rest/v4/DataFilter). |

## REST Resource: [v4.spreadsheets.sheets](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.sheets)

|                                                                                                                   Methods                                                                                                                   ||
|-----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| [copyTo](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.sheets/copyTo) | `POST /v4/spreadsheets/{spreadsheetId}/sheets/{sheetId}:copyTo` Copies a single sheet from a spreadsheet to another spreadsheet. |

## REST Resource: [v4.spreadsheets.values](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values)

|                                                                                                                                           Methods                                                                                                                                            ||
|---------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| [append](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append)                                   | `POST /v4/spreadsheets/{spreadsheetId}/values/{range}:append` Appends values to a spreadsheet.                                                  |
| [batchClear](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchClear)                           | `POST /v4/spreadsheets/{spreadsheetId}/values:batchClear` Clears one or more ranges of values from a spreadsheet.                               |
| [batchClearByDataFilter](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchClearByDataFilter)   | `POST /v4/spreadsheets/{spreadsheetId}/values:batchClearByDataFilter` Clears one or more ranges of values from a spreadsheet.                   |
| [batchGet](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet)                               | `GET /v4/spreadsheets/{spreadsheetId}/values:batchGet` Returns one or more ranges of values from a spreadsheet.                                 |
| [batchGetByDataFilter](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGetByDataFilter)       | `POST /v4/spreadsheets/{spreadsheetId}/values:batchGetByDataFilter` Returns one or more ranges of values that match the specified data filters. |
| [batchUpdate](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate)                         | `POST /v4/spreadsheets/{spreadsheetId}/values:batchUpdate` Sets values in one or more ranges of a spreadsheet.                                  |
| [batchUpdateByDataFilter](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdateByDataFilter) | `POST /v4/spreadsheets/{spreadsheetId}/values:batchUpdateByDataFilter` Sets values in one or more ranges of a spreadsheet.                      |
| [clear](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/clear)                                     | `POST /v4/spreadsheets/{spreadsheetId}/values/{range}:clear` Clears values from a spreadsheet.                                                  |
| [get](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get)                                         | `GET /v4/spreadsheets/{spreadsheetId}/values/{range}` Returns a range of values from a spreadsheet.                                             |
| [update](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/update)                                   | `PUT /v4/spreadsheets/{spreadsheetId}/values/{range}` Sets values in a range of a spreadsheet.                                                  |