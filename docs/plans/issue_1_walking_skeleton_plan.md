# Implementation Plan - Issue 1: Walking Skeleton

Establish a minimal, fully runnable single-page web application layout for the Budget Board that asynchronously parses a static `config.yaml` file to dynamically build 4 board columns (Backlog, Rollover, In Month's Budget, Unfunded) with default cash values and graceful fallbacks.

## User Review Required

> [!NOTE]
> We will set up a lightweight testing environment using `vitest` and `jsdom` in `package.json` to fulfill the **Test-Driven Development (TDD)** constraint required by `.agents/AGENTS.md` and `ISSUE_1_WALKING_SKELETON.md`.

> [!TIP]
> The app will use a modern, sleek dark glassmorphism aesthetic (Inter font, curated HSL gradients, responsive flexbox layout) in standard Vanilla HTML/CSS/JS without heavyweight UI build tools, ensuring 100% instant browser compatibility.

## Open Questions

None at this time. The requirements for Issue 1 are well-defined.

## Proposed Changes

### Configuration & Tooling

#### [NEW] [package.json](file:///home/peter/Code/budget-app/package.json)
- Define npm package configuration with dependencies for testing (`vitest`, `jsdom`, `js-yaml`).
- Define `npm test` script for running TDD suite.

#### [NEW] [config.yaml](file:///home/peter/Code/budget-app/config.yaml)
- YAML configuration defining `board.title` ("Monthly Budget Board") and 4 initial columns:
  - `backlog` ("Backlog", cash: $0)
  - `rollover` ("Rollover", cash: $500)
  - `in_budget` ("In Month's Budget", cash: $4500)
  - `unfunded` ("Unfunded", cash: $0)

---

### Core Application Logic

#### [NEW] [js/configLoader.js](file:///home/peter/Code/budget-app/js/configLoader.js)
- Asynchronous function `loadConfig(fetchImpl)` to fetch and parse `config.yaml` using JS-YAML.
- Returns default fallback configuration object if `fetch` or YAML parsing fails (ensuring 100% runnability).

#### [NEW] [js/boardRenderer.js](file:///home/peter/Code/budget-app/js/boardRenderer.js)
- Pure rendering logic `renderBoard(state, containerElement)` to dynamically create board title, column header cards, cash-in-play badges, and card container placeholders for the 4 columns.

#### [NEW] [js/app.js](file:///home/peter/Code/budget-app/js/app.js)
- Entry point initializing `loadConfig` on `DOMContentLoaded` and passing parsed state to `renderBoard`.

---

### User Interface & Styles

#### [NEW] [index.html](file:///home/peter/Code/budget-app/index.html)
- Base semantic HTML5 template importing Google Fonts (Inter), `js-yaml` CDN parser script, `styles.css`, and `js/app.js`.

#### [NEW] [styles.css](file:///home/peter/Code/budget-app/styles.css)
- CSS design system featuring dark theme, HSL color tokens, glassmorphic cards, Flexbox/Grid responsive 4-column layout, subtle transitions, and mobile responsiveness.

---

### TDD Unit & DOM Tests

#### [NEW] [tests/config.test.js](file:///home/peter/Code/budget-app/tests/config.test.js)
- Unit tests verifying:
  1. Correct YAML parsing of schema into application state object.
  2. Fallback to default state if `config.yaml` fetch fails or returns invalid YAML.

#### [NEW] [tests/dom.test.js](file:///home/peter/Code/budget-app/tests/dom.test.js)
- DOM tests verifying:
  1. Rendering of all 4 columns dynamically upon page load.
  2. Display of correct column titles and default cash values ($0, $500, $4500, $0).

## Verification Plan

### Automated Tests
1. Run `npm test` to execute Vitest unit and DOM test suite:
   - `tests/config.test.js`
   - `tests/dom.test.js`

### Manual Verification
1. Launch local dev server (e.g. `npx serve .` or `python3 -m http.server`) and open in browser.
2. Verify responsive layout of all 4 columns and header cards.
3. Simulate `config.yaml` missing/error to verify fallback loading.
