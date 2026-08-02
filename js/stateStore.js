export const STORAGE_KEY = 'budget_board_state';
export const SHEETS_URL_KEY = 'budget_sheets_url';

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
  constructor(storageKey = STORAGE_KEY, urlKey = SHEETS_URL_KEY) {
    this.storageKey = storageKey;
    this.urlKey = urlKey;
    this.cards = [];
    this.envelopes = {};
    this.hasUnsavedChanges = false;
    this.loadState();
  }

  loadState() {
    try {
      if (typeof localStorage === 'undefined') {
        this.cards = [];
        this.envelopes = {};
        return this.cards;
      }
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.cards = parsed;
          this.envelopes = {};
        } else if (parsed && typeof parsed === 'object') {
          this.cards = Array.isArray(parsed.cards) ? parsed.cards : [];
          this.envelopes = (parsed.envelopes && typeof parsed.envelopes === 'object') ? parsed.envelopes : {};
        } else {
          this.cards = [];
          this.envelopes = {};
        }
      } else {
        this.cards = [];
        this.envelopes = {};
      }
    } catch (err) {
      console.warn('Failed to load state from localStorage:', err);
      this.cards = [];
      this.envelopes = {};
    }
    return this.cards;
  }

  saveState() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify({
          cards: this.cards,
          envelopes: this.envelopes
        }));
      }
    } catch (err) {
      console.error('Failed to save state to localStorage:', err);
    }
  }

  getSheetsUrl() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(this.urlKey) || '';
      }
    } catch (err) {
      console.warn('Failed to get Sheets URL from localStorage:', err);
    }
    return '';
  }

  saveSheetsUrl(url) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.urlKey, String(url || '').trim());
      }
    } catch (err) {
      console.error('Failed to save Sheets URL to localStorage:', err);
    }
  }

  markSynced() {
    this.hasUnsavedChanges = false;
  }

  getEnvelopes() {
    return this.envelopes;
  }

  getEnvelopeCash(columnId) {
    return Number(this.envelopes[columnId]) || 0;
  }

  setEnvelopeCash(columnId, amount) {
    const parsed = parseAmount(amount);
    this.envelopes[columnId] = parsed;
    this.hasUnsavedChanges = true;
    this.saveState();
    return parsed;
  }

  replaceEnvelopes(envelopesData = []) {
    if (Array.isArray(envelopesData)) {
      const newEnvelopes = {};
      envelopesData.forEach(item => {
        const col = item.columnId || item.column;
        if (col) {
          newEnvelopes[col] = parseAmount(item.cash);
        }
      });
      this.envelopes = newEnvelopes;
    } else if (envelopesData && typeof envelopesData === 'object') {
      const newEnvelopes = {};
      Object.keys(envelopesData).forEach(col => {
        newEnvelopes[col] = parseAmount(envelopesData[col]);
      });
      this.envelopes = newEnvelopes;
    }
    this.saveState();
  }

  replaceCards(newCards = []) {
    if (!Array.isArray(newCards)) return;
    this.cards = newCards.map(c => ({
      id: c.id || generateUUID(),
      columnId: String(c.columnId || 'backlog'),
      title: String(c.title || 'Untitled Expense').trim(),
      description: String(c.description || '').trim(),
      amount: parseAmount(c.amount),
      createdAt: c.createdAt || new Date().toISOString()
    }));
    this.hasUnsavedChanges = false;
    this.saveState();
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
    this.hasUnsavedChanges = true;
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

    this.hasUnsavedChanges = true;
    this.saveState();
    return card;
  }

  deleteCard(id) {
    const index = this.cards.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.cards.splice(index, 1);
    this.hasUnsavedChanges = true;
    this.saveState();
    return true;
  }

  moveCard(id, targetColumnId) {
    const card = this.cards.find(c => c.id === id);
    if (!card) return null;

    card.columnId = String(targetColumnId);
    this.hasUnsavedChanges = true;
    this.saveState();
    return card;
  }
}
