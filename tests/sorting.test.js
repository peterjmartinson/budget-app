import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { renderBoard, sortCards } from '../js/boardRenderer.js';
import { StateStore } from '../js/stateStore.js';

describe('Column Card Sorting Engine & StateStore', () => {
  let dom;
  let document;
  let container;
  let stateStore;

  const mockConfigState = {
    board: { title: 'Monthly Budget Board' },
    columns: [
      { id: 'backlog', title: 'Backlog', cash_in_play: 0 },
      { id: 'in_budget', title: "In Month's Budget", cash_in_play: 1000 }
    ]
  };

  beforeEach(() => {
    let store = {};
    const localStorageMock = {
      getItem: vi.fn(key => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = String(value); }),
      removeItem: vi.fn(key => { delete store[key]; })
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });

    dom = new JSDOM('<!DOCTYPE html><div id="app"></div>');
    document = dom.window.document;
    container = document.getElementById('app');
    stateStore = new StateStore();
  });

  describe('sortCards helper function', () => {
    const cards = [
      { id: 'c1', title: 'Groceries', amount: 150 },
      { id: 'c2', title: 'Coffee', amount: 15 },
      { id: 'c3', title: 'Rent', amount: 1200 },
      { id: 'c4', title: 'Apple Music', amount: 11 }
    ];

    it('sorts by amount descending (amount-desc) by default', () => {
      const sorted = sortCards(cards, 'amount-desc');
      expect(sorted.map(c => c.id)).toEqual(['c3', 'c1', 'c2', 'c4']);
    });

    it('sorts by amount ascending (amount-asc)', () => {
      const sorted = sortCards(cards, 'amount-asc');
      expect(sorted.map(c => c.id)).toEqual(['c4', 'c2', 'c1', 'c3']);
    });

    it('sorts alphabetically by title ascending (title-asc)', () => {
      const sorted = sortCards(cards, 'title-asc');
      expect(sorted.map(c => c.title)).toEqual(['Apple Music', 'Coffee', 'Groceries', 'Rent']);
    });

    it('sorts alphabetically by title descending (title-desc)', () => {
      const sorted = sortCards(cards, 'title-desc');
      expect(sorted.map(c => c.title)).toEqual(['Rent', 'Groceries', 'Coffee', 'Apple Music']);
    });
  });

  describe('StateStore column sort persistence', () => {
    it('defaults to amount-desc when no sort option is set', () => {
      expect(stateStore.getColumnSort('backlog')).toBe('amount-desc');
    });

    it('saves and retrieves column sort option', () => {
      stateStore.setColumnSort('backlog', 'title-asc');
      expect(stateStore.getColumnSort('backlog')).toBe('title-asc');

      // Verify persistence across new StateStore instance
      const newStore = new StateStore();
      expect(newStore.getColumnSort('backlog')).toBe('title-asc');
    });
  });

  describe('DOM rendering of column sort dropdown', () => {
    it('renders sort select elements in column headers with active option selected', () => {
      stateStore.setColumnSort('in_budget', 'title-desc');
      renderBoard(mockConfigState, container, [], stateStore);

      const selectElements = container.querySelectorAll('.column-sort-select');
      expect(selectElements).toHaveLength(2);

      const inBudgetSelect = container.querySelector('.board-column[data-column-id="in_budget"] .column-sort-select');
      expect(inBudgetSelect).not.toBeNull();
      expect(inBudgetSelect.value).toBe('title-desc');
    });

    it('renders cards sorted according to configured column sort option', () => {
      stateStore.addCard({ id: 'c1', title: 'Groceries', amount: 150, columnId: 'backlog' });
      stateStore.addCard({ id: 'c2', title: 'Rent', amount: 1200, columnId: 'backlog' });
      stateStore.addCard({ id: 'c3', title: 'Coffee', amount: 15, columnId: 'backlog' });

      // Set sort option to amount-asc
      stateStore.setColumnSort('backlog', 'amount-asc');

      renderBoard(mockConfigState, container, stateStore.getCards(), stateStore);

      const backlogCards = container.querySelectorAll('.board-column[data-column-id="backlog"] .card-item');
      const titles = Array.from(backlogCards).map(el => el.querySelector('.card-title').textContent);
      expect(titles).toEqual(['Coffee', 'Groceries', 'Rent']);
    });
  });
});
