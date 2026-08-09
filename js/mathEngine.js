export function calculateCardMetrics(card) {
  const budgeted = Number(card?.amount) || 0;
  const transactions = Array.isArray(card?.transactions) ? card.transactions : [];
  const spent = transactions.reduce((sum, t) => {
    const val = Number(t?.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const remaining = budgeted - spent;
  let percentSpent = 0;
  if (budgeted > 0) {
    percentSpent = (spent / budgeted) * 100;
  } else if (spent > 0) {
    percentSpent = 100;
  }

  let status = 'normal';
  if (percentSpent >= 100) {
    status = 'danger';
  } else if (percentSpent >= 80) {
    status = 'amber';
  }

  return {
    budgeted,
    spent,
    remaining,
    percentSpent,
    status
  };
}

export function calculateColumnMetrics(columnConfig, columnCards = []) {
  const cashInPlay = Number(columnConfig?.cash_in_play) || 0;
  
  const totalBudgeted = columnCards.reduce((sum, card) => {
    const val = Number(card?.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const totalActualSpent = columnCards.reduce((sum, card) => {
    const cardSpent = calculateCardMetrics(card).spent;
    return sum + cardSpent;
  }, 0);

  const netBalance = cashInPlay - totalBudgeted;
  const actualBalance = cashInPlay - totalActualSpent;
  const isNegative = netBalance < 0;
  const isActualNegative = actualBalance < 0;

  return {
    cashInPlay,
    totalExpenses: totalBudgeted,
    totalBudgeted,
    totalActualSpent,
    netBalance,
    actualBalance,
    isNegative,
    isActualNegative
  };
}

export function calculateBoardMetrics(columns = [], cards = []) {
  const metricsMap = {};
  if (!Array.isArray(columns)) return metricsMap;

  columns.forEach(col => {
    const colCards = cards.filter(c => c.columnId === col.id);
    metricsMap[col.id] = calculateColumnMetrics(col, colCards);
  });

  return metricsMap;
}

