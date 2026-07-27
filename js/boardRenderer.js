export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: (num % 1 === 0) ? 0 : 2
  }).format(num);
}

export function renderBoard(state, containerElement, cards = []) {
  if (!containerElement) return;

  const boardTitle = state?.board?.title || "Monthly Budget Board";
  const columns = Array.isArray(state?.columns) ? state.columns : [];

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
        <div class="header-badges">
          <span class="status-pill"><span class="status-dot"></span> LocalStorage Synced</span>
        </div>
      </div>
    </header>

    <main class="board-container">
      <div class="board-columns">
        ${columns.map(column => renderColumn(column, cards.filter(c => c.columnId === column.id))).join('')}
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
            <button type="button" id="modal-cancel-btn" class="btn btn-secondary">Cancel</button>
            <button type="submit" id="modal-submit-btn" class="btn btn-primary">Save Card</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderColumn(column, columnCards = []) {
  const formattedCash = formatCurrency(column.cash_in_play || 0);

  return `
    <section class="board-column" data-column-id="${escapeHtml(column.id)}">
      <div class="column-header">
        <div class="column-title-group">
          <h2 class="column-title">${escapeHtml(column.title)}</h2>
        </div>
        <div class="cash-badge" title="Cash in play">
          <span class="cash-label">Cash</span>
          <span class="cash-value">${formattedCash}</span>
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
    <div class="card-item" data-card-id="${escapeHtml(card.id)}">
      <div class="card-body">
        <div class="card-header-row">
          <h3 class="card-title">${escapeHtml(card.title)}</h3>
          <span class="card-amount">${formattedAmount}</span>
        </div>
        ${card.description ? `<p class="card-description">${escapeHtml(card.description)}</p>` : ''}
      </div>
      <div class="card-actions">
        <button class="btn-edit-card" data-card-id="${escapeHtml(card.id)}" title="Edit Card">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          Edit
        </button>
        <button class="btn-delete-card" data-card-id="${escapeHtml(card.id)}" title="Delete Card">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          Delete
        </button>
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
