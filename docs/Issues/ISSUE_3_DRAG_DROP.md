Objective
Add HTML5 Drag-and-Drop interactivity to move cards between columns and build a zero-latency math rollup engine to display column metrics and highlight negative balances in red.
Requirements & Scope
HTML5 Drag-and-Drop:
Make card elements draggable (draggable="true").
Implement dragstart, dragover, drop event listeners across columns.
Update card's columnId in state instantly on drop.
Column Header Calculation Engine:
For each column, dynamically compute three real-time metrics:
Cash in Play: Sourced from column configuration (or inline editable header).
Total Expenses: Sum of amount values of all cards residing in that column.
Net Balance: (Cash in Play) - (Total Expenses)
Conditional Formatting:
If Net Balance < 0, render Net Balance metric in bold red text (e.g., CSS class .negative-balance).
Otherwise, display standard neutral/positive text color.
Acceptance Criteria & TDD Tests
Unit tests for calculation math engine across edge cases ($0 amounts, decimals, negative balances).
Integration test verifying dragging a card from "In Month's Budget" to "Backlog" instantly updates both column headers' Total Expenses and Net Balances in 0ms.
UI test confirming .negative-balance CSS class is applied if Net Balance drops below zero.
