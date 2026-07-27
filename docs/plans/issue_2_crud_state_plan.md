# Implementation Plan - Issue 2: CRUD Operations & LocalStorage State Management

Implement card creation, inline/modal editing, deletion operations, and real-time browser `localStorage` persistence while building upon the walking skeleton.

## User Review Required

> [!NOTE]
> Card amounts will be strictly sanitized and parsed as numeric values (`parseFloat`). String inputs like `"$1,250.50"` will be automatically cleaned into numeric `1250.5`.

> [!TIP]
> State persistence uses `localStorage.setItem('budget_board_state', ...)` on every state mutation. On page refresh, state automatically loads cards from `localStorage`, preserving card data seamlessly.

## Open Questions

None at this time. Requirements are clearly defined in `ISSUE_2_CRUD_STATE.md`.

## Proposed Changes

### Core State & Persistence Engine

#### [NEW] [js/stateStore.js](file:///home/peter/Code/budget-app/js/stateStore.js)
- Define `Card` model structure: `{ id, title, description, amount, columnId, createdAt }`.
- Implement `StateStore` module:
  - `loadState()`: checks `localStorage.getItem('budget_board_state')` and parses cards array; defaults to empty array.
  - `saveState()`: serializes current state object to `localStorage`.
  - `addCard({ title, description, amount, columnId })`: assigns `crypto.randomUUID()`, sanitizes amount, adds card, syncs to `localStorage`.
  - `updateCard(id, updates)`: updates title, description, amount, or columnId, syncs to `localStorage`.
  - `deleteCard(id)`: removes card from state, syncs to `localStorage`.
  - `getCardsForColumn(columnId)`: returns cards filtered by column.

---

### UI & Modal Components

#### [MODIFY] [js/boardRenderer.js](file:///home/peter/Code/budget-app/js/boardRenderer.js)
- Update `renderBoard()` to render:
  - Card elements within column containers.
  - "+ Add Card" button at the bottom of each column container.
  - Card UI components: title, description snippet, formatted amount tag, Edit button, Delete button.
- Integrate modal form dialog for creating and editing cards:
  - Inputs: Title, Description, Amount (numeric input).
  - Actions: Save, Cancel.
- Add delete confirmation modal / action triggering `deleteCard()`.

#### [MODIFY] [js/app.js](file:///home/peter/Code/budget-app/js/app.js)
- Connect `StateStore` with `boardRenderer`.
- Register DOM event listeners for "+ Add Card", card edit triggers, form submissions, and delete actions.

---

### UI Styles & Modal Animations

#### [MODIFY] [styles.css](file:///home/peter/Code/budget-app/styles.css)
- Add glassmorphic modal overlay and form card styling.
- Add card component styles: title, description typography, amount badge, card action buttons (Edit / Delete).
- Add hover transitions and interactive focus states for inputs and buttons.

---

### TDD Unit & DOM Tests

#### [NEW] [tests/stateStore.test.js](file:///home/peter/Code/budget-app/tests/stateStore.test.js)
- Unit tests verifying:
  1. `addCard()` generates UUID, assigns `columnId`, cleans numeric amount.
  2. `updateCard()` correctly modifies existing card fields.
  3. `deleteCard()` removes specified card.
  4. `localStorage` serialization & deserialization across page reloads.

#### [NEW] [tests/cardDom.test.js](file:///home/peter/Code/budget-app/tests/cardDom.test.js)
- DOM integration tests verifying:
  1. "+ Add Card" button opens creation modal with correct column context.
  2. Submitting form renders new card dynamically into target column.
  3. Edit & Delete actions update DOM state and trigger state persistence without JavaScript console errors.

## Verification Plan

### Automated Tests
- Run `npm test` to execute full Vitest suite (including Issue 1 regression tests and new Issue 2 tests):
  - `tests/config.test.js`
  - `tests/dom.test.js`
  - `tests/stateStore.test.js`
  - `tests/cardDom.test.js`

### Manual Verification
1. Open `http://localhost:3000` in browser.
2. Click "+ Add Card" in the "Backlog" column, enter title "Rent", amount "1500", description "Monthly rent".
3. Save card, verify card appears in Backlog.
4. Refresh browser page — verify card persists from `localStorage`.
5. Edit card amount to "1600", verify live UI update.
6. Delete card, confirm prompt, verify card removal.
