import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateStore, parseAmount } from '../js/stateStore.js';

describe('stateStore module', () => {
  let localStorageMock;

  beforeEach(() => {
    let store = {};
    localStorageMock = {
      getItem: vi.fn(key => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = String(value); }),
      removeItem: vi.fn(key => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; })
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });
  });

  describe('parseAmount helper', () => {
    it('parses raw numeric input, strings with currency symbols, and floats correctly', () => {
      expect(parseAmount(1500)).toBe(1500);
      expect(parseAmount('1500')).toBe(1500);
      expect(parseAmount('$1,250.50')).toBe(1250.5);
      expect(parseAmount('  $ 500  ')).toBe(500);
      expect(parseAmount('invalid')).toBe(0);
      expect(parseAmount('')).toBe(0);
    });
  });

  describe('StateStore class', () => {
    it('initializes with empty cards array when localStorage is empty', () => {
      const store = new StateStore();
      expect(store.getCards()).toEqual([]);
    });

    it('addCard creates card with UUID, column context, and parsed numeric amount', () => {
      const store = new StateStore();
      const card = store.addCard({
        title: 'Groceries',
        description: 'Weekly food',
        amount: '$150.75',
        columnId: 'in_budget'
      });

      expect(card.id).toBeDefined();
      expect(typeof card.id).toBe('string');
      expect(card.title).toBe('Groceries');
      expect(card.description).toBe('Weekly food');
      expect(card.amount).toBe(150.75);
      expect(card.columnId).toBe('in_budget');
      expect(store.getCards()).toHaveLength(1);
    });

    it('updateCard modifies target card fields and syncs to localStorage', () => {
      const store = new StateStore();
      const card = store.addCard({
        title: 'Rent',
        description: 'Apartment',
        amount: 1500,
        columnId: 'in_budget'
      });

      const updated = store.updateCard(card.id, {
        title: 'Rent & Utilities',
        amount: '$1650'
      });

      expect(updated.title).toBe('Rent & Utilities');
      expect(updated.amount).toBe(1650);
      expect(updated.description).toBe('Apartment'); // preserved
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'budget_board_state',
        expect.stringContaining('Rent & Utilities')
      );
    });

    it('deleteCard removes target card by id and updates localStorage', () => {
      const store = new StateStore();
      const card1 = store.addCard({ title: 'Card 1', amount: 10, columnId: 'backlog' });
      const card2 = store.addCard({ title: 'Card 2', amount: 20, columnId: 'backlog' });

      expect(store.getCards()).toHaveLength(2);

      const deleted = store.deleteCard(card1.id);
      expect(deleted).toBe(true);

      const remaining = store.getCards();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(card2.id);
    });

    it('getCardsForColumn filters cards correctly', () => {
      const store = new StateStore();
      store.addCard({ title: 'Card A', amount: 10, columnId: 'backlog' });
      store.addCard({ title: 'Card B', amount: 20, columnId: 'rollover' });
      store.addCard({ title: 'Card C', amount: 30, columnId: 'backlog' });

      const backlogCards = store.getCardsForColumn('backlog');
      expect(backlogCards).toHaveLength(2);
      expect(backlogCards.map(c => c.title)).toEqual(['Card A', 'Card C']);
    });

    it('loads state accurately from localStorage across page reloads', () => {
      const initialStore = new StateStore();
      initialStore.addCard({ title: 'Persisted Card', amount: 99.99, columnId: 'unfunded' });

      // Simulate new page load with same localStorage
      const reloadedStore = new StateStore();
      const cards = reloadedStore.getCards();

      expect(cards).toHaveLength(1);
      expect(cards[0].title).toBe('Persisted Card');
      expect(cards[0].amount).toBe(99.99);
      expect(cards[0].columnId).toBe('unfunded');
    });
  });
});
