import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { renderBoard } from '../js/boardRenderer.js';

describe('boardRenderer module', () => {
  let dom;
  let document;
  let container;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><div id="app"></div>');
    document = dom.window.document;
    container = document.getElementById('app');
  });

  it('renders board header and all 4 columns dynamically', () => {
    const state = {
      board: { title: 'Monthly Budget Board' },
      columns: [
        { id: 'backlog', title: 'Backlog', cash_in_play: 0 },
        { id: 'rollover', title: 'Rollover', cash_in_play: 500 },
        { id: 'in_budget', title: "In Month's Budget", cash_in_play: 4500 },
        { id: 'unfunded', title: 'Unfunded', cash_in_play: 0 }
      ]
    };

    renderBoard(state, container);

    const titleElement = container.querySelector('.board-title');
    expect(titleElement).not.toBeNull();
    expect(titleElement.textContent).toBe('Monthly Budget Board');

    const columnElements = container.querySelectorAll('.board-column');
    expect(columnElements).toHaveLength(4);

    const columnIds = Array.from(columnElements).map(el => el.dataset.columnId);
    expect(columnIds).toEqual(['backlog', 'rollover', 'in_budget', 'unfunded']);

    const columnTitles = Array.from(container.querySelectorAll('.column-title')).map(el => el.textContent);
    expect(columnTitles).toEqual(['Backlog', 'Rollover', "In Month's Budget", 'Unfunded']);

    const cashValues = Array.from(container.querySelectorAll('.metric-cash')).map(el => el.textContent);
    expect(cashValues).toEqual(['$0', '$500', '$4,500', '$0']);
  });

  it('renders sync action buttons, status badge, and settings modal', () => {
    const state = {
      board: { title: 'Test Board' },
      columns: [{ id: 'backlog', title: 'Backlog', cash_in_play: 0 }]
    };

    const mockStoreDirty = { hasUnsavedChanges: true, getSheetsUrl: () => 'https://script.google.com/test' };
    renderBoard(state, container, [], mockStoreDirty);

    expect(container.querySelector('#btn-fetch-sheets')).not.toBeNull();
    expect(container.querySelector('#btn-sync-sheets')).not.toBeNull();
    expect(container.querySelector('#btn-export-csv')).not.toBeNull();
    expect(container.querySelector('#btn-import-csv')).not.toBeNull();
    expect(container.querySelector('#btn-open-settings')).not.toBeNull();

    const dirtyBadge = container.querySelector('.badge-dirty');
    expect(dirtyBadge).not.toBeNull();
    expect(dirtyBadge.textContent).toBe('Unsaved Changes');

    const settingsModal = container.querySelector('#settings-modal');
    expect(settingsModal).not.toBeNull();
    const urlInput = container.querySelector('#sheets-url-input');
    expect(urlInput.value).toBe('https://script.google.com/test');
  });
});

