import { describe, it, expect } from 'vitest';
import { calculateColumnMetrics, calculateBoardMetrics, calculateCardMetrics } from '../js/mathEngine.js';

describe('mathEngine calculation module', () => {
  it('calculates card metrics (spent, remaining, percentSpent, status)', () => {
    const card = {
      amount: 500,
      transactions: [
        { amount: 150 },
        { amount: 250 }
      ]
    };
    const metrics = calculateCardMetrics(card);
    expect(metrics.budgeted).toBe(500);
    expect(metrics.spent).toBe(400);
    expect(metrics.remaining).toBe(100);
    expect(metrics.percentSpent).toBe(80);
    expect(metrics.status).toBe('amber');

    const maxedCard = { amount: 100, transactions: [{ amount: 100 }] };
    expect(calculateCardMetrics(maxedCard).status).toBe('danger');

    const normalCard = { amount: 100, transactions: [{ amount: 50 }] };
    expect(calculateCardMetrics(normalCard).status).toBe('normal');
  });

  it('calculates column metrics accurately for empty card list', () => {
    const colConfig = { id: 'rollover', title: 'Rollover', cash_in_play: 500 };
    const metrics = calculateColumnMetrics(colConfig, []);

    expect(metrics.cashInPlay).toBe(500);
    expect(metrics.totalExpenses).toBe(0);
    expect(metrics.totalBudgeted).toBe(0);
    expect(metrics.totalActualSpent).toBe(0);
    expect(metrics.netBalance).toBe(500);
    expect(metrics.actualBalance).toBe(500);
    expect(metrics.isNegative).toBe(false);
    expect(metrics.isActualNegative).toBe(false);
  });

  it('calculates total expenses, actual spent, and dual balances', () => {
    const colConfig = { id: 'in_budget', title: "In Month's Budget", cash_in_play: 4500 };
    const cards = [
      { amount: 1200, transactions: [{ amount: 300 }] },
      { amount: 300, transactions: [{ amount: 50 }] },
      { amount: 50, transactions: [] }
    ];
    const metrics = calculateColumnMetrics(colConfig, cards);

    expect(metrics.cashInPlay).toBe(4500);
    expect(metrics.totalBudgeted).toBe(1550);
    expect(metrics.totalActualSpent).toBe(350);
    expect(metrics.netBalance).toBe(2950);
    expect(metrics.actualBalance).toBe(4150);
    expect(metrics.isNegative).toBe(false);
  });

  it('detects negative net balance when total expenses exceed cash in play', () => {
    const colConfig = { id: 'backlog', title: 'Backlog', cash_in_play: 0 };
    const cards = [
      { amount: 250, transactions: [{ amount: 100 }] }
    ];
    const metrics = calculateColumnMetrics(colConfig, cards);

    expect(metrics.cashInPlay).toBe(0);
    expect(metrics.totalExpenses).toBe(250);
    expect(metrics.totalActualSpent).toBe(100);
    expect(metrics.netBalance).toBe(-250);
    expect(metrics.actualBalance).toBe(-100);
    expect(metrics.isNegative).toBe(true);
    expect(metrics.isActualNegative).toBe(true);
  });

  it('calculateBoardMetrics calculates metrics across all columns on board', () => {
    const columns = [
      { id: 'c1', cash_in_play: 1000 },
      { id: 'c2', cash_in_play: 0 }
    ];
    const cards = [
      { columnId: 'c1', amount: 200, transactions: [{ amount: 50 }] },
      { columnId: 'c2', amount: 50, transactions: [] }
    ];

    const boardMetrics = calculateBoardMetrics(columns, cards);
    expect(boardMetrics.c1).toMatchObject({ cashInPlay: 1000, totalExpenses: 200, totalActualSpent: 50, netBalance: 800, actualBalance: 950 });
    expect(boardMetrics.c2).toMatchObject({ cashInPlay: 0, totalExpenses: 50, totalActualSpent: 0, netBalance: -50, actualBalance: 0 });
  });
});

