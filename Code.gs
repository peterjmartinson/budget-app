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

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createJsonResponse([]);
    }
    
    var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var colIndex = headers.indexOf('column');
    var titleIndex = headers.indexOf('title');
    var descIndex = headers.indexOf('description');
    var amountIndex = headers.indexOf('amount');

    // Fallbacks if header names differ slightly
    if (colIndex === -1) colIndex = 0;
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
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var contents = e.postData ? e.postData.contents : '';
    var cards = JSON.parse(contents);
    
    if (!Array.isArray(cards)) {
      return createJsonResponse({ status: 'error', message: 'Expected JSON array of cards' });
    }
    
    sheet.clearContents();
    sheet.appendRow(['Column', 'Title', 'Description', 'Amount']);
    
    cards.forEach(function(card) {
      sheet.appendRow([
        card.columnId || 'backlog',
        card.title || '',
        card.description || '',
        Number(card.amount) || 0
      ]);
    });
    
    return createJsonResponse({ status: 'success', count: cards.length });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
