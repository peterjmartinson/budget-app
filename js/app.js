import { loadConfig } from './configLoader.js';
import { renderBoard } from './boardRenderer.js';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('app');
  if (!container) return;

  try {
    const config = await loadConfig('config.yaml');
    renderBoard(config, container);
  } catch (error) {
    console.error('Critical initialization error:', error);
  }
});
