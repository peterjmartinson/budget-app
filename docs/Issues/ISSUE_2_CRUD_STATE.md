Objective
Implement card creation, inline editing, and deletion operations with instant browser localStorage persistence.
Requirements & Scope
Card Data Model:
id (UUID / Timestamp string)
title (String)
description (String)
amount (Numeric float/currency)
columnId (String)
UI Controls:
" Add Card" button at the bottom of each column container.
Modal or inline edit form to set Title, Description, and Amount.
Delete trigger button on each card with confirmation dialog/action.
State Management:
Sync all state mutations immediately to localStorage.setItem('budget_board_state', ...).
On page refresh, prioritize loading cards from localStorage if present, falling back to empty column state.
Acceptance Criteria & TDD Tests
Unit tests for state handlers: addCard(), updateCard(), deleteCard().
Test verifying card creation correctly assigns UUID, column context, and numeric amount parse.
Test verifying localStorage accurately serialized/deserialized across page reloads.
App remains fully interactive with zero JavaScript console errors.
