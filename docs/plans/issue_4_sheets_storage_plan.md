# Implementation Plan - Issue 4: Google Sheets Synchronization & CSV Import/Export Engine

Connect the client-side board to Google Sheets via a lightweight Google Apps Script Web App for cross-device synchronization, while providing standard CSV import/export for local offline data portability.

## User Review Required

> [!NOTE]
> Network requests to Google Apps Script will feature complete offline graceful fallbacks. If network requests fail or the URL is unconfigured, the app operates 100% functional using local `localStorage`.

> [!TIP]
> A standalone `Code.gs` Google Apps Script snippet will be provided in the repository root for easy copy-pasting into Google Sheets Apps Script editor.

## Open Questions

None at this time. Requirements are clearly defined in `ISSUE_4_SHEETS_STORAGE.md`.

## Proposed Changes

### Standalone Google Apps Script Backend

#### [NEW] [Code.gs](file:///home/peter/Code/budget-app/Code.gs)
- Google Apps Script snippet handling:
  - `doGet()`: reads spreadsheet rows and returns JSON array of cards (`Column`, `Title`, `Description`, `Amount`).
  - `doPost(e)`: parses incoming card array JSON, overwrites sheet rows, and returns status response.

---

### CSV Import/Export & Sheets Client Engines

#### [NEW] [js/csvEngine.js](file:///home/peter/Code/budget-app/js/csvEngine.js)
- `exportToCSV(cards)`: serializes card array into standard CSV format with escaped quotes and headers (`"Column","Title","Description","Amount"`).
- `parseCSV(csvText)`: parses CSV string, handles quotes/commas, and maps rows into valid card objects with sanitized amounts.

#### [NEW] [js/sheetsSync.js](file:///home/peter/Code/budget-app/js/sheetsSync.js)
- `fetchFromSheets(webAppUrl, fetchFn)`: fetches remote card array from Google Apps Script Web App.
- `syncToSheets(webAppUrl, cards, fetchFn)`: sends HTTP POST request with card array payload.
- Error handling: catches network errors, returning status flags without breaking local state.

---

### State & Sync Indicators

#### [MODIFY] [js/stateStore.js](file:///home/peter/Code/budget-app/js/stateStore.js)
- Add `hasUnsavedChanges` dirty state flag.
- Add `getSheetsUrl()` and `saveSheetsUrl(url)` for persisting Web App URL in `localStorage`.
- Add `replaceCards(newCards)` for replacing state on Sheet fetch or CSV import.

#### [MODIFY] [js/boardRenderer.js](file:///home/peter/Code/budget-app/js/boardRenderer.js)
- Add Header controls:
  - "Fetch from Sheet" button.
  - "Sync to Sheet" button with visual indicator badge (`"Unsaved Changes"` / `"Synced"`).
  - "Export CSV" button.
  - "Import CSV" button (with hidden `<input type="file" accept=".csv">`).
  - Settings button (opens Google Apps Script Web App URL configuration modal).

#### [MODIFY] [js/app.js](file:///home/peter/Code/budget-app/js/app.js)
- Wire event listeners for:
  - CSV Export trigger (triggers file download).
  - CSV Import file selection and state hydration.
  - Sheets Sync & Fetch triggers.
  - Web App URL Settings modal form submission.

---

### UI & Styling

#### [MODIFY] [styles.css](file:///home/peter/Code/budget-app/styles.css)
- Header sync action buttons (`.btn-sync`, `.btn-csv`, `.btn-settings`).
- Unsaved changes indicator badge (`.badge-dirty`, `.badge-synced`).
- File input styling and settings modal dialog adjustments.

---

### TDD Unit & Integration Tests

#### [NEW] [tests/csvEngine.test.js](file:///home/peter/Code/budget-app/tests/csvEngine.test.js)
- Unit tests verifying:
  1. `exportToCSV` correctly serializes card arrays into valid CSV strings with escaped quotes.
  2. `parseCSV` correctly parses CSV strings into valid card objects, handling missing fields and numeric parsing.

#### [NEW] [tests/sheetsSync.test.js](file:///home/peter/Code/budget-app/tests/sheetsSync.test.js)
- Mock API tests verifying:
  1. `fetchFromSheets` handles 200 OK JSON responses and maps fields.
  2. `syncToSheets` formats POST payload correctly.
  3. Graceful fallback on network failure or invalid URL (confirming app remains 100% functional offline).

## Verification Plan

### Automated Tests
- Run `npm test` to execute full Vitest suite across all 4 issues:
  - `tests/config.test.js`
  - `tests/dom.test.js`
  - `tests/stateStore.test.js`
  - `tests/cardDom.test.js`
  - `tests/mathEngine.test.js`
  - `tests/dragDrop.test.js`
  - `tests/csvEngine.test.js`
  - `tests/sheetsSync.test.js`

### Manual Verification
1. Open `http://localhost:3000` in browser.
2. Click "Export CSV" — confirm `.csv` file downloads with correct columns.
3. Import a sample CSV file — confirm cards render instantly on board.
4. Open Settings modal, enter test Web App URL, save.
5. Click "Sync to Sheet" and "Fetch from Sheet" — verify sync indicator badges and offline fallbacks.
