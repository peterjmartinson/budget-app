import { calculateColumnMetrics } from './mathEngine.js';

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absVal = Math.abs(num);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: (absVal % 1 === 0) ? 0 : 2
  }).format(absVal);

  return isNegative ? `-${formatted}` : formatted;
}

export function renderBoard(state, containerElement, cards = [], store = null) {
  if (!containerElement) return;

  const boardTitle = state?.board?.title || "Monthly Budget Board";
  const columns = Array.isArray(state?.columns) ? state.columns : [];
  const isDirty = store ? store.hasUnsavedChanges : false;
  const sheetsUrl = store ? store.getSheetsUrl() : '';

  const envelopes = (store && typeof store.getEnvelopes === 'function') ? store.getEnvelopes() : {};

  containerElement.innerHTML = `
    <header class="board-header">
      <div class="header-content">
        <div class="logo-group">
          <div class="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <h1 class="board-title">${escapeHtml(boardTitle)}</h1>
        </div>

        <div class="header-actions">
          <button id="btn-fetch-sheets" class="btn btn-secondary btn-sm" title="Fetch state from Google Sheet">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Fetch Sheet
          </button>
          
          <button id="btn-sync-sheets" class="btn btn-primary btn-sm" title="Sync state to Google Sheet">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Sync to Sheet
            ${isDirty 
              ? `<span class="badge badge-dirty" title="Local modifications not synced to Sheet">Unsaved Changes</span>` 
              : `<span class="badge badge-synced" title="All changes saved">Synced</span>`}
          </button>

          <div class="action-divider"></div>

          <button id="btn-export-csv" class="btn btn-secondary btn-sm" title="Export board to CSV file">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Export CSV
          </button>

          <button id="btn-import-csv" class="btn btn-secondary btn-sm" title="Import cards from CSV file">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18v-6"></path><path d="m9 15 3-3 3 3"></path></svg>
            Import CSV
          </button>
          <input type="file" id="csv-file-input" accept=".csv" style="display:none;" />

          <button id="btn-open-settings" class="btn btn-icon-only" title="Configure Google Apps Script URL">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
        </div>
      </div>
      <div id="sync-toast-container"></div>
    </header>

    <main class="board-container">
      <div class="board-columns">
        ${columns.map(column => {
          const colWithCash = {
            ...column,
            cash_in_play: (envelopes && envelopes[column.id] !== undefined) 
              ? envelopes[column.id] 
              : (column.cash_in_play !== undefined ? column.cash_in_play : 0)
          };
          return renderColumn(colWithCash, cards.filter(c => c.columnId === column.id));
        }).join('')}
      </div>
    </main>

    <!-- Card Edit / Create Modal -->
    <div id="card-modal" class="modal-overlay hidden" aria-hidden="true">
      <div class="modal-card">
        <div class="modal-header">
          <h3 id="modal-title" class="modal-heading">Add Card</h3>
          <button id="modal-close-btn" class="modal-close" aria-label="Close">&times;</button>
        </div>
        <form id="card-form" class="modal-form">
          <input type="hidden" id="card-id-input" value="">
          <input type="hidden" id="card-column-input" value="">
          
          <div class="form-group">
            <label for="card-title-input">Title</label>
            <input type="text" id="card-title-input" required placeholder="e.g., Grocery Shopping" class="form-input">
          </div>

          <div class="form-group">
            <label for="card-amount-input">Amount ($)</label>
            <input type="number" id="card-amount-input" step="0.01" min="0" required placeholder="0.00" class="form-input">
          </div>

          <div class="form-group">
            <label for="card-desc-input">Description</label>
            <textarea id="card-desc-input" rows="3" placeholder="Optional details..." class="form-input form-textarea"></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" id="modal-delete-btn" class="btn btn-danger hidden">Delete Card</button>
            <button type="button" id="modal-cancel-btn" class="btn btn-secondary">Cancel</button>
            <button type="submit" id="modal-submit-btn" class="btn btn-primary">Save Card</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Settings Modal -->
    <div id="settings-modal" class="modal-overlay hidden" aria-hidden="true">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-heading">Google Sheets Integration Settings</h3>
          <button id="settings-close-btn" class="modal-close" aria-label="Close">&times;</button>
        </div>
        <form id="settings-form" class="modal-form">
          <div class="form-group">
            <label for="sheets-url-input">Google Apps Script Web App URL</label>
            <input type="url" id="sheets-url-input" placeholder="https://script.google.com/macros/s/.../exec" value="${escapeHtml(sheetsUrl)}" class="form-input">
            <small class="form-help">Deploy <code>Code.gs</code> in Google Apps Script and paste your Web App URL here to enable cross-device synchronization.</small>
          </div>

          <div class="modal-actions">
            <button type="button" id="settings-cancel-btn" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Configuration</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderColumn(column, columnCards = []) {
  const metrics = calculateColumnMetrics(column, columnCards);
  const formattedCash = formatCurrency(metrics.cashInPlay);
  const formattedExpenses = formatCurrency(metrics.totalExpenses);
  const formattedBalance = formatCurrency(metrics.netBalance);
  const balanceClass = metrics.isNegative ? 'negative-balance' : 'positive-balance';

  return `
    <section class="board-column" data-column-id="${escapeHtml(column.id)}">
      <div class="column-header">
        <div class="column-title-group">
          <h2 class="column-title">${escapeHtml(column.title)}</h2>
        </div>
        <div class="column-metrics-grid">
          <div class="metric-item" title="Click to edit Cash in Play">
            <span class="metric-label">Cash</span>
            <span class="metric-value metric-cash clickable-cash" data-column-id="${escapeHtml(column.id)}" role="button" tabindex="0">${formattedCash}</span>
          </div>
          <div class="metric-item" title="Sum of Column Expenses">
            <span class="metric-label">Expenses</span>
            <span class="metric-value metric-expenses">${formattedExpenses}</span>
          </div>
          <div class="metric-item" title="Net Balance (Cash - Expenses)">
            <span class="metric-label">Net Balance</span>
            <span class="metric-value metric-balance ${balanceClass}">${formattedBalance}</span>
          </div>
        </div>
      </div>

      <div class="column-cards-container" data-column-id="${escapeHtml(column.id)}">
        ${columnCards.length === 0 ? `
          <div class="empty-column-placeholder">
            <span class="placeholder-icon">+</span>
            <p>No cards in this column</p>
          </div>
        ` : columnCards.map(card => renderCardItem(card)).join('')}
      </div>

      <div class="column-footer">
        <button class="btn-add-card" data-column-id="${escapeHtml(column.id)}">
          <span class="btn-icon">+</span> Add Card
        </button>
      </div>
    </section>
  `;
}

function renderCardItem(card) {
  const formattedAmount = formatCurrency(card.amount || 0);

  return `
    <div class="card-item" draggable="true" data-card-id="${escapeHtml(card.id)}">
      <div class="card-drag-handle" title="Drag card to move">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
      </div>
      <div class="card-body">
        <div class="card-header-row">
          <h3 class="card-title">${escapeHtml(card.title)}</h3>
          <span class="card-amount">${formattedAmount}</span>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
