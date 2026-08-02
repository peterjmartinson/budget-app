import jsyaml from 'js-yaml';

export const DEFAULT_CONFIG = {
  board: {
    title: "Monthly Budget Board",
    sheet_name: "Active Budget"
  },
  columns: [
    { id: "backlog", title: "Backlog", cash_in_play: 0 },
    { id: "rollover", title: "Rollover", cash_in_play: 500 },
    { id: "in_budget", title: "In Month's Budget", cash_in_play: 4500 },
    { id: "unfunded", title: "Unfunded", cash_in_play: 0 }
  ]
};

export function getYamlParser() {
  if (typeof jsyaml !== 'undefined' && jsyaml) {
    if (typeof jsyaml.load === 'function') return jsyaml;
    if (jsyaml.default && typeof jsyaml.default.load === 'function') return jsyaml.default;
  }
  if (typeof window !== 'undefined' && window.jsyaml && typeof window.jsyaml.load === 'function') {
    return window.jsyaml;
  }
  return null;
}

export function parseConfigYaml(yamlString) {
  const parser = getYamlParser();
  if (!parser) {
    throw new Error('YAML parser not available');
  }
  const parsed = parser.load(yamlString);
  if (!parsed || !parsed.board || !Array.isArray(parsed.columns)) {
    throw new Error('Invalid config.yaml schema');
  }
  return parsed;
}

export async function loadConfig(configPath = 'config.yaml', fetchFn = null) {
  const performFetch = fetchFn || (typeof fetch !== 'undefined' ? fetch.bind(window) : null);
  
  if (!performFetch) {
    console.warn('Fetch API not available, using default config fallback.');
    return DEFAULT_CONFIG;
  }

  try {
    const response = await performFetch(configPath);
    if (!response || !response.ok) {
      throw new Error(`Failed to fetch config file: status ${response?.status}`);
    }
    const text = await response.text();
    return parseConfigYaml(text);
  } catch (error) {
    console.warn('Error loading or parsing config.yaml. Falling back to default configuration:', error.message);
    return DEFAULT_CONFIG;
  }
}
