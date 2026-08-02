/**
 * Google Apps Script Web App Backend for Monthly Budget Board
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Copy and paste this code into Code.gs.
 * 4. Click Deploy > New Deployment.
 * 5. Select type "Web App", set "Execute as": Me, "Who has access": Anyone.
 * 6. Copy the Web App URL into your Budget App Settings.
 */

var DEFAULT_SHEET_NAME = 'Active Budget';

function getTargetSheet(e) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = DEFAULT_SHEET_NAME;

  if (e && e.parameter) {
    if (e.parameter.sheet) {
      sheetName = e.parameter.sheet;
    } else if (e.parameter.sheetName) {
      sheetName = e.parameter.sheetName;
    }
  }

  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

function doGet(e) {
  try {
    var sheet = getTargetSheet(e);
    var data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createJsonResponse([]);
    }
    
    var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var colIndex = headers.indexOf('column');
    if (colIndex === -1) colIndex = 0;

    var cashIndex = headers.indexOf('cash');
    if (cashIndex !== -1 && headers.indexOf('title') === -1) {
      var envelopes = [];
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (!row[colIndex]) continue;
        envelopes.push({
          columnId: String(row[colIndex]),
          cash: Number(row[cashIndex]) || 0
        });
      }
      return createJsonResponse(envelopes);
    }
    
    var titleIndex = headers.indexOf('title');
    var descIndex = headers.indexOf('description');
    var amountIndex = headers.indexOf('amount');

    // Fallbacks if header names differ slightly
    if (titleIndex === -1) titleIndex = 1;
    if (descIndex === -1) descIndex = 2;
    if (amountIndex === -1) amountIndex = 3;
    
    var cards = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[titleIndex] && !row[amountIndex]) continue;
      cards.push({
        columnId: String(row[colIndex] || 'backlog'),
        title: String(row[titleIndex] || ''),
        description: String(row[descIndex] || ''),
        amount: Number(row[amountIndex]) || 0
      });
    }
    
    return createJsonResponse(cards);
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    var sheet = getTargetSheet(e);
    var contents = e.postData ? e.postData.contents : '';
    var items = JSON.parse(contents);
    
    if (!Array.isArray(items)) {
      return createJsonResponse({ status: 'error', message: 'Expected JSON array' });
    }
    
    var isEnvelopeSync = (e && e.parameter && (e.parameter.type === 'envelopes' || e.parameter.sheet === 'Envelopes')) ||
                         (items.length > 0 && items[0].cash !== undefined && items[0].title === undefined);

    sheet.clearContents();
    
    if (isEnvelopeSync) {
      sheet.appendRow(['Column', 'Cash']);
      items.forEach(function(env) {
        sheet.appendRow([
          env.columnId || env.column || '',
          Number(env.cash) || 0
        ]);
      });
      return createJsonResponse({ status: 'success', count: items.length, type: 'envelopes' });
    }

    sheet.appendRow(['Column', 'Title', 'Description', 'Amount']);
    
    items.forEach(function(card) {
      sheet.appendRow([
        card.columnId || 'backlog',
        card.title || '',
        card.description || '',
        Number(card.amount) || 0
      ]);
    });
    
    return createJsonResponse({ status: 'success', count: items.length });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

