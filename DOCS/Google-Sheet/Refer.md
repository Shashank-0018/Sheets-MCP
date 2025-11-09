# Basic reading

The Google Sheets API allows you to read values from cells, ranges, sets of ranges,
and entire sheets. The examples on this page illustrate some common read
operations with the
[`spreadsheets.values`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values)
resource. You can also read cell values using the
[`spreadsheets.get`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/get) method, but
usually
[`spreadsheets.values.get`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get)
or
[`spreadsheets.values.batchGet`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet)
is easier.

These examples are presented in the form of HTTP requests to be language
neutral. To learn how to implement reads in different languages using the Google
API client libraries, see [Read \& write cell
values](https://developers.google.com/workspace/sheets/api/guides/values#read).

In these examples, the placeholder <var translate="no">SPREADSHEET_ID</var> indicates where you
would provide the [spreadsheet ID](https://developers.google.com/workspace/sheets/api/guides/concepts#spreadsheet),
which can be discovered from the spreadsheet URL. The ranges to read from are
specified using [A1 notation](https://developers.google.com/workspace/sheets/api/guides/concepts#cell) in the request
URL. An example range is Sheet1!A1:D5.

## Source data

For these examples, assume the spreadsheet being read has the following source
data in its first sheet ("Sheet1"). The strings in the first row are labels for
the individual columns. To view examples of how to read from other sheets in
your spreadsheet, see [A1 notation](https://developers.google.com/workspace/sheets/api/guides/concepts#cell).

|---|--------|--------|---------|-----------|
|   | A      | B      | C       | D         |
| 1 | Item   | Cost   | Stocked | Ship Date |
| 2 | Wheel  | $20.50 | 4       | 3/1/2016  |
| 3 | Door   | $15    | 2       | 3/15/2016 |
| 4 | Engine | $100   | 1       | 3/20/2016 |
| 5 | Totals | $135.5 | 7       | 3/20/2016 |

## Read a single range

The following
[`spreadsheets.values.get`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get)
code sample shows how to read the values from the range Sheet1!A1:D5 and returns
them in the response. Empty trailing rows and columns are omitted.

The request protocol is shown here.  

```
GET https://sheets.googleapis.com/v4/spreadsheets/SPREADSHEET_ID/values/Sheet1!A1:D5
```

The response consists of a
[`ValueRange`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#resource:-valuerange)
object that describes the range values. The
[`majorDimension`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values) field
indicates that the arrays are lists of values organized by rows.  

```text
{
  "range": "Sheet1!A1:D5",
  "majorDimension": "ROWS",
  "values": [
    ["Item", "Cost", "Stocked", "Ship Date"],
    ["Wheel", "$20.50", "4", "3/1/2016"],
    ["Door", "$15", "2", "3/15/2016"],
    ["Engine", "$100", "1", "30/20/2016"],
    ["Totals", "$135.5", "7", "3/20/2016"]
  ],
}
```

## Read a single range grouped by column

The following
[`spreadsheets.values.get`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get)
code sample shows how to read the values from the range Sheet1!A1:D3 and returns
them in the response, but grouped by column. Empty trailing rows and columns are
omitted.

The request protocol is shown here.  

```
GET https://sheets.googleapis.com/v4/spreadsheets/SPREADSHEET_ID/values/Sheet1!A1:D3?majorDimension=COLUMNS
```

The response consists of a
[`ValueRange`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#resource:-valuerange)
object that describes the range values. The
[`majorDimension`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values) field
indicates that the arrays are lists of values organized by columns.  

```text
{
  "range": "Sheet1!A1:D3",
  "majorDimension": "COLUMNS",
  "values": [
    ["Item", "Wheel", "Door"],
    ["Cost", "$20.50", "$15"],
    ["Stocked", "4", "2"],
    ["Ship Date", "3/1/2016", "3/15/2016"]
  ],
}
```

## Read a single range with rendering options

The following
[`spreadsheets.values.get`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get)
code sample shows how to read the values from the range Sheet1!A1:D5 and returns
them in the response, but uses rendering options to manage how that information
is returned. The
[`ValueRenderOption`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueRenderOption) setting
of `FORMULA` indicates that formulas are to be returned instead of the
calculated value, and the
[`DateTimeRenderOption`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/DateTimeRenderOption)
setting of `SERIAL_NUMBER` indicates that dates are to be returned as numbers.
Other settings are possible as well. Empty trailing rows and columns are
omitted.

The request protocol is shown here.  

```
GET https://sheets.googleapis.com/v4/spreadsheets/SPREADSHEET_ID/values/Sheet1!A1:D5?
            valueRenderOption=FORMULA&dateTimeRenderOption=SERIAL_NUMBER
```

The response consists of a
[`ValueRange`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#resource:-valuerange)
object that describes the range values. The
[`majorDimension`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values) field
indicates that the arrays are lists of values organized by rows.  

```text
{
  "range": "Sheet1!A1:D5",
  "majorDimension": "ROWS",
  "values": [
    ["Item", "Cost", "Stocked", "Ship Date"],
    ["Wheel", "$20.50", "4", "42430"],
    ["Door", "$15", "2", "42444"],
    ["Engine", "$100", "1", "42449"],
    ["Totals", "=SUM(B2:B4)", "=SUM(C2:C4)", "=MAX(D2:D4)"]
  ],
}
```

## Read multiple ranges

The following
[`spreadsheets.values.batchGet`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet)
code sample shows how to read values from ranges Sheet1!B:B and Sheet1!D:D and
returns them in the response. The
[`ValueRenderOption`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueRenderOption) setting
of `UNFORMATTED_VALUE` indicates that values are calculated, but not formatted
in the response. Empty trailing rows and columns are omitted.

The request protocol is shown here.  

```
GET https://sheets.googleapis.com/v4/spreadsheets/SPREADSHEET_ID/values:batchGet?
            ranges=Sheet1!B:B&ranges=Sheet1!D:D&valueRenderOption=UNFORMATTED_VALUE&majorDimension=COLUMNS
```

The response to this method call consists of an object with the spreadsheet ID
and an array of
[`ValueRange`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#resource:-valuerange)
objects corresponding to each requested range, listed in the order they were
requested. The
[`majorDimension`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values) field
indicates that the arrays are lists of values organized by columns. For example:  

```scdoc
{
  "spreadsheetId": SPREADSHEET_ID,
  "valueRanges": [
    {
      "range": "Sheet1!B1:B1000",
      "majorDimension": "COLUMNS",
      "values": [
        ["Cost",20.5,15,100,135.5]
      ]
    },
    {
      "range": "Sheet1!D1:D1000",
      "majorDimension": "COLUMNS",
      "values": [
        ["Ship Date",42430,42444,42449,42449]
      ]s
    }
  ]
}
```

## Read multiple ranges across multiple sheets

The following
[`spreadsheets.values.batchGet`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet)
code sample shows how to read values from ranges in sheets Sheet1!A1:D5,
Products!D1:D100, and Sales!E4:F6 and returns them in the response. The
[`ValueRenderOption`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueRenderOption) setting
of `UNFORMATTED_VALUE` indicates that values are calculated, but not formatted
in the response. Empty trailing rows and columns are omitted.

The request protocol is shown here.  

```
GET https://sheets.googleapis.com/v4/spreadsheets/SPREADSHEET_ID/values:batchGet?
            ranges=Sheet1!A1:D5&ranges=Products!D1:D100&ranges=Sales!E4:F6&valueRenderOption=UNFORMATTED_VALUE&majorDimension=COLUMNS
```

The response to this method call consists of an object with the spreadsheet ID
and an array of
[`ValueRange`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#resource:-valuerange)
objects corresponding to each requested range, listed in the order they were
requested. The
[`majorDimension`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values) field
indicates that the arrays are lists of values organized by columns. For example:  

```scdoc
{
  "spreadsheetId": SPREADSHEET_ID,
  "valueRanges": [
    {
      "range": "Sheet1!A1:D5",
      "majorDimension": "COLUMNS",
      "values": [
        [...],
        [...]
      ]
    },
    {
      "range": "Products!D1:D100",
      "majorDimension": "COLUMNS",
      "values": [
        [...]
      ]
    },
    {
      "range": "Sales!E4:F6",
      "majorDimension": "COLUMNS",
      "values": [
        [...],
        [...]
      ]
    }
  ]
}
```