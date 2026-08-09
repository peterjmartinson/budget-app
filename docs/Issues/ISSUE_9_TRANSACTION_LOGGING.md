### **Description**
Add transaction logging and drawdown tracking to the Monthly Budget Board. In this envelope-style budgeting model, individual cards act as "envelopes" with a total budgeted limit (the `amount` field). A user should be able to log individual transactions against an envelope, see a visual drawdown of the remaining balance, and sync these transaction records to a separate Google Sheet tab.

To support this without losing transaction relationships when syncing, the Google Sheets integration must be upgraded to persist card `id`s and `createdAt` timestamps, rather than recreating them on every fetch.

---

### **UX/UI Design & Interaction**

1. **Dual Column Metrics**:
   * Update column headers to display two distinct balances:
     * **Budget Balance (Net Balance)**: Cash in Play minus Total Budgeted Envelope Allocations (unallocated cash in the column).
     * **Actual Balance (New)**: Cash in Play minus Actual Spent (remaining bank cash in this column).
2. **Card (Envelope) Drawdown UI**:
   * Add a subtle status bar or text inside the card on the board showing: `Remaining: $Z.ZZ` (or `Spent: $X / $Y`).
3. **Card Modal Ledger & Drawdown Progress**:
   * When opening the card modal, add a section displaying:
     * **Drawdown Status**: A progress bar showing % of budget spent (color-coded: normal, amber at 80%, red at 100%+).
     * **Spent vs. Budgeted**: e.g., `Spent: $320.00 / $500.00` and `Remaining: $180.00`.
     * **Transaction Ledger**: A scrollable table/list showing date, description, and amount for each logged transaction, with a delete button (trash icon) next to each item.
     * **Quick-Add Transaction Form**: Inline inputs for Date (pre-filled with today's date), Description (merchant/purpose), and Amount, plus an "Add Transaction" button.

---

### **Technical Implementation Guide**

#### **1. Google Sheets Script Upgrades**
* **[Code.gs](file:///c:/Users/Admin/Documents/budget-app/Code.gs)**:
  * Update card synchronization (`doGet` and `doPost`) to support two new columns in the `Active Budget` tab: `ID` and `CreatedAt`.
  * Implement support for a new sheet name/tab called `Transactions`.
    * When `doGet` is called with `sheet=Transactions` or `type=transactions`, retrieve and return a JSON array of transactions.
    * When `doPost` is called with `sheet=Transactions` or `type=transactions`, clear the `Transactions` tab and write rows: `['ID', 'CardID', 'Date', 'Description', 'Amount']`.

#### **2. State Store & Schema Upgrades**
* **[js/stateStore.js](file:///c:/Users/Admin/Documents/budget-app/js/stateStore.js)**:
  * Extend `replaceCards` to preserve the synced card `id` and `createdAt` timestamps coming from Google Sheets.
  * Initialize `card.transactions = card.transactions || []` on all card objects when loading state or replacing cards.
  * Add transaction ledger helper methods:
    * `addTransaction(cardId, { date, description, amount })`: Adds a transaction with a unique transaction ID to the card, saves state, and marks unsaved changes.
    * `deleteTransaction(cardId, transactionId)`: Deletes the target transaction, saves state, and marks unsaved changes.

#### **3. Synchronization Engine Upgrades**
* **[js/sheetsSync.js](file:///c:/Users/Admin/Documents/budget-app/js/sheetsSync.js)**:
  * When syncing cards to the sheet, include the `id` and `createdAt` properties in the POST payload.
  * Add functions `fetchTransactionsFromSheets(webAppUrl, fetchFn, sheetName)` and `syncTransactionsToSheets(webAppUrl, transactions, fetchFn, sheetName)` to fetch and post transactions to the `Transactions` tab.
* **[js/app.js](file:///c:/Users/Admin/Documents/budget-app/js/app.js)**:
  * In `handleFetchSheets`, fetch both Cards and Transactions, then zip the transactions into their respective card objects in the state store.
  * In `handleSyncSheets`, extract the flat list of all transactions from all cards and post them to the `Transactions` sheet tab.

#### **4. Math Engine Updates**
* **[js/mathEngine.js](file:///c:/Users/Admin/Documents/budget-app/js/mathEngine.js)**:
  * Update `calculateColumnMetrics(columnConfig, columnCards)` to compute:
    * `totalBudgeted`: Sum of all `card.amount` in that column.
    * `totalActualSpent`: Sum of all transaction amounts inside all `columnCards`.
    * `netBalance`: `cashInPlay - totalBudgeted` (unallocated cash).
    * `actualBalance`: `cashInPlay - totalActualSpent` (actual remaining cash).

#### **5. UI & Event Handling Updates**
* **[js/boardRenderer.js](file:///c:/Users/Admin/Documents/budget-app/js/boardRenderer.js)**:
  * Update column rendering to display the two balances: e.g. `Budget Net Balance` and `Actual Remaining`.
  * Update the modal rendering structure (`renderBoard`) to contain:
    * Progress bar elements.
    * Container for the transaction ledger.
    * Inline transaction add form.
  * Update card rendering on the board front to display the remaining amount.
* **[js/app.js](file:///c:/Users/Admin/Documents/budget-app/js/app.js)**:
  * In `openModal(card)`, populate the transaction ledger and progress bar. Pre-fill the quick-add transaction date with the current local date.
  * Wire up event listeners inside the modal:
    * Click on "Add Transaction": validate input, call `stateStore.addTransaction`, and re-render/refresh the modal.
    * Click on "Delete Transaction" (trash icon): call `stateStore.deleteTransaction`, and refresh the modal.

---

### **Testing Expectations**
* Add tests in a new file (e.g. `tests/transactions.test.js`) or update existing tests (`tests/stateStore.test.js` and `tests/mathEngine.test.js`):
  * Verify ledger methods correctly insert and remove transactions under a card.
  * Verify schema loading defaults undefined transactions to an empty array.
  * Verify math calculations for `totalActualSpent`, card drawdown remaining amounts, and column-level dual balances.
  * Verify Google Sheets sync maps cards via persisted IDs across fetches.
* Run the test suite:
  ```bash
  npm test
  ```
