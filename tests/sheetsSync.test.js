import { describe, it, expect, vi } from 'vitest';
import { fetchFromSheets, syncToSheets } from '../js/sheetsSync.js';

describe('Sheets Sync Engine', () => {
  const mockUrl = 'https://script.google.com/macros/s/AKfycbx_test/exec';

  describe('fetchFromSheets', () => {
    it('should return error if webAppUrl is missing', async () => {
      const result = await fetchFromSheets('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('URL not configured');
      expect(result.cards).toEqual([]);
    });

    it('should fetch remote cards successfully from Apps Script Web App', async () => {
      const mockCards = [
        { columnId: 'backlog', title: 'Internet', description: 'Wifi bill', amount: 80 }
      ];
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockCards
      });

      const result = await fetchFromSheets(mockUrl, mockFetch);
      expect(mockFetch).toHaveBeenCalledWith(mockUrl, expect.objectContaining({
        method: 'GET',
        redirect: 'follow'
      }));
      expect(result.success).toBe(true);
      expect(result.cards).toEqual(mockCards);
    });

    it('should handle response wrapped in a data object', async () => {
      const mockCards = [
        { columnId: 'committed', title: 'Power', description: 'Electric', amount: 110 }
      ];
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', cards: mockCards })
      });

      const result = await fetchFromSheets(mockUrl, mockFetch);
      expect(result.success).toBe(true);
      expect(result.cards).toEqual(mockCards);
    });

    it('should handle network errors gracefully without crashing', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const result = await fetchFromSheets(mockUrl, mockFetch);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network offline');
      expect(result.cards).toEqual([]);
    });
  });

  describe('syncToSheets', () => {
    it('should return error if webAppUrl is missing', async () => {
      const result = await syncToSheets('', []);
      expect(result.success).toBe(false);
      expect(result.error).toContain('URL not configured');
    });

    it('should POST card array to Apps Script Web App', async () => {
      const mockCards = [
        { columnId: 'backlog', title: 'Gas', description: 'Car fuel', amount: 45 }
      ];
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success' })
      });

      const result = await syncToSheets(mockUrl, mockCards, mockFetch);
      expect(mockFetch).toHaveBeenCalledWith(mockUrl, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockCards)
      }));
      expect(result.success).toBe(true);
    });

    it('should handle network POST failures gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('HTTP 500 Server Error'));

      const result = await syncToSheets(mockUrl, [{ title: 'Failed' }], mockFetch);
      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 500 Server Error');
    });
  });
});
