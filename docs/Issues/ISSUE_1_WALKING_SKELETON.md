## Objective
Establish a minimal, fully runnable single-page web app layout that parses a static config.yaml file to dynamically build the 4 board columns and load default column cash values.
## Requirements & Scope
Create base single-file HTML structure (index.html) with CSS flexbox layout for responsive column display.
Integrate JS-YAML parser library via CDN.
Implement asynchronous fetch routine to load and parse config.yaml on startup.
Parse and render 4 initial columns:
Backlog (Default Cash: $0)
Rollover (Default Cash: Loaded from config, e.g., current month remainder)
In Month's Budget (Default Cash: Loaded from config, e.g., expected income)
Unfunded (Default Cash: $0)
Display basic column header cards and placeholders.
Technical Details
// Expected config.yaml schema:
board:
  title: "Monthly Budget Board"
columns:
  - id: "backlog"
    title: "Backlog"
    cash_in_play: 0
  - id: "rollover"
    title: "Rollover"
    cash_in_play: 500
  - id: "in_budget"
    title: "In Month's Budget"
    cash_in_play: 4500
  - id: "unfunded"
    title: "Unfunded"
    cash_in_play: 0


Acceptance Criteria & TDD Tests
Unit test passes verifying correct YAML parsing into application state object.
DOM test verifies all 4 configured columns render dynamically upon page load.
Application remains 100% runnable in browser with fallback defaults if config.yaml fails to load.
