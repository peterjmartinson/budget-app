export function calculateColumnMetrics(columnConfig, columnCards = []) {
  const cashInPlay = Number(columnConfig?.cash_in_play) || 0;
  const totalExpenses = columnCards.reduce((sum, card) => {
    const val = Number(card?.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const netBalance = cashInPlay - totalExpenses;
  const isNegative = netBalance < 0;

  return {
    cashInPlay,
    totalExpenses,
    netBalance,
    isNegative
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
