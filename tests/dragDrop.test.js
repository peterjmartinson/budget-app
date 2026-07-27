import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { renderBoard } from '../js/boardRenderer.js';
import { StateStore } from '../js/stateStore.js';
import { calculateColumnMetrics } from '../js/mathEngine.js';

describe('Drag-and-Drop state movement & metric updates', () => {
  let dom;
  let document;
  let container;
  let stateStore;

  const mockConfigState = {
    board: { title: 'Monthly Budget Board' },
    columns: [
      { id: 'backlog', title: 'Backlog', cash_in_play: 0 },
      { id: 'in_budget', title: "In Month's Budget", cash_in_play: 4500 }
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

  it('moveCard updates card columnId and persists state', () => {
    const card = stateStore.addCard({ title: 'Rent', amount: 1500, columnId: 'in_budget' });
    expect(card.columnId).toBe('in_budget');

    const moved = stateStore.moveCard(card.id, 'backlog');
    expect(moved.columnId).toBe('backlog');

    const updatedCard = stateStore.getCards().find(c => c.id === card.id);
    expect(updatedCard.columnId).toBe('backlog');
  });

  it('dragging card from "In Month\'s Budget" to "Backlog" instantly updates metrics', () => {
    const card = stateStore.addCard({ title: 'Rent', amount: 1500, columnId: 'in_budget' });

    // Initial state rendering
    renderBoard(mockConfigState, container, stateStore.getCards());

    let inBudgetCol = container.querySelector('.board-column[data-column-id="in_budget"]');
    let backlogCol = container.querySelector('.board-column[data-column-id="backlog"]');

    expect(inBudgetCol.querySelector('.metric-expenses').textContent).toBe('$1,500');
    expect(inBudgetCol.querySelector('.metric-balance').textContent).toBe('$3,000');
    expect(backlogCol.querySelector('.metric-expenses').textContent).toBe('$0');
    expect(backlogCol.querySelector('.metric-balance').textContent).toBe('$0');

    // Move card
    stateStore.moveCard(card.id, 'backlog');

    // Re-render
    renderBoard(mockConfigState, container, stateStore.getCards());

    inBudgetCol = container.querySelector('.board-column[data-column-id="in_budget"]');
    backlogCol = container.querySelector('.board-column[data-column-id="backlog"]');

    expect(inBudgetCol.querySelector('.metric-expenses').textContent).toBe('$0');
    expect(inBudgetCol.querySelector('.metric-balance').textContent).toBe('$4,500');

    expect(backlogCol.querySelector('.metric-expenses').textContent).toBe('$1,500');
    expect(backlogCol.querySelector('.metric-balance').textContent).toBe('-$1,500');
    expect(backlogCol.querySelector('.metric-balance').classList.contains('negative-balance')).toBe(true);
  });
});
