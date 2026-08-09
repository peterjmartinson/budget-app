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

    var isTransactionSync = (e && e.parameter && (e.parameter.type === 'transactions' || e.parameter.sheet === 'Transactions')) ||
                            headers.indexOf('cardid') !== -1;

    if (isTransactionSync) {
      var txIdIndex = headers.indexOf('id');
      var cardIdIndex = headers.indexOf('cardid');
      var dateIndex = headers.indexOf('date');
      var txDescIndex = headers.indexOf('description');
      var txAmountIndex = headers.indexOf('amount');

      if (txIdIndex === -1) txIdIndex = 0;
      if (cardIdIndex === -1) cardIdIndex = 1;
      if (dateIndex === -1) dateIndex = 2;
      if (txDescIndex === -1) txDescIndex = 3;
      if (txAmountIndex === -1) txAmountIndex = 4;

      var transactions = [];
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (!row[cardIdIndex] && !row[txAmountIndex]) continue;
        transactions.push({
          id: String(row[txIdIndex] || ''),
          cardId: String(row[cardIdIndex] || ''),
          date: String(row[dateIndex] || ''),
          description: String(row[txDescIndex] || ''),
          amount: Number(row[txAmountIndex]) || 0
        });
      }
      return createJsonResponse(transactions);
    }
    
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
    
    var idIndex = headers.indexOf('id');
    var titleIndex = headers.indexOf('title');
    var descIndex = headers.indexOf('description');
    var amountIndex = headers.indexOf('amount');
    var createdAtIndex = headers.indexOf('createdat');

    // Fallbacks if header names differ slightly
    if (titleIndex === -1) titleIndex = 1;
    if (descIndex === -1) descIndex = 2;
    if (amountIndex === -1) amountIndex = 3;
    
    var cards = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[titleIndex] && !row[amountIndex]) continue;
      var cardObj = {
        columnId: String(row[colIndex] || 'backlog'),
        title: String(row[titleIndex] || ''),
        description: String(row[descIndex] || ''),
        amount: Number(row[amountIndex]) || 0
      };
      if (idIndex !== -1 && row[idIndex]) {
        cardObj.id = String(row[idIndex]);
      }
      if (createdAtIndex !== -1 && row[createdAtIndex]) {
        cardObj.createdAt = String(row[createdAtIndex]);
      }
      cards.push(cardObj);
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
    
    var isTransactionSync = (e && e.parameter && (e.parameter.type === 'transactions' || e.parameter.sheet === 'Transactions')) ||
                            (items.length > 0 && items[0].cardId !== undefined);

    var isEnvelopeSync = (e && e.parameter && (e.parameter.type === 'envelopes' || e.parameter.sheet === 'Envelopes')) ||
                         (items.length > 0 && items[0].cash !== undefined && items[0].title === undefined && items[0].cardId === undefined);

    sheet.clearContents();
    
    if (isTransactionSync) {
      sheet.appendRow(['ID', 'CardID', 'Date', 'Description', 'Amount']);
      items.forEach(function(txn) {
        sheet.appendRow([
          txn.id || '',
          txn.cardId || '',
          txn.date || '',
          txn.description || '',
          Number(txn.amount) || 0
        ]);
      });
      return createJsonResponse({ status: 'success', count: items.length, type: 'transactions' });
    }

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

    sheet.appendRow(['ID', 'Column', 'Title', 'Description', 'Amount', 'CreatedAt']);
    
    items.forEach(function(card) {
      sheet.appendRow([
        card.id || '',
        card.columnId || 'backlog',
        card.title || '',
        card.description || '',
        Number(card.amount) || 0,
        card.createdAt || ''
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

