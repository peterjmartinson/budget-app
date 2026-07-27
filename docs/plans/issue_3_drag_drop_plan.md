# Implementation Plan - Issue 3: HTML5 Drag-and-Drop & Zero-Latency Math Rollup Engine

Add HTML5 Drag-and-Drop interactivity to move cards between columns and build a zero-latency calculation engine to display real-time column metrics (Cash in Play, Total Expenses, Net Balance) with conditional red formatting for negative balances.

## User Review Required

> [!NOTE]
> Moving cards via drag-and-drop will update card column context in `stateStore` in real time, triggering immediate `localStorage` synchronization and zero-latency metric recalculation.

> [!TIP]
> Negative net balances (where Total Expenses exceed Cash in Play) will trigger dynamic `.negative-balance` CSS formatting, rendering the balance in bold vibrant red.

## Open Questions

None at this time. Requirements are clearly defined in `ISSUE_3_DRAG_DROP.md`.

## Proposed Changes

### Calculation Engine & Math Metrics

#### [NEW] [js/mathEngine.js](file:///home/peter/Code/budget-app/js/mathEngine.js)
- Implement pure calculation functions:
  - `calculateColumnMetrics(columnConfig, columnCards)`:
    - `cashInPlay`: numeric cash value from column configuration.
    - `totalExpenses`: sum of numeric amounts of all cards in column.
    - `netBalance`: `cashInPlay - totalExpenses`.
    - `isNegative`: `netBalance < 0`.
    - Returns `{ cashInPlay, totalExpenses, netBalance, isNegative }`.
  - `calculateBoardMetrics(columns, cards)`: map of metrics keyed by `columnId`.

---

### Drag-and-Drop State Integration

#### [MODIFY] [js/stateStore.js](file:///home/peter/Code/budget-app/js/stateStore.js)
- Add `moveCard(cardId, targetColumnId)` method:
  - Updates target card's `columnId`.
  - Calls `saveState()` to persist to `localStorage`.

#### [MODIFY] [js/boardRenderer.js](file:///home/peter/Code/budget-app/js/boardRenderer.js)
- Update column header rendering to display 3 metrics:
  - Cash in Play badge (`$4,500`).
  - Total Expenses badge (`$1,500`).
  - Net Balance badge with conditional `.negative-balance` (red text) or `.positive-balance` styling.
- Update card items to include `draggable="true"` and dataset attributes.

#### [MODIFY] [js/app.js](file:///home/peter/Code/budget-app/js/app.js)
- Implement HTML5 Drag-and-Drop event listeners:
  - `dragstart`: sets drag payload `cardId`, adds `.is-dragging` class.
  - `dragover`: prevents default drop rejection, highlights drop target column (`.drag-over`).
  - `dragleave`: removes `.drag-over` highlighting.
  - `drop`: retrieves `cardId`, moves card to target column via `stateStore.moveCard()`, triggers instant re-render.
  - `dragend`: cleans up dragging CSS classes.

---

### UI & Styling Enhancements

#### [MODIFY] [styles.css](file:///home/peter/Code/budget-app/styles.css)
- Add metric header layout for 3 metric badges per column.
- Add `.negative-balance` bold vibrant red formatting for negative net balance values.
- Add `.positive-balance` emerald green formatting for positive net balance values.
- Add drag-and-drop visual states:
  - `.card-item.is-dragging` (semi-transparent, glowing border).
  - `.column-cards-container.drag-over` (dashed highlight glow).

---

### TDD Unit & Integration Tests

#### [NEW] [tests/mathEngine.test.js](file:///home/peter/Code/budget-app/tests/mathEngine.test.js)
- Unit tests verifying:
  1. Accurate metric calculation across edge cases ($0 amounts, decimals like `$12.34`, exact zero).
  2. Negative net balance detection when total expenses exceed cash in play.

#### [NEW] [tests/dragDrop.test.js](file:///home/peter/Code/budget-app/tests/dragDrop.test.js)
- Integration tests verifying:
  1. Moving a card from "In Month's Budget" to "Backlog" instantly updates both column headers' Total Expenses and Net Balances.
  2. DOM test confirming `.negative-balance` CSS class is applied when Net Balance drops below zero.

## Verification Plan

### Automated Tests
- Run `npm test` to execute full Vitest suite (including Issues 1 & 2 regression tests + new Issue 3 tests):
  - `tests/config.test.js`
  - `tests/dom.test.js`
  - `tests/stateStore.test.js`
  - `tests/cardDom.test.js`
  - `tests/mathEngine.test.js`
  - `tests/dragDrop.test.js`

### Manual Verification
1. Open `http://localhost:3000` in browser.
2. Add a card "Rent" ($1,500) to "In Month's Budget" ($4,500 Cash).
3. Observe Total Expenses ($1,500) and Net Balance ($3,000 green).
4. Drag "Rent" card to "Backlog" ($0 Cash).
5. Observe zero-latency update:
   - "In Month's Budget" Net Balance becomes $4,500.
   - "Backlog" Net Balance becomes **-$1,500 (bold red text)**.
6. Refresh browser page — verify updated card position and math metrics persist.
