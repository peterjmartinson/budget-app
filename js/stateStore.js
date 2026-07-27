export const STORAGE_KEY = 'budget_board_state';

export function parseAmount(input) {
  if (typeof input === 'number') {
    return isNaN(input) ? 0 : input;
  }
  if (typeof input !== 'string') {
    return 0;
  }
  const cleaned = input.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'card_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

export class StateStore {
  constructor(storageKey = STORAGE_KEY) {
    this.storageKey = storageKey;
    this.cards = [];
    this.loadState();
  }

  loadState() {
    try {
      if (typeof localStorage === 'undefined') {
        this.cards = [];
        return this.cards;
      }
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.cards = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.cards) ? parsed.cards : []);
      } else {
        this.cards = [];
      }
    } catch (err) {
      console.warn('Failed to load state from localStorage:', err);
      this.cards = [];
    }
    return this.cards;
  }

  saveState() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.cards));
      }
    } catch (err) {
      console.error('Failed to save state to localStorage:', err);
    }
  }

  getCards() {
    return this.cards;
  }

  getCardsForColumn(columnId) {
    return this.cards.filter(card => card.columnId === columnId);
  }

  addCard({ title, description = '', amount = 0, columnId }) {
    const card = {
      id: generateUUID(),
      title: String(title || 'New Expense').trim(),
      description: String(description || '').trim(),
      amount: parseAmount(amount),
      columnId: String(columnId || 'backlog'),
      createdAt: new Date().toISOString()
    };
    this.cards.push(card);
    this.saveState();
    return card;
  }

  updateCard(id, updates = {}) {
    const card = this.cards.find(c => c.id === id);
    if (!card) return null;

    if (updates.title !== undefined) card.title = String(updates.title).trim();
    if (updates.description !== undefined) card.description = String(updates.description).trim();
    if (updates.amount !== undefined) card.amount = parseAmount(updates.amount);
    if (updates.columnId !== undefined) card.columnId = String(updates.columnId);

    this.saveState();
    return card;
  }

  deleteCard(id) {
    const index = this.cards.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.cards.splice(index, 1);
    this.saveState();
    return true;
  }

  moveCard(id, targetColumnId) {
    const card = this.cards.find(c => c.id === id);
    if (!card) return null;

    card.columnId = String(targetColumnId);
    this.saveState();
    return card;
  }
}
