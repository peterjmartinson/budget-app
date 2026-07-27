import { describe, it, expect } from 'vitest';
import { calculateColumnMetrics, calculateBoardMetrics } from '../js/mathEngine.js';

describe('mathEngine calculation module', () => {
  it('calculates column metrics accurately for empty card list', () => {
    const colConfig = { id: 'rollover', title: 'Rollover', cash_in_play: 500 };
    const metrics = calculateColumnMetrics(colConfig, []);

    expect(metrics.cashInPlay).toBe(500);
    expect(metrics.totalExpenses).toBe(0);
    expect(metrics.netBalance).toBe(500);
    expect(metrics.isNegative).toBe(false);
  });

  it('calculates total expenses and positive net balance with decimal card amounts', () => {
    const colConfig = { id: 'in_budget', title: "In Month's Budget", cash_in_play: 4500 };
    const cards = [
      { amount: 1200.50 },
      { amount: 300.25 },
      { amount: 49.25 }
    ];
    const metrics = calculateColumnMetrics(colConfig, cards);

    expect(metrics.cashInPlay).toBe(4500);
    expect(metrics.totalExpenses).toBe(1550);
    expect(metrics.netBalance).toBe(2950);
    expect(metrics.isNegative).toBe(false);
  });

  it('detects negative net balance when total expenses exceed cash in play', () => {
    const colConfig = { id: 'backlog', title: 'Backlog', cash_in_play: 0 };
    const cards = [
      { amount: 250 }
    ];
    const metrics = calculateColumnMetrics(colConfig, cards);

    expect(metrics.cashInPlay).toBe(0);
    expect(metrics.totalExpenses).toBe(250);
    expect(metrics.netBalance).toBe(-250);
    expect(metrics.isNegative).toBe(true);
  });

  it('calculateBoardMetrics calculates metrics across all columns on board', () => {
    const columns = [
      { id: 'c1', cash_in_play: 1000 },
      { id: 'c2', cash_in_play: 0 }
    ];
    const cards = [
      { columnId: 'c1', amount: 200 },
      { columnId: 'c2', amount: 50 }
    ];

    const boardMetrics = calculateBoardMetrics(columns, cards);
    expect(boardMetrics.c1).toEqual({ cashInPlay: 1000, totalExpenses: 200, netBalance: 800, isNegative: false });
    expect(boardMetrics.c2).toEqual({ cashInPlay: 0, totalExpenses: 50, netBalance: -50, isNegative: true });
  });
});
