import { loadConfig } from './configLoader.js';
import { renderBoard } from './boardRenderer.js';
import { StateStore } from './stateStore.js';
import { exportToCSV, parseCSV } from './csvEngine.js';
import { fetchFromSheets, syncToSheets, fetchEnvelopesFromSheets, syncEnvelopesToSheets } from './sheetsSync.js';

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

  // Change Event for File Input & Column Sort Select
  container.addEventListener('change', (event) => {
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
    }

    if (event.target.id === 'settings-form') {
      event.preventDefault();
      const urlInput = document.getElementById('sheets-url-input')?.value;
      stateStore.saveSheetsUrl(urlInput);
      closeSettingsModal();
      showToast('Settings saved successfully.', 'info');
      renderApp(container);
    }
  });
}

function handleExportCSV() {
  const cards = stateStore.getCards();
  const csvContent = exportToCSV(cards);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `budget_board_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('CSV exported successfully!', 'success');
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
      showToast(`Imported ${parsedCards.length} cards from CSV.`, 'success');
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

  const sheetName = appStateConfig?.google_sheets?.sheet_name || appStateConfig?.board?.sheet_name || appStateConfig?.sheet_name;
  const envelopesSheetName = appStateConfig?.google_sheets?.envelopes_sheet_name || 'Envelopes';

  showToast('Fetching cards and envelopes from Google Sheet...', 'info');
  const [cardsResult, envResult] = await Promise.all([
    fetchFromSheets(url, null, sheetName),
    fetchEnvelopesFromSheets(url, null, envelopesSheetName)
  ]);

  if (cardsResult.success) {
    stateStore.replaceCards(cardsResult.cards);
  }

  if (envResult.success) {
    stateStore.replaceEnvelopes(envResult.envelopes);
  }

  if (cardsResult.success || envResult.success) {
    renderApp(container);
    showToast('Fetched latest data from Google Sheet.', 'success');
  } else {
    showToast(`Fetch failed: ${cardsResult.error || envResult.error}. Operating offline.`, 'error');
  }
}

async function handleSyncSheets(container) {
  const url = stateStore.getSheetsUrl();
  if (!url) {
    showToast('Please set your Google Apps Script URL in Settings.', 'warning');
    openSettingsModal();
    return;
  }

  const sheetName = appStateConfig?.google_sheets?.sheet_name || appStateConfig?.board?.sheet_name || appStateConfig?.sheet_name;
  const envelopesSheetName = appStateConfig?.google_sheets?.envelopes_sheet_name || 'Envelopes';

  const columns = Array.isArray(appStateConfig?.columns) ? appStateConfig.columns : [];
  const currentEnvelopes = stateStore.getEnvelopes();
  const envelopesList = columns.map(col => ({
    columnId: col.id,
    cash: (currentEnvelopes && currentEnvelopes[col.id] !== undefined) ? currentEnvelopes[col.id] : 0
  }));

  showToast('Syncing cards and envelopes to Google Sheet...', 'info');
  const [cardsResult, envResult] = await Promise.all([
    syncToSheets(url, stateStore.getCards(), null, sheetName),
    syncEnvelopesToSheets(url, envelopesList, null, envelopesSheetName)
  ]);

  if (cardsResult.success && envResult.success) {
    stateStore.markSynced();
    renderApp(container);
    showToast('Successfully synced cards and envelopes to Google Sheet!', 'success');
  } else {
    showToast(`Sync failed: ${cardsResult.error || envResult.error}. Local state preserved.`, 'error');
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

  if (!modal) return;

  if (cardData.id) {
    modalHeading.textContent = 'Edit Card';
    cardIdInput.value = cardData.id;
    columnInput.value = cardData.columnId || '';
    titleInput.value = cardData.title || '';
    amountInput.value = cardData.amount !== undefined ? cardData.amount : '';
    descInput.value = cardData.description || '';
    if (deleteBtn) {
      deleteBtn.classList.remove('hidden');
      deleteBtn.dataset.cardId = cardData.id;
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
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  setTimeout(() => titleInput.focus(), 50);
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
