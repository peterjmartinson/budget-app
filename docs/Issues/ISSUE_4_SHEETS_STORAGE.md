Objective
Connect the client-side board to Google Sheets via a lightweight Google Apps Script Web App for cross-device synchronization, maintaining standard CSV import/export as a local fallback.
Requirements & Scope
Google Apps Script Integration:
Provide standalone Code.gs snippet to deploy inside Google Sheet Apps Script editor.
Script handles doGet() to return JSON representation of sheet rows (Cards: Column, Title, Description, Amount).
Script handles doPost() to overwrite/sync updated card array back to spreadsheet rows.
App UI Sync Controls:
Settings modal/input to configure Google Apps Script Web App URL.
"Fetch from Sheet" button in header to load remote state.
"Sync to Sheet" button with visual indicator ("Unsaved Local Changes") to push localStorage state to Google Sheet.
Data Portability / CSV Engine:
"Export CSV" button generating standard tabular format (Column, Title, Description, Amount).
"Import CSV" file parser to populate state directly from local spreadsheet files.
Acceptance Criteria & TDD Tests
Unit tests for CSV export serialization and import parsing.
Mock API tests for Google Apps Script payload serialization (HTTP GET/POST response handling).
End-to-end operational check confirming app remains 100% functional offline using localStorage even if network requests to Google Apps Script fail.
