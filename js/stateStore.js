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

export function getDefaultMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export class StateStore {
  constructor(storageKey = STORAGE_KEY, urlKey = SHEETS_URL_KEY, initialMonth = null) {
    this.storageKey = storageKey;
    this.urlKey = urlKey;
    this.initialMonthProvided = Boolean(initialMonth);
    this.currentMonth = initialMonth || getDefaultMonth();
    this.months = {};
    this.cards = [];
    this.envelopes = {};
    this.columnSorts = {};
    this.hasUnsavedChanges = false;
    this.loadState();
  }

  ensureMonth(monthKey) {
    if (!monthKey) return;
    if (!this.months[monthKey] || typeof this.months[monthKey] !== 'object') {
      this.months[monthKey] = {
        cards: [],
        envelopes: {},
        columnSorts: {}
      };
    }
  }

  _loadActiveMonthData() {
    this.ensureMonth(this.currentMonth);
    const active = this.months[this.currentMonth];
    this.cards = (Array.isArray(active.cards) ? active.cards : []).map(c => ({
      ...c,
      transactions: Array.isArray(c.transactions) ? c.transactions : []
    }));
    this.envelopes = (active.envelopes && typeof active.envelopes === 'object') ? { ...active.envelopes } : {};
    this.columnSorts = (active.columnSorts && typeof active.columnSorts === 'object') ? { ...active.columnSorts } : {};
  }

  _syncActiveMonthDataToStore() {
    this.ensureMonth(this.currentMonth);
    this.months[this.currentMonth] = {
      cards: this.cards,
      envelopes: this.envelopes,
      columnSorts: this.columnSorts
    };
  }

  getCurrentMonth() {
    return this.currentMonth;
  }

  setCurrentMonth(monthKey) {
    if (!monthKey || typeof monthKey !== 'string') return;
    const cleanKey = monthKey.trim();
    this._syncActiveMonthDataToStore();
    this.currentMonth = cleanKey;
    this.ensureMonth(cleanKey);
    this._loadActiveMonthData();
    this.hasUnsavedChanges = false;
    this.saveState();
  }

  getAvailableMonths() {
    const keys = Object.keys(this.months);
    if (!keys.includes(this.currentMonth)) {
      keys.push(this.currentMonth);
    }
    return keys.sort();
  }

  addMonth(monthKey) {
    if (!monthKey || typeof monthKey !== 'string') return;
    const cleanKey = monthKey.trim();
    this.ensureMonth(cleanKey);
    this.saveState();
    return cleanKey;
  }

  loadState() {
    try {
      if (typeof localStorage === 'undefined') {
        this.months = { [this.currentMonth]: { cards: [], envelopes: {}, columnSorts: {} } };
        this._loadActiveMonthData();
        return this.cards;
      }
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.months && typeof parsed.months === 'object') {
          this.months = parsed.months;
          if (parsed.currentMonth && !this.initialMonthProvided) {
            this.currentMonth = parsed.currentMonth;
          }
        } else if (Array.isArray(parsed)) {
          // Legacy cards array
          this.months = {
            [this.currentMonth]: {
              cards: parsed,
              envelopes: {},
              columnSorts: {}
            }
          };
        } else if (parsed && typeof parsed === 'object') {
          // Legacy state object { cards, envelopes, columnSorts }
          this.months = {
            [this.currentMonth]: {
              cards: Array.isArray(parsed.cards) ? parsed.cards : [],
              envelopes: (parsed.envelopes && typeof parsed.envelopes === 'object') ? parsed.envelopes : {},
              columnSorts: (parsed.columnSorts && typeof parsed.columnSorts === 'object') ? parsed.columnSorts : {}
            }
          };
        } else {
          this.months = { [this.currentMonth]: { cards: [], envelopes: {}, columnSorts: {} } };
        }
      } else {
        this.months = { [this.currentMonth]: { cards: [], envelopes: {}, columnSorts: {} } };
      }

      this.ensureMonth(this.currentMonth);
      this._loadActiveMonthData();
      this.saveState();
    } catch (err) {
      console.warn('Failed to load state from localStorage:', err);
      this.months = { [this.currentMonth]: { cards: [], envelopes: {}, columnSorts: {} } };
      this.cards = [];
      this.envelopes = {};
      this.columnSorts = {};
    }
    return this.cards;
  }

  saveState() {
    try {
      if (typeof localStorage !== 'undefined') {
        this._syncActiveMonthDataToStore();
        localStorage.setItem(this.storageKey, JSON.stringify({
          currentMonth: this.currentMonth,
          months: this.months
        }));
      }
    } catch (err) {
      console.error('Failed to save state to localStorage:', err);
    }
  }


  getColumnSort(columnId) {
    if (!columnId) return 'amount-desc';
    return this.columnSorts[columnId] || 'amount-desc';
  }

  setColumnSort(columnId, sortOption) {
    if (!columnId) return;
    const validOptions = ['amount-desc', 'amount-asc', 'title-asc', 'title-desc'];
    const option = validOptions.includes(sortOption) ? sortOption : 'amount-desc';
    this.columnSorts[columnId] = option;
    this.saveState();
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
      createdAt: c.createdAt || new Date().toISOString(),
      transactions: Array.isArray(c.transactions) ? c.transactions : []
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

  addCard({ title, description = '', amount = 0, columnId, transactions = [] }) {
    const card = {
      id: generateUUID(),
      title: String(title || 'New Expense').trim(),
      description: String(description || '').trim(),
      amount: parseAmount(amount),
      columnId: String(columnId || 'backlog'),
      createdAt: new Date().toISOString(),
      transactions: Array.isArray(transactions) ? transactions : []
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

  addTransaction(cardId, { date, description = '', amount = 0 }) {
    const card = this.cards.find(c => c.id === cardId);
    if (!card) return null;

    if (!Array.isArray(card.transactions)) {
      card.transactions = [];
    }

    const transaction = {
      id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      cardId: card.id,
      date: String(date || new Date().toISOString().slice(0, 10)).trim(),
      description: String(description || '').trim(),
      amount: parseAmount(amount)
    };

    card.transactions.push(transaction);
    this.hasUnsavedChanges = true;
    this.saveState();
    return transaction;
  }

  deleteTransaction(cardId, transactionId) {
    const card = this.cards.find(c => c.id === cardId);
    if (!card || !Array.isArray(card.transactions)) return false;

    const index = card.transactions.findIndex(t => t.id === transactionId);
    if (index === -1) return false;

    card.transactions.splice(index, 1);
    this.hasUnsavedChanges = true;
    this.saveState();
    return true;
  }

  setCardTransactions(cardId, transactions = []) {
    const card = this.cards.find(c => c.id === cardId);
    if (!card) return false;

    card.transactions = Array.isArray(transactions) ? transactions : [];
    this.saveState();
    return true;
  }
}

