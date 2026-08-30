import { loadConfig } from './configLoader.js';
import { renderBoard, formatCurrency, getAdjacentMonth } from './boardRenderer.js';
import { calculateCardMetrics } from './mathEngine.js';
import { StateStore } from './stateStore.js';
import { exportToCSV, parseCSV } from './csvEngine.js';
import { fetchFromSheets, syncToSheets, fetchEnvelopesFromSheets, syncEnvelopesToSheets, fetchTransactionsFromSheets, syncTransactionsToSheets, getSheetNamesForMonth } from './sheetsSync.js';


let appStateConfig = null;
let stateStore = null;
let draggedCardId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('app');
  if (!container) return;

  stateStore = new StateStore();

  try {
    appStateConfig = await loadConfig('config.yaml');
    renderApp(container);
    setupEventListeners(container);
    setupDragAndDrop(container);
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

function renderApp(container) {
  if (!container || !appStateConfig || !stateStore) return;
  renderBoard(appStateConfig, container, stateStore.getCards(), stateStore);
}

function setupEventListeners(container) {
  container.addEventListener('click', async (event) => {
    // Delete Transaction Trigger
    const deleteTxBtn = event.target.closest('.btn-delete-tx');
    if (deleteTxBtn) {
      const cardId = deleteTxBtn.dataset.cardId;
      const txId = deleteTxBtn.dataset.txId;
      if (cardId && txId) {
        stateStore.deleteTransaction(cardId, txId);
        const updatedCard = stateStore.getCards().find(c => c.id === cardId);
        if (updatedCard) {
          updateModalLedgerContent(updatedCard);
        }
        renderApp(container);
      }
      return;
    }

    // Clickable Cash Inline Editing Trigger
    const cashSpan = event.target.closest('.clickable-cash');
    if (cashSpan) {
      const columnId = cashSpan.dataset.columnId;
      const currentCash = stateStore.getEnvelopeCash(columnId);
      const input = document.createElement('input');
      input.type = 'number';
      input.step = '0.01';
      input.className = 'cash-inline-input';
      input.value = currentCash;
      input.dataset.columnId = columnId;

      cashSpan.replaceWith(input);
      input.focus();
      input.select();

      const commitCashEdit = () => {
        const newCash = input.value;
        stateStore.setEnvelopeCash(columnId, newCash);
        renderApp(container);
      };

      input.addEventListener('blur', commitCashEdit, { once: true });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        } else if (e.key === 'Escape') {
          input.removeEventListener('blur', commitCashEdit);
          renderApp(container);
        }
      });
      return;
    }

    // Add Card Trigger
    const addBtn = event.target.closest('.btn-add-card');
    if (addBtn) {
      const columnId = addBtn.dataset.columnId;
      openModal({ columnId });
      return;
    }

    // Card Item Click Trigger (Whole-Card Click to Edit)
    const cardEl = event.target.closest('.card-item');
    const dragHandle = event.target.closest('.card-drag-handle');
    if (cardEl && !dragHandle) {
      const cardId = cardEl.dataset.cardId;
      const card = stateStore.getCards().find(c => c.id === cardId);
      if (card) {
        openModal(card);
      }
      return;
    }

    // Modal Delete Card Trigger
    const deleteBtn = event.target.closest('#modal-delete-btn');
    if (deleteBtn) {
      const cardId = deleteBtn.dataset.cardId;
      const card = stateStore.getCards().find(c => c.id === cardId);
      if (card) {
        const confirmed = typeof window !== 'undefined' && window.confirm ?
          window.confirm(`Are you sure you want to delete "${card.title}"?`) : true;
        if (confirmed) {
          stateStore.deleteCard(cardId);
          closeModal();
          renderApp(container);
        }
      }
      return;
    }

    // Month Navigation Triggers
    const prevMonthBtn = event.target.closest('#btn-prev-month');
    if (prevMonthBtn) {
      const currentMonth = stateStore.getCurrentMonth();
      const prevMonth = getAdjacentMonth(currentMonth, -1);
      stateStore.addMonth(prevMonth);
      stateStore.setCurrentMonth(prevMonth);
      renderApp(container);
      return;
    }

    const nextMonthBtn = event.target.closest('#btn-next-month');
    if (nextMonthBtn) {
      const currentMonth = stateStore.getCurrentMonth();
      const nextMonth = getAdjacentMonth(currentMonth, 1);
      stateStore.addMonth(nextMonth);
      stateStore.setCurrentMonth(nextMonth);
      renderApp(container);
      return;
    }

    const addMonthBtn = event.target.closest('#btn-add-month');
    if (addMonthBtn) {
      const currentMonth = stateStore.getCurrentMonth();
      const defaultNext = getAdjacentMonth(currentMonth, 1);
      const inputMonth = (typeof window !== 'undefined' && window.prompt)
        ? window.prompt('Enter month (YYYY-MM):', defaultNext)
        : defaultNext;

      if (inputMonth && /^\d{4}-\d{2}$/.test(inputMonth.trim())) {
        const cleanMonth = inputMonth.trim();
        stateStore.addMonth(cleanMonth);
        stateStore.setCurrentMonth(cleanMonth);
        renderApp(container);
        showToast(`Switched to month ${cleanMonth}`, 'info');
      } else if (inputMonth) {
        showToast('Invalid month format. Please use YYYY-MM (e.g. 2026-09).', 'warning');
      }
      return;
    }

    // Export CSV Trigger
    const exportBtn = event.target.closest('#btn-export-csv');
    if (exportBtn) {
      handleExportCSV();
      return;
    }

    // Import CSV Trigger
    const importBtn = event.target.closest('#btn-import-csv');
    if (importBtn) {
      const fileInput = document.getElementById('csv-file-input');
      if (fileInput) fileInput.click();
      return;
    }

    // Fetch Sheets Trigger
    const fetchBtn = event.target.closest('#btn-fetch-sheets');
    if (fetchBtn) {
      await handleFetchSheets(container);
      return;
    }


    // Sync Sheets Trigger
    const syncBtn = event.target.closest('#btn-sync-sheets');
    if (syncBtn) {
      await handleSyncSheets(container);
      return;
    }

    // Settings Modal Open Trigger
    const settingsBtn = event.target.closest('#btn-open-settings');
    if (settingsBtn) {
      openSettingsModal();
      return;
    }

    // Settings Modal Close Trigger
    const closeSettingsBtn = event.target.closest('#settings-close-btn') || event.target.closest('#settings-cancel-btn');
    if (closeSettingsBtn) {
      closeSettingsModal();
      return;
    }

    // Card Modal Close Trigger
    const closeBtn = event.target.closest('#modal-close-btn') || event.target.closest('#modal-cancel-btn');
    if (closeBtn) {
      closeModal();
      return;
    }

    // Backdrop Click for Modals
    if (event.target.classList.contains('modal-overlay')) {
      closeModal();
      closeSettingsModal();
      return;
    }
  });

  // Change Event for File Input, Month Select & Column Sort Select
  container.addEventListener('change', (event) => {
    if (event.target.id === 'month-select') {
      const selectedMonth = event.target.value;
      if (selectedMonth && stateStore) {
        stateStore.setCurrentMonth(selectedMonth);
        renderApp(container);
      }
      return;
    }

    if (event.target.classList.contains('column-sort-select')) {
      const columnId = event.target.dataset.columnId;
      const sortOption = event.target.value;
      if (columnId && stateStore) {
        stateStore.setColumnSort(columnId, sortOption);
        renderApp(container);
      }
      return;
    }

    if (event.target.id === 'csv-file-input') {
      handleImportCSVFile(event.target.files[0], container);
    }
  });

  // Submit Handler for Forms
  container.addEventListener('submit', (event) => {
    if (event.target.id === 'card-form') {
      event.preventDefault();
      const cardId = document.getElementById('card-id-input')?.value;
      const columnId = document.getElementById('card-column-input')?.value;
      const title = document.getElementById('card-title-input')?.value;
      const amount = document.getElementById('card-amount-input')?.value;
      const description = document.getElementById('card-desc-input')?.value;

      if (cardId) {
        stateStore.updateCard(cardId, { title, amount, description });
      } else {
        stateStore.addCard({ title, amount, description, columnId });
      }

      closeModal();
      renderApp(container);
      return;
    }

    if (event.target.id === 'add-transaction-form') {
      event.preventDefault();
      const cardId = document.getElementById('card-id-input')?.value;
      const date = document.getElementById('tx-date-input')?.value;
      const description = document.getElementById('tx-desc-input')?.value;
      const amount = document.getElementById('tx-amount-input')?.value;

      if (cardId && date && amount) {
        stateStore.addTransaction(cardId, { date, description, amount });
        const updatedCard = stateStore.getCards().find(c => c.id === cardId);
        if (updatedCard) {
          updateModalLedgerContent(updatedCard);
        }
        renderApp(container);
      }
      return;
    }

    if (event.target.id === 'settings-form') {
      event.preventDefault();
      const urlInput = document.getElementById('sheets-url-input')?.value;
      stateStore.saveSheetsUrl(urlInput);
      closeSettingsModal();
      showToast('Settings saved successfully.', 'info');
      renderApp(container);
      return;
    }
  });
}

function handleExportCSV() {
  const currentMonth = stateStore.getCurrentMonth();
  const cards = stateStore.getCards();
  const csvContent = exportToCSV(cards);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `budget_board_${currentMonth}_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`CSV for ${currentMonth} exported successfully!`, 'success');
}

function handleImportCSVFile(file, container) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const csvText = e.target.result;
      const parsedCards = parseCSV(csvText);

      if (parsedCards.length === 0) {
        showToast('No valid card rows found in CSV file.', 'warning');
        return;
      }

      stateStore.replaceCards(parsedCards);
      renderApp(container);
      showToast(`Imported ${parsedCards.length} cards from CSV into ${stateStore.getCurrentMonth()}.`, 'success');
    } catch (err) {
      console.error('CSV parse error:', err);
      showToast('Failed to parse CSV file: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

async function handleFetchSheets(container) {
  const url = stateStore.getSheetsUrl();
  if (!url) {
    showToast('Please set your Google Apps Script URL in Settings.', 'warning');
    openSettingsModal();
    return;
  }

  const currentMonth = stateStore.getCurrentMonth();
  const { cardsSheet, envelopesSheet, transactionsSheet } = getSheetNamesForMonth(currentMonth);

  showToast(`Fetching ${currentMonth} cards, envelopes, and transactions from Google Sheet...`, 'info');
  const [cardsResult, envResult, txResult] = await Promise.all([
    fetchFromSheets(url, null, cardsSheet),
    fetchEnvelopesFromSheets(url, null, envelopesSheet),
    fetchTransactionsFromSheets(url, null, transactionsSheet)
  ]);

  if (cardsResult.success) {
    const rawCards = cardsResult.cards;
    const rawTxns = txResult.success ? txResult.transactions : [];
    const cardsWithTxns = rawCards.map(c => ({
      ...c,
      transactions: rawTxns.filter(t => String(t.cardId) === String(c.id))
    }));
    stateStore.replaceCards(cardsWithTxns);
  }

  if (envResult.success) {
    stateStore.replaceEnvelopes(envResult.envelopes);
  }

  if (cardsResult.success || envResult.success || txResult.success) {
    renderApp(container);
    showToast(`Fetched latest data for ${currentMonth} from Google Sheet.`, 'success');
  } else {
    showToast(`Fetch failed: ${cardsResult.error || envResult.error || txResult.error}. Operating offline.`, 'error');
  }
}

async function handleSyncSheets(container) {
  const url = stateStore.getSheetsUrl();
  if (!url) {
    showToast('Please set your Google Apps Script URL in Settings.', 'warning');
    openSettingsModal();
    return;
  }

  const currentMonth = stateStore.getCurrentMonth();
  const { cardsSheet, envelopesSheet, transactionsSheet } = getSheetNamesForMonth(currentMonth);

  const columns = Array.isArray(appStateConfig?.columns) ? appStateConfig.columns : [];
  const currentEnvelopes = stateStore.getEnvelopes();
  const envelopesList = columns.map(col => ({
    columnId: col.id,
    cash: (currentEnvelopes && currentEnvelopes[col.id] !== undefined) ? currentEnvelopes[col.id] : 0
  }));

  const cards = stateStore.getCards();
  const transactionsList = cards.flatMap(c => 
    (c.transactions || []).map(t => ({
      id: t.id,
      cardId: c.id,
      date: t.date,
      description: t.description,
      amount: t.amount
    }))
  );

  showToast(`Syncing cards, envelopes, and transactions for ${currentMonth} to Google Sheet...`, 'info');
  const [cardsResult, envResult, txResult] = await Promise.all([
    syncToSheets(url, cards, null, cardsSheet),
    syncEnvelopesToSheets(url, envelopesList, null, envelopesSheet),
    syncTransactionsToSheets(url, transactionsList, null, transactionsSheet)
  ]);

  if (cardsResult.success && envResult.success && txResult.success) {
    stateStore.markSynced();
    renderApp(container);
    showToast(`Successfully synced ${currentMonth} to Google Sheet!`, 'success');
  } else {
    showToast(`Sync failed: ${cardsResult.error || envResult.error || txResult.error}. Local state preserved.`, 'error');
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('sync-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function setupDragAndDrop(container) {
  container.addEventListener('dragstart', (event) => {
    const cardEl = event.target.closest('.card-item');
    if (!cardEl) return;

    draggedCardId = cardEl.dataset.cardId;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', draggedCardId);
      event.dataTransfer.effectAllowed = 'move';
    }
    cardEl.classList.add('is-dragging');
  });

  container.addEventListener('dragover', (event) => {
    const cardsContainer = event.target.closest('.column-cards-container') || event.target.closest('.board-column');
    if (!cardsContainer) return;

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    const dropZone = cardsContainer.classList.contains('column-cards-container')
      ? cardsContainer
      : cardsContainer.querySelector('.column-cards-container');

    if (dropZone && !dropZone.classList.contains('drag-over')) {
      removeAllDragOverClasses();
      dropZone.classList.add('drag-over');
    }
  });

  container.addEventListener('dragleave', (event) => {
    const dropZone = event.target.closest('.column-cards-container');
    if (dropZone && !dropZone.contains(event.relatedTarget)) {
      dropZone.classList.remove('drag-over');
    }
  });

  container.addEventListener('drop', (event) => {
    const colElement = event.target.closest('.board-column');
    if (!colElement) return;

    event.preventDefault();
    removeAllDragOverClasses();

    const targetColumnId = colElement.dataset.columnId;
    const cardId = draggedCardId || (event.dataTransfer ? event.dataTransfer.getData('text/plain') : null);

    if (cardId && targetColumnId) {
      stateStore.moveCard(cardId, targetColumnId);
      draggedCardId = null;
      renderApp(container);
    }
  });

  container.addEventListener('dragend', (event) => {
    draggedCardId = null;
    removeAllDragOverClasses();
    const draggingEls = container.querySelectorAll('.card-item.is-dragging');
    draggingEls.forEach(el => el.classList.remove('is-dragging'));
  });
}

function removeAllDragOverClasses() {
  const activeDropZones = document.querySelectorAll('.column-cards-container.drag-over');
  activeDropZones.forEach(zone => zone.classList.remove('drag-over'));
}

function openModal(cardData = {}) {
  const modal = document.getElementById('card-modal');
  const modalHeading = document.getElementById('modal-title');
  const cardIdInput = document.getElementById('card-id-input');
  const columnInput = document.getElementById('card-column-input');
  const titleInput = document.getElementById('card-title-input');
  const amountInput = document.getElementById('card-amount-input');
  const descInput = document.getElementById('card-desc-input');
  const deleteBtn = document.getElementById('modal-delete-btn');
  const ledgerSection = document.getElementById('card-ledger-section');

  if (!modal) return;

  if (cardData.id) {
    modalHeading.textContent = 'Edit Envelope Card';
    cardIdInput.value = cardData.id;
    columnInput.value = cardData.columnId || '';
    titleInput.value = cardData.title || '';
    amountInput.value = cardData.amount !== undefined ? cardData.amount : '';
    descInput.value = cardData.description || '';
    if (deleteBtn) {
      deleteBtn.classList.remove('hidden');
      deleteBtn.dataset.cardId = cardData.id;
    }

    if (ledgerSection) {
      ledgerSection.classList.remove('hidden');
      updateModalLedgerContent(cardData);
    }
  } else {
    modalHeading.textContent = 'Add Card';
    cardIdInput.value = '';
    columnInput.value = cardData.columnId || 'backlog';
    titleInput.value = '';
    amountInput.value = '';
    descInput.value = '';
    if (deleteBtn) {
      deleteBtn.classList.add('hidden');
      delete deleteBtn.dataset.cardId;
    }
    if (ledgerSection) {
      ledgerSection.classList.add('hidden');
    }
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  setTimeout(() => titleInput.focus(), 50);
}

function updateModalLedgerContent(card) {
  const spentText = document.getElementById('drawdown-spent-text');
  const remainingText = document.getElementById('drawdown-remaining-text');
  const progressBar = document.getElementById('drawdown-progress-bar');
  const ledgerList = document.getElementById('transaction-ledger-list');
  const dateInput = document.getElementById('tx-date-input');
  const descInput = document.getElementById('tx-desc-input');
  const amountInput = document.getElementById('tx-amount-input');

  const cardMetrics = calculateCardMetrics(card);
  const formattedSpent = formatCurrency(cardMetrics.spent);
  const formattedBudget = formatCurrency(cardMetrics.budgeted);
  const formattedRemaining = formatCurrency(cardMetrics.remaining);

  if (spentText) spentText.textContent = `Spent: ${formattedSpent} / ${formattedBudget}`;
  if (remainingText) remainingText.textContent = `Remaining: ${formattedRemaining}`;

  if (progressBar) {
    const widthPct = Math.min(100, Math.max(0, cardMetrics.percentSpent));
    progressBar.style.width = `${widthPct}%`;
    progressBar.className = `progress-bar-fill progress-${cardMetrics.status}`;
  }

  if (ledgerList) {
    const transactions = Array.isArray(card.transactions) ? card.transactions : [];
    if (transactions.length === 0) {
      ledgerList.innerHTML = '';
    } else {
      ledgerList.innerHTML = transactions.map(t => `
        <div class="transaction-item" data-tx-id="${escapeHtml(t.id)}">
          <div class="tx-info">
            <span class="tx-date">${escapeHtml(t.date || '')}</span>
            <span class="tx-desc">${escapeHtml(t.description || 'No description')}</span>
          </div>
          <div class="tx-actions">
            <span class="tx-amount">-${formatCurrency(t.amount)}</span>
            <button type="button" class="btn-delete-tx" data-card-id="${escapeHtml(card.id)}" data-tx-id="${escapeHtml(t.id)}" title="Delete transaction">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  if (dateInput) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
  if (descInput) descInput.value = '';
  if (amountInput) amountInput.value = '';
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

function closeModal() {
  const modal = document.getElementById('card-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function openSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const urlInput = document.getElementById('sheets-url-input');
  if (!modal) return;

  if (urlInput && stateStore) {
    urlInput.value = stateStore.getSheetsUrl();
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  setTimeout(() => urlInput?.focus(), 50);
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

