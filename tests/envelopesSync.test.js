import { describe, it, expect, vi } from 'vitest';
import { fetchEnvelopesFromSheets, syncEnvelopesToSheets } from '../js/sheetsSync.js';

describe('Envelopes Sync Module', () => {
  const mockUrl = 'https://script.google.com/macros/s/AKfycbx_test/exec';

  describe('fetchEnvelopesFromSheets', () => {
    it('should return error if webAppUrl is missing', async () => {
      const result = await fetchEnvelopesFromSheets('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('URL not configured');
      expect(result.envelopes).toEqual([]);
    });

    it('should fetch envelope cash rows from Apps Script Web App', async () => {
      const mockEnvelopes = [
        { columnId: 'backlog', cash: 100 },
        { columnId: 'rollover', cash: 500 }
      ];
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockEnvelopes
      });

      const result = await fetchEnvelopesFromSheets(mockUrl, mockFetch, 'Envelopes');
      expect(mockFetch).toHaveBeenCalledWith(
        `${mockUrl}?sheet=Envelopes&type=envelopes`,
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.success).toBe(true);
      expect(result.envelopes).toEqual(mockEnvelopes);
    });

    it('should handle network errors gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const result = await fetchEnvelopesFromSheets(mockUrl, mockFetch);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network offline');
      expect(result.envelopes).toEqual([]);
    });
  });

  describe('syncEnvelopesToSheets', () => {
    it('should return error if webAppUrl is missing', async () => {
      const result = await syncEnvelopesToSheets('', []);
      expect(result.success).toBe(false);
      expect(result.error).toContain('URL not configured');
    });

    it('should POST envelope cash list to Apps Script Web App', async () => {
      const mockEnvelopes = [
        { columnId: 'backlog', cash: 200 }
      ];
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', count: 1 })
      });

      const result = await syncEnvelopesToSheets(mockUrl, mockEnvelopes, mockFetch, 'Envelopes');
      expect(mockFetch).toHaveBeenCalledWith(
        `${mockUrl}?sheet=Envelopes&type=envelopes`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockEnvelopes)
        })
      );
      expect(result.success).toBe(true);
    });
  });
});
