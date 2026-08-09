import { describe, it, expect, beforeEach } from 'vitest';
import { StateStore } from '../js/stateStore.js';

describe('StateStore Transaction Operations', () => {
  let store;

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    store = new StateStore('test_tx_key', 'test_tx_url');
  });

  it('defaults card.transactions to an empty array upon creation and replacement', () => {
    const card = store.addCard({ title: 'Groceries', amount: 500, columnId: 'in_budget' });
    expect(Array.isArray(card.transactions)).toBe(true);
    expect(card.transactions).toHaveLength(0);

    store.replaceCards([
      { id: 'c1', title: 'Utilities', amount: 200, columnId: 'in_budget' }
    ]);
    const replaced = store.getCards()[0];
    expect(replaced.id).toBe('c1');
    expect(Array.isArray(replaced.transactions)).toBe(true);
  });

  it('preserves existing card id and createdAt when replacing cards', () => {
    const isoDate = '2026-08-01T12:00:00.000Z';
    store.replaceCards([
      { id: 'card-123', title: 'Rent', amount: 1500, createdAt: isoDate }
    ]);
    const card = store.getCards()[0];
    expect(card.id).toBe('card-123');
    expect(card.createdAt).toBe(isoDate);
  });

  it('allows adding transactions to a card and updates unsaved changes flag', () => {
    const card = store.addCard({ title: 'Dining Out', amount: 200, columnId: 'in_budget' });
    store.markSynced();
    expect(store.hasUnsavedChanges).toBe(false);

    const txn = store.addTransaction(card.id, {
      date: '2026-08-08',
      description: 'Dinner at Italian Place',
      amount: 45.50
    });

    expect(txn).not.toBeNull();
    expect(txn.cardId).toBe(card.id);
    expect(txn.description).toBe('Dinner at Italian Place');
    expect(txn.amount).toBe(45.50);

    const updatedCard = store.getCards().find(c => c.id === card.id);
    expect(updatedCard.transactions).toHaveLength(1);
    expect(store.hasUnsavedChanges).toBe(true);
  });

  it('allows deleting a transaction from a card', () => {
    const card = store.addCard({ title: 'Gas', amount: 100, columnId: 'in_budget' });
    const txn1 = store.addTransaction(card.id, { date: '2026-08-01', description: 'Shell', amount: 30 });
    const txn2 = store.addTransaction(card.id, { date: '2026-08-05', description: 'Exxon', amount: 40 });

    expect(card.transactions).toHaveLength(2);

    const deleted = store.deleteTransaction(card.id, txn1.id);
    expect(deleted).toBe(true);

    const updatedCard = store.getCards().find(c => c.id === card.id);
    expect(updatedCard.transactions).toHaveLength(1);
    expect(updatedCard.transactions[0].id).toBe(txn2.id);
  });

  it('setCardTransactions updates transactions list for a card', () => {
    const card = store.addCard({ title: 'Shopping', amount: 300 });
    const txns = [
      { id: 't1', cardId: card.id, date: '2026-08-02', description: 'Store A', amount: 50 },
      { id: 't2', cardId: card.id, date: '2026-08-03', description: 'Store B', amount: 75 }
    ];

    const result = store.setCardTransactions(card.id, txns);
    expect(result).toBe(true);

    const updatedCard = store.getCards().find(c => c.id === card.id);
    expect(updatedCard.transactions).toEqual(txns);
  });
});
