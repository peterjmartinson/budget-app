import { describe, it, expect } from 'vitest';
import { exportToCSV, parseCSV } from '../js/csvEngine.js';

describe('CSV Engine', () => {
  describe('exportToCSV', () => {
    it('should export card array into CSV format with standard headers', () => {
      const cards = [
        { columnId: 'backlog', title: 'Groceries', description: 'Weekly food', amount: 150.50 },
        { columnId: 'committed', title: 'Rent', description: 'Monthly payment', amount: 1200 }
      ];

      const csv = exportToCSV(cards);
      const lines = csv.trim().split('\n');

      expect(lines[0]).toBe('"Column","Title","Description","Amount"');
      expect(lines[1]).toBe('"backlog","Groceries","Weekly food","150.5"');
      expect(lines[2]).toBe('"committed","Rent","Monthly payment","1200"');
    });

    it('should handle special characters and quotes in fields correctly', () => {
      const cards = [
        { columnId: 'backlog', title: 'Books, "Special Edition"', description: 'Line 1\nLine 2', amount: 49.99 }
      ];

      const csv = exportToCSV(cards);
      expect(csv).toContain('"Books, ""Special Edition"""');
    });

    it('should return empty table with headers when cards array is empty', () => {
      const csv = exportToCSV([]);
      expect(csv.trim()).toBe('"Column","Title","Description","Amount"');
    });
  });

  describe('parseCSV', () => {
    it('should parse valid CSV text into card objects', () => {
      const csvText = `"Column","Title","Description","Amount"\n"backlog","Groceries","Weekly food","150.50"\n"committed","Rent","Monthly payment","1200"`;
      const cards = parseCSV(csvText);

      expect(cards).toHaveLength(2);
      expect(cards[0]).toMatchObject({
        columnId: 'backlog',
        title: 'Groceries',
        description: 'Weekly food',
        amount: 150.5
      });
      expect(cards[1]).toMatchObject({
        columnId: 'committed',
        title: 'Rent',
        description: 'Monthly payment',
        amount: 1200
      });
    });

    it('should handle unquoted CSV fields and numbers', () => {
      const csvText = `Column,Title,Description,Amount\nbacklog,Coffee,Morning fix,4.50`;
      const cards = parseCSV(csvText);

      expect(cards).toHaveLength(1);
      expect(cards[0].title).toBe('Coffee');
      expect(cards[0].amount).toBe(4.5);
    });

    it('should handle escaped quotes in quoted CSV fields', () => {
      const csvText = `"Column","Title","Description","Amount"\n"backlog","Book ""Advanced JS""","Tech read","29.99"`;
      const cards = parseCSV(csvText);

      expect(cards).toHaveLength(1);
      expect(cards[0].title).toBe('Book "Advanced JS"');
      expect(cards[0].amount).toBe(29.99);
    });

    it('should return empty array for invalid or empty CSV input', () => {
      expect(parseCSV('')).toEqual([]);
      expect(parseCSV(null)).toEqual([]);
    });
  });
});
