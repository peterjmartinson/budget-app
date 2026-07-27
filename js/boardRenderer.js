export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(num);
}

export function renderBoard(state, containerElement) {
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
          <span class="status-pill"><span class="status-dot"></span> Dynamic Config Loaded</span>
        </div>
      </div>
    </header>

    <main class="board-container">
      <div class="board-columns">
        ${columns.map(column => renderColumn(column)).join('')}
      </div>
    </main>
  `;
}

function renderColumn(column) {
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
        <div class="empty-column-placeholder">
          <span class="placeholder-icon">+</span>
          <p>No cards in this column</p>
        </div>
      </div>
    </section>
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
