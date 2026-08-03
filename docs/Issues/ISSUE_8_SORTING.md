### **Description**
Allow users to decide how cards are sorted within each budget column (list). We want to provide a select dropdown in each column header to choose the sorting strategy. The selected sorting preference should be persisted to localStorage so it is remembered across visits.

**Sorting Options:**
- By money amount, descending (largest amount on top) — **Default**
- By money amount, ascending (smallest amount on top)
- Alphabetically by title, ascending (A-Z)
- Alphabetically by title, descending (Z-A)

---

### **UX/UI Design & Interaction**
1. **Dropdown Selector**: Add a small, cleanly styled `<select>` element in each column header (within or next to `.column-title-group`).
2. **Persistence**: When the user changes the select value, the application should instantly sort the column's cards, render the update, and save the sorting preference for that column to `localStorage`.
3. **Default Behavior**: If no sorting preference has been configured yet for a column, default to **Money Descending**.

---

### **Technical Implementation Guide**

#### **1. State Management & Persistence**
- **[js/stateStore.js](file:///c:/Users/Admin/Documents/budget-app/js/stateStore.js)**
  - Extend the storage schema to track column sort preferences, e.g., in a dictionary/object under a new key like `columnSorts: { [columnId]: sortOption }`.
  - Add methods:
    - `getColumnSort(columnId)`: Returns the configured sort option for the column, or `'amount-desc'` by default.
    - `setColumnSort(columnId, sortOption)`: Saves the sort option for the column to the store, triggers `saveState()`, and sets `hasUnsavedChanges = true` (or keep it local only, depending on whether it needs sheet sync; usually, UI sorting preference is purely local).

#### **2. Column Rendering & Sorting**
- **[js/boardRenderer.js](file:///c:/Users/Admin/Documents/budget-app/js/boardRenderer.js)**
  - Implement a helper function `sortCards(cards, sortOption)` to sort cards based on the selected option:
    - `'amount-desc'`: `b.amount - a.amount`
    - `'amount-asc'`: `a.amount - b.amount`
    - `'title-asc'`: Case-insensitive alphabetical comparison of titles `a.title` and `b.title`.
    - `'title-desc'`: Case-insensitive alphabetical comparison in reverse.
  - In `renderColumn(column, columnCards)`:
    - Retrieve the current column sort option from the store.
    - Render the `<select class="column-sort-select">` with the four options and set the active selection based on the retrieved sort option.
    - Sort the `columnCards` using the sorting function before mapping them to `renderCardItem(card)`.

#### **3. Event Handling**
- **[js/app.js](file:///c:/Users/Admin/Documents/budget-app/js/app.js)**
  - Add a change event listener to the container watching for changes on `.column-sort-select`.
  - On change:
    - Retrieve the new sort option and the column ID.
    - Call the state store to update the sorting preference for that column.
    - Re-render the application (`renderApp(container)`).

#### **4. Styling**
- **[styles.css](file:///c:/Users/Admin/Documents/budget-app/styles.css)**
  - Add styling for `.column-sort-select` so it fits naturally in the header row of `.board-column` (small font, clean borderless or subtle-border styling, glassmorphism theme matches).

---

### **Testing Expectations**
- Write unit tests in a new or existing test file (e.g. [tests/dom.test.js](file:///c:/Users/Admin/Documents/budget-app/tests/dom.test.js)) verifying:
  - Changing the sorting option correctly re-orders the rendered cards inside the DOM.
  - The default sort is applied correctly as money descending when no options are set.
  - Column sort selections are saved/loaded properly via the `StateStore`.