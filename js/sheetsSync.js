/**
 * Client module for communicating with Google Apps Script Web App for board sync.
 */

/**
 * Fetches card data from Google Apps Script Web App.
 * @param {string} webAppUrl 
 * @param {Function} [fetchFn] Optional custom fetch implementation for testing
 * @returns {Promise<{success: boolean, cards: Array, error?: string}>}
 */
export async function fetchFromSheets(webAppUrl, fetchFn, sheetName) {
  let customFetch = fetchFn;
  let targetSheetName = sheetName;

  if (typeof fetchFn === 'string') {
    targetSheetName = fetchFn;
    customFetch = null;
  }

  customFetch = customFetch || (typeof fetch !== 'undefined' ? fetch : null);

  if (!webAppUrl || typeof webAppUrl !== 'string' || !webAppUrl.trim()) {
    return { success: false, error: 'Google Apps Script Web App URL not configured', cards: [] };
  }

  if (!customFetch) {
    return { success: false, error: 'Fetch API not available', cards: [] };
  }

  try {
    let targetUrl = webAppUrl;
    if (targetSheetName && typeof targetSheetName === 'string' && targetSheetName.trim()) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl += `${separator}sheet=${encodeURIComponent(targetSheetName.trim())}`;
    }

    const response = await customFetch(targetUrl, {
      method: 'GET',
      redirect: 'follow'
    });
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
 * @param {Function|string} [fetchFn] Optional custom fetch implementation for testing (or sheetName string)
 * @param {string} [sheetName] Optional sheet name to target
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function syncToSheets(webAppUrl, cards, fetchFn, sheetName) {
  let customFetch = fetchFn;
  let targetSheetName = sheetName;

  if (typeof fetchFn === 'string') {
    targetSheetName = fetchFn;
    customFetch = null;
  }

  customFetch = customFetch || (typeof fetch !== 'undefined' ? fetch : null);

  if (!webAppUrl || typeof webAppUrl !== 'string' || !webAppUrl.trim()) {
    return { success: false, error: 'Google Apps Script Web App URL not configured' };
  }

  if (!customFetch) {
    return { success: false, error: 'Fetch API not available' };
  }

  try {
    let targetUrl = webAppUrl;
    if (targetSheetName && typeof targetSheetName === 'string' && targetSheetName.trim()) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl += `${separator}sheet=${encodeURIComponent(targetSheetName.trim())}`;
    }

    const response = await customFetch(targetUrl, {
      method: 'POST',
      body: JSON.stringify(cards || []),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      redirect: 'follow'
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

/**
 * Fetches envelope cash data from Google Apps Script Web App.
 * @param {string} webAppUrl 
 * @param {Function} [fetchFn] Optional custom fetch implementation for testing
 * @param {string} [envelopesSheetName] Sheet tab name for envelopes (e.g. 'Envelopes')
 * @returns {Promise<{success: boolean, envelopes: Array, error?: string}>}
 */
export async function fetchEnvelopesFromSheets(webAppUrl, fetchFn, envelopesSheetName = 'Envelopes') {
  let customFetch = fetchFn;
  let targetSheetName = envelopesSheetName;

  if (typeof fetchFn === 'string') {
    targetSheetName = fetchFn;
    customFetch = null;
  }

  customFetch = customFetch || (typeof fetch !== 'undefined' ? fetch : null);

  if (!webAppUrl || typeof webAppUrl !== 'string' || !webAppUrl.trim()) {
    return { success: false, error: 'Google Apps Script Web App URL not configured', envelopes: [] };
  }

  if (!customFetch) {
    return { success: false, error: 'Fetch API not available', envelopes: [] };
  }

  try {
    let targetUrl = webAppUrl;
    const separator = targetUrl.includes('?') ? '&' : '?';
    targetUrl += `${separator}sheet=${encodeURIComponent(targetSheetName.trim())}&type=envelopes`;

    const response = await customFetch(targetUrl, {
      method: 'GET',
      redirect: 'follow'
    });
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}`, envelopes: [] };
    }

    const data = await response.json();
    let envelopes = [];
    if (Array.isArray(data)) {
      envelopes = data;
    } else if (data && Array.isArray(data.envelopes)) {
      envelopes = data.envelopes;
    } else if (data && Array.isArray(data.data)) {
      envelopes = data.data;
    }

    return { success: true, envelopes };
  } catch (err) {
    return { success: false, error: err.message || 'Network error', envelopes: [] };
  }
}

/**
 * Sends envelope cash data to Google Apps Script Web App via HTTP POST.
 * @param {string} webAppUrl 
 * @param {Array} envelopes Array of { columnId, cash }
 * @param {Function|string} [fetchFn] Optional custom fetch implementation for testing (or envelopesSheetName string)
 * @param {string} [envelopesSheetName] Sheet tab name for envelopes (e.g. 'Envelopes')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function syncEnvelopesToSheets(webAppUrl, envelopes, fetchFn, envelopesSheetName = 'Envelopes') {
  let customFetch = fetchFn;
  let targetSheetName = envelopesSheetName;

  if (typeof fetchFn === 'string') {
    targetSheetName = fetchFn;
    customFetch = null;
  }

  customFetch = customFetch || (typeof fetch !== 'undefined' ? fetch : null);

  if (!webAppUrl || typeof webAppUrl !== 'string' || !webAppUrl.trim()) {
    return { success: false, error: 'Google Apps Script Web App URL not configured' };
  }

  if (!customFetch) {
    return { success: false, error: 'Fetch API not available' };
  }

  try {
    let targetUrl = webAppUrl;
    const separator = targetUrl.includes('?') ? '&' : '?';
    targetUrl += `${separator}sheet=${encodeURIComponent(targetSheetName.trim())}&type=envelopes`;

    const response = await customFetch(targetUrl, {
      method: 'POST',
      body: JSON.stringify(envelopes || []),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      redirect: 'follow'
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
