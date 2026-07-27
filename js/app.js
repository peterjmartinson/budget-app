import { loadConfig } from './configLoader.js';
import { renderBoard } from './boardRenderer.js';
import { StateStore } from './stateStore.js';

let appStateConfig = null;
let stateStore = null;

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('app');
  if (!container) return;

  stateStore = new StateStore();

  try {
    appStateConfig = await loadConfig('config.yaml');
    renderApp(container);
    setupEventListeners(container);
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

function renderApp(container) {
  if (!container || !appStateConfig || !stateStore) return;
  renderBoard(appStateConfig, container, stateStore.getCards());
}

function setupEventListeners(container) {
  container.addEventListener('click', (event) => {
    // Add Card Trigger
    const addBtn = event.target.closest('.btn-add-card');
    if (addBtn) {
      const columnId = addBtn.dataset.columnId;
      openModal({ columnId });
      return;
    }

    // Edit Card Trigger
    const editBtn = event.target.closest('.btn-edit-card');
    if (editBtn) {
      const cardId = editBtn.dataset.cardId;
      const card = stateStore.getCards().find(c => c.id === cardId);
      if (card) {
        openModal(card);
      }
      return;
    }

    // Delete Card Trigger
    const deleteBtn = event.target.closest('.btn-delete-card');
    if (deleteBtn) {
      const cardId = deleteBtn.dataset.cardId;
      const card = stateStore.getCards().find(c => c.id === cardId);
      if (card) {
        const confirmed = typeof window !== 'undefined' && window.confirm ?
          window.confirm(`Are you sure you want to delete "${card.title}"?`) : true;
        if (confirmed) {
          stateStore.deleteCard(cardId);
          renderApp(container);
        }
      }
      return;
    }

    // Close Modal Trigger
    const closeBtn = event.target.closest('#modal-close-btn') || event.target.closest('#modal-cancel-btn');
    if (closeBtn) {
      closeModal();
      return;
    }

    // Backdrop Click
    if (event.target.classList.contains('modal-overlay')) {
      closeModal();
      return;
    }
  });

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
  });
}

function openModal(cardData = {}) {
  const modal = document.getElementById('card-modal');
  const modalHeading = document.getElementById('modal-title');
  const cardIdInput = document.getElementById('card-id-input');
  const columnInput = document.getElementById('card-column-input');
  const titleInput = document.getElementById('card-title-input');
  const amountInput = document.getElementById('card-amount-input');
  const descInput = document.getElementById('card-desc-input');

  if (!modal) return;

  if (cardData.id) {
    modalHeading.textContent = 'Edit Card';
    cardIdInput.value = cardData.id;
    columnInput.value = cardData.columnId || '';
    titleInput.value = cardData.title || '';
    amountInput.value = cardData.amount !== undefined ? cardData.amount : '';
    descInput.value = cardData.description || '';
  } else {
    modalHeading.textContent = 'Add Card';
    cardIdInput.value = '';
    columnInput.value = cardData.columnId || 'backlog';
    titleInput.value = '';
    amountInput.value = '';
    descInput.value = '';
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
