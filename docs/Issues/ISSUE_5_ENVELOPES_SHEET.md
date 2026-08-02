## Description
Currently, the `cash_in_play` ("Cash") values for each column/envelope are hardcoded in `config.yaml`. To make these values dynamic and editable directly from the app, they should be stored in a new tab/sheet in the synced Google Spreadsheet and synced bi-directionally alongside the card data.

---

## Requirements

### 1. Google Sheets ("Envelopes" Sheet)
* Create a new sheet/tab named **"Envelopes"** in the Google Spreadsheet.
* The sheet structure should contain the following headers:
  * `Column` (representing the Column ID, e.g., `backlog`, `rollover`, `in_budget`, `unfunded`)
  * `Cash` (representing the cash in play value for that column)
* The default name of this sheet tab (`Envelopes`) should be stored in `config.yaml` under `google_sheets.envelopes_sheet_name` or similar, making it configurable.

### 2. Google Apps Script Backend (`Code.gs` Updates)
* Extend the GET / POST handlers to support fetching and syncing data for the envelopes sheet.
* The script should accept requests targeting the "Envelopes" sheet to read and write rows containing columns `Column` and `Cash`.

### 3. Frontend App Updates

#### Data Syncing
* When **Fetch Sheet** is clicked:
  1. Retrieve both the Card list and the Envelope configurations from the Google Apps Script Web App.
  2. Map the retrieved `Cash` values to their respective columns on the board.
  3. If a column has no synced envelope cash value, fall back to `0` (and clean up the hardcoded `cash_in_play` values from `config.yaml` so they are no longer the source of truth).
* When **Sync to Sheet** is clicked:
  1. Send both the Card list and the updated Envelope configurations back to Google Sheets.
  2. The Google Apps Script should overwrite the "Envelopes" sheet rows with the updated Cash values.

#### Inline Cash Editing
* Render the **Cash** value in each column header as an interactive element (e.g., clicking on the currency value turns it into an input field or opens an inline editor).
* When editing is finished (e.g., pressing `Enter` or clicking outside the input), save the updated Cash value in the local state.
* Mark the state as unsaved (`isDirty = true`) and update the column's net balance calculation in real-time.
* Disable editing for columns/envelopes where Cash should not be edited (if any), or allow editing on all.

---

## Technical Tasks

- [ ] **Config changes**: Add `envelopes_sheet_name: "Envelopes"` to `config.yaml` and remove hardcoded `cash_in_play` values from columns.
- [ ] **Apps Script (`Code.gs`)**: Add support for retrieving and syncing rows for the new Envelopes sheet.
- [ ] **Sync Layer (`js/sheetsSync.js`)**: Update fetch/sync calls to retrieve both cards and envelopes.
- [ ] **State Management (`js/stateStore.js`)**: Extend the state store to keep track of local column cash values and mark the state as dirty when cash values are modified inline.
- [ ] **UI Layer (`js/boardRenderer.js` & `js/app.js`)**:
  * Replace the static Cash metrics display with click-to-edit input fields.
  * Handle keydown (`Enter`) and blur events on the inputs to save values to the local state store and trigger a re-render.
- [ ] **Testing**: Ensure that calculations in `js/mathEngine.js` utilize the dynamically loaded cash values, and verify sync behavior with unit/integration tests.
