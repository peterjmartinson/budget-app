/**
 * Client module for communicating with Google Apps Script Web App for board sync.
 */

/**
 * Fetches card data from Google Apps Script Web App.
 * @param {string} webAppUrl 
 * @param {Function} [fetchFn] Optional custom fetch implementation for testing
 * @returns {Promise<{success: boolean, cards: Array, error?: string}>}
 */
export async function fetchFromSheets(webAppUrl, fetchFn) {
  const customFetch = fetchFn || (typeof fetch !== 'undefined' ? fetch : null);

  if (!webAppUrl || typeof webAppUrl !== 'string' || !webAppUrl.trim()) {
    return { success: false, error: 'Google Apps Script Web App URL not configured', cards: [] };
  }

  if (!customFetch) {
    return { success: false, error: 'Fetch API not available', cards: [] };
  }

  try {
    const response = await customFetch(webAppUrl);
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}`, cards: [] };
    }

    const data = await response.json();
    let cards = [];
    if (Array.isArray(data)) {
      cards = data;
    } else if (data && Array.isArray(data.cards)) {
      cards = data.cards;
    } else if (data && Array.isArray(data.data)) {
      cards = data.data;
    }

    return { success: true, cards };
  } catch (err) {
    return { success: false, error: err.message || 'Network error', cards: [] };
  }
}

/**
 * Sends card data to Google Apps Script Web App via HTTP POST.
 * @param {string} webAppUrl 
 * @param {Array} cards 
 * @param {Function} [fetchFn] Optional custom fetch implementation for testing
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function syncToSheets(webAppUrl, cards, fetchFn) {
  const customFetch = fetchFn || (typeof fetch !== 'undefined' ? fetch : null);

  if (!webAppUrl || typeof webAppUrl !== 'string' || !webAppUrl.trim()) {
    return { success: false, error: 'Google Apps Script Web App URL not configured' };
  }

  if (!customFetch) {
    return { success: false, error: 'Fetch API not available' };
  }

  try {
    const response = await customFetch(webAppUrl, {
      method: 'POST',
      body: JSON.stringify(cards || []),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      }
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message || 'Network error' };
  }
}
