import { parseAmount, generateUUID } from './stateStore.js';

/**
 * Escapes a cell value for CSV formatting.
 * Wraps in quotes and escapes internal double quotes.
 */
function escapeCSVCell(val) {
  const str = (val === undefined || val === null) ? '' : String(val);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Serializes an array of card objects into a CSV formatted string.
 * @param {Array} cards 
 * @returns {string} CSV string
 */
export function exportToCSV(cards = []) {
  const headers = ['Column', 'Title', 'Description', 'Amount'];
  const headerRow = headers.map(escapeCSVCell).join(',');

  if (!Array.isArray(cards) || cards.length === 0) {
    return headerRow + '\n';
  }

  const rows = cards.map(card => {
    return [
      escapeCSVCell(card.columnId || 'backlog'),
      escapeCSVCell(card.title || ''),
      escapeCSVCell(card.description || ''),
      escapeCSVCell(card.amount !== undefined ? card.amount : 0)
    ].join(',');
  });

  return [headerRow, ...rows].join('\n');
}

/**
 * Parses a CSV string into an array of card objects.
 * Handles quoted fields, escaped quotes, and numeric parsing.
 * @param {string} csvText 
 * @returns {Array} Array of card objects
 */
export function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string' || !csvText.trim()) {
    return [];
  }

  const rawRows = parseCSVRows(csvText);
  if (rawRows.length === 0) {
    return [];
  }

  // Check if first row is a header
  const firstRow = rawRows[0];
  const isHeader = firstRow.some(cell => {
    const lower = cell.toLowerCase();
    return lower === 'column' || lower === 'title' || lower === 'amount';
  });

  const dataRows = isHeader ? rawRows.slice(1) : rawRows;

  return dataRows.map(row => {
    const columnId = (row[0] || 'backlog').trim();
    const title = (row[1] || 'Untitled Expense').trim();
    const description = (row[2] || '').trim();
    const amount = parseAmount(row[3]);

    return {
      id: generateUUID(),
      columnId: columnId || 'backlog',
      title: title || 'Untitled Expense',
      description,
      amount,
      createdAt: new Date().toISOString()
    };
  }).filter(card => card.title || card.amount > 0);
}

/**
 * Helper to parse raw CSV string into 2D array of rows and cells.
 */
function parseCSVRows(text) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
      i++;
      continue;
    }

    if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell);
      if (currentRow.some(c => c.trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      i++;
      continue;
    }

    currentCell += char;
    i++;
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some(c => c.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}
