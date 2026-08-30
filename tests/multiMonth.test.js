import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateStore } from '../js/stateStore.js';
import { getSheetNamesForMonth } from '../js/sheetsSync.js';

describe('Multi-Month Support', () => {
  let localStorageMock;
  let mockStore = {};

  beforeEach(() => {
    mockStore = {};
    localStorageMock = {
      getItem: vi.fn(key => mockStore[key] || null),
      setItem: vi.fn((key, value) => { mockStore[key] = String(value); }),
      removeItem: vi.fn(key => { delete mockStore[key]; }),
      clear: vi.fn(() => { mockStore = {}; })
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });
  });

  describe('getSheetNamesForMonth helper', () => {
    it('generates standard tab names for a given monthKey', () => {
      const names = getSheetNamesForMonth('2026-08');
      expect(names.cardsSheet).toBe('2026-08 Cards');
      expect(names.envelopesSheet).toBe('2026-08 Envelopes');
      expect(names.transactionsSheet).toBe('2026-08 Transactions');
    });

    it('falls back gracefully if monthKey is empty or missing', () => {
      const names = getSheetNamesForMonth('');
      expect(names.cardsSheet).toBe('Cards');
      expect(names.envelopesSheet).toBe('Envelopes');
      expect(names.transactionsSheet).toBe('Transactions');
    });
  });

  describe('StateStore Multi-Month functionality', () => {
    it('initializes with a default month formatted as YYYY-MM', () => {
      const store = new StateStore();
      expect(store.getCurrentMonth()).toMatch(/^\d{4}-\d{2}$/);
      expect(store.getAvailableMonths()).toContain(store.getCurrentMonth());
    });

    it('isolates cards, envelopes, and column sorts between different months', () => {
      const store = new StateStore();
      store.setCurrentMonth('2026-08');

      // Add data to August 2026
      store.addCard({ title: 'August Rent', amount: 1200, columnId: 'in_budget' });
      store.setEnvelopeCash('in_budget', 1500);
      store.setColumnSort('in_budget', 'title-asc');

      expect(store.getCards()).toHaveLength(1);
      expect(store.getCards()[0].title).toBe('August Rent');
      expect(store.getEnvelopeCash('in_budget')).toBe(1500);
      expect(store.getColumnSort('in_budget')).toBe('title-asc');

      // Switch to September 2026
      store.setCurrentMonth('2026-09');
      expect(store.getCards()).toHaveLength(0);
      expect(store.getEnvelopeCash('in_budget')).toBe(0);
      expect(store.getColumnSort('in_budget')).toBe('amount-desc');

      // Add data to September 2026
      store.addCard({ title: 'September Books', amount: 80, columnId: 'backlog' });
      store.setEnvelopeCash('backlog', 200);

      expect(store.getCards()).toHaveLength(1);
      expect(store.getCards()[0].title).toBe('September Books');

      // Switch back to August 2026
      store.setCurrentMonth('2026-08');
      expect(store.getCards()).toHaveLength(1);
      expect(store.getCards()[0].title).toBe('August Rent');
      expect(store.getEnvelopeCash('in_budget')).toBe(1500);
      expect(store.getEnvelopeCash('backlog')).toBe(0);
    });

    it('auto-migrates legacy unpartitioned localStorage data to 2026-08 partition without data loss', () => {
      // Simulate legacy localStorage format
      const legacyState = {
        cards: [
          { id: 'c1', title: 'Legacy Bill', amount: 350, columnId: 'in_budget', transactions: [] }
        ],
        envelopes: { in_budget: 500 },
        columnSorts: { in_budget: 'title-desc' }
      };
      mockStore['budget_board_state'] = JSON.stringify(legacyState);

      const store = new StateStore('budget_board_state', 'budget_sheets_url', '2026-08');
      
      expect(store.getCurrentMonth()).toBe('2026-08');
      expect(store.getCards()).toHaveLength(1);
      expect(store.getCards()[0].title).toBe('Legacy Bill');
      expect(store.getEnvelopeCash('in_budget')).toBe(500);
      expect(store.getColumnSort('in_budget')).toBe('title-desc');

      // Switch to a new month and verify clean partition
      store.setCurrentMonth('2026-09');
      expect(store.getCards()).toHaveLength(0);

      // Reload store from localStorage and verify migrated multi-month structure persisted
      const reloadedStore = new StateStore('budget_board_state', 'budget_sheets_url', '2026-08');
      reloadedStore.setCurrentMonth('2026-08');
      expect(reloadedStore.getCards()).toHaveLength(1);
      expect(reloadedStore.getCards()[0].title).toBe('Legacy Bill');
    });

    it('allows registering and listing multiple months via addMonth & getAvailableMonths', () => {
      const store = new StateStore();
      store.setCurrentMonth('2026-08');
      store.addMonth('2026-09');
      store.addMonth('2026-10');

      const months = store.getAvailableMonths();
      expect(months).toContain('2026-08');
      expect(months).toContain('2026-09');
      expect(months).toContain('2026-10');
      // Ensure sorted order
      expect(months).toEqual([...months].sort());
    });
  });

  describe('Month Navigation helpers & DOM rendering', () => {
    it('formatMonthLabel formats YYYY-MM into readable Month Year strings', async () => {
      const { formatMonthLabel } = await import('../js/boardRenderer.js');
      expect(formatMonthLabel('2026-08')).toBe('August 2026');
      expect(formatMonthLabel('2026-12')).toBe('December 2026');
      expect(formatMonthLabel('2027-01')).toBe('January 2027');
      expect(formatMonthLabel('invalid')).toBe('invalid');
    });

    it('getAdjacentMonth calculates previous and next month correctly across year boundaries', async () => {
      const { getAdjacentMonth } = await import('../js/boardRenderer.js');
      expect(getAdjacentMonth('2026-08', 1)).toBe('2026-09');
      expect(getAdjacentMonth('2026-08', -1)).toBe('2026-07');
      expect(getAdjacentMonth('2026-12', 1)).toBe('2027-01');
      expect(getAdjacentMonth('2026-01', -1)).toBe('2025-12');
    });

    it('renderBoard renders Month Navigator with dropdown and nav buttons', async () => {
      const { JSDOM } = await import('jsdom');
      const { renderBoard } = await import('../js/boardRenderer.js');

      const dom = new JSDOM('<!DOCTYPE html><div id="app"></div>');
      const container = dom.window.document.getElementById('app');

      const store = new StateStore('budget_board_state', 'budget_sheets_url', '2026-08');
      store.addMonth('2026-09');

      const state = {
        board: { title: 'Monthly Budget Board' },
        columns: [{ id: 'backlog', title: 'Backlog', cash_in_play: 0 }]
      };

      renderBoard(state, container, [], store);

      const nav = container.querySelector('#month-navigator');
      expect(nav).not.toBeNull();

      const prevBtn = container.querySelector('#btn-prev-month');
      const nextBtn = container.querySelector('#btn-next-month');
      const addBtn = container.querySelector('#btn-add-month');
      const select = container.querySelector('#month-select');

      expect(prevBtn).not.toBeNull();
      expect(nextBtn).not.toBeNull();
      expect(addBtn).not.toBeNull();
      expect(select).not.toBeNull();

      expect(select.value).toBe('2026-08');
      const options = Array.from(select.querySelectorAll('option')).map(o => o.value);
      expect(options).toContain('2026-08');
      expect(options).toContain('2026-09');
    });
  });
});

