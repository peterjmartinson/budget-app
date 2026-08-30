# Issue 10: Multi-Month Support (Dedicated Monthly Tabs)

## Problem Statement
The budget board was previously limited to a single month's workspace. Users need the ability to navigate between different months (e.g., August 2026, September 2026) as independent on-the-fly calculators without cross-month data bleed or rollover assumptions. Furthermore, syncing with Google Sheets must dynamically read and write to per-month sheet tabs (e.g., `2026-08 Cards`, `2026-08 Envelopes`, `2026-08 Transactions`).

## Requirements
1. **Frontend Month Navigation**:
   - Header controls to switch months: Previous Month button (`◀`), Month Dropdown (`YYYY-MM`), Next Month button (`▶`), and an `+ Add Month` action.
   - Default to the current real-world month (`2026-08` / August 2026).
   - Instant visual update upon switching months with no page reload.
2. **Data Partitioning & Isolation**:
   - Each month maintains its own separate cards, envelope cash balances, and column sorts.
   - Auto-migration of legacy unpartitioned localStorage data directly into `2026-08` without data loss.
3. **Google Sheets Syncing (Tab-per-Month)**:
   - Dynamic tab naming: `${YYYY-MM} Cards`, `${YYYY-MM} Envelopes`, `${YYYY-MM} Transactions` (e.g. `2026-08 Cards`).
   - Sync and fetch operations explicitly target the active month's tabs.
   - Apps Script backend creates non-existent tabs on demand.
4. **Testing & Stability**:
   - Unit tests covering multi-month state, month switching, data migration, tab naming helpers, and DOM controls.
