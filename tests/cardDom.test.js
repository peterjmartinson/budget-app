import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { renderBoard } from '../js/boardRenderer.js';
import { StateStore } from '../js/stateStore.js';

describe('card DOM rendering & modal components', () => {
  let dom;
  let document;
  let container;
  let stateStore;

  const mockConfigState = {
    board: { title: 'Monthly Budget Board' },
    columns: [
      { id: 'backlog', title: 'Backlog', cash_in_play: 0 },
      { id: 'rollover', title: 'Rollover', cash_in_play: 500 },
      { id: 'in_budget', title: "In Month's Budget", cash_in_play: 4500 },
      { id: 'unfunded', title: 'Unfunded', cash_in_play: 0 }
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

  it('renders + Add Card button at the bottom of each column container', () => {
    renderBoard(mockConfigState, container, stateStore.getCards());

    const addButtons = container.querySelectorAll('.btn-add-card');
    expect(addButtons).toHaveLength(4);
    expect(addButtons[0].dataset.columnId).toBe('backlog');
    expect(addButtons[1].dataset.columnId).toBe('rollover');
  });

  it('renders cards correctly inside their assigned column containers', () => {
    stateStore.addCard({ title: 'Internet Bill', description: 'Fiber', amount: 80, columnId: 'in_budget' });
    stateStore.addCard({ title: 'Coffee', description: 'Daily espresso', amount: 15, columnId: 'backlog' });

    renderBoard(mockConfigState, container, stateStore.getCards());

    const inBudgetCol = container.querySelector('.board-column[data-column-id="in_budget"]');
    const backlogCol = container.querySelector('.board-column[data-column-id="backlog"]');

    const inBudgetCards = inBudgetCol.querySelectorAll('.card-item');
    expect(inBudgetCards).toHaveLength(1);
    expect(inBudgetCards[0].querySelector('.card-title').textContent).toBe('Internet Bill');
    expect(inBudgetCards[0].querySelector('.card-amount').textContent).toBe('$80');

    const backlogCards = backlogCol.querySelectorAll('.card-item');
    expect(backlogCards).toHaveLength(1);
    expect(backlogCards[0].querySelector('.card-title').textContent).toBe('Coffee');
  });

  it('does not render edit/delete buttons or card description on card front, and renders modal delete button', () => {
    const card = stateStore.addCard({ title: 'Subscriptions', description: 'Streaming', amount: 30, columnId: 'in_budget' });
    renderBoard(mockConfigState, container, stateStore.getCards());

    const editBtn = container.querySelector('.btn-edit-card');
    const deleteBtn = container.querySelector('.btn-delete-card');
    const cardDesc = container.querySelector('.card-description');
    const modalDeleteBtn = container.querySelector('#modal-delete-btn');

    expect(editBtn).toBeNull();
    expect(deleteBtn).toBeNull();
    expect(cardDesc).toBeNull();
    expect(modalDeleteBtn).not.toBeNull();
  });
});
