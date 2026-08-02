import { describe, it, expect, vi } from 'vitest';
import { parseConfigYaml, loadConfig, DEFAULT_CONFIG } from '../js/configLoader.js';

describe('configLoader module', () => {
  it('parses valid YAML string into valid board state object', () => {
    const yamlStr = `
board:
  title: "Monthly Budget Board"
columns:
  - id: "backlog"
    title: "Backlog"
    cash_in_play: 0
  - id: "rollover"
    title: "Rollover"
    cash_in_play: 500
  - id: "in_budget"
    title: "In Month's Budget"
    cash_in_play: 4500
  - id: "unfunded"
    title: "Unfunded"
    cash_in_play: 0
`;
    const parsed = parseConfigYaml(yamlStr);
    expect(parsed).toBeDefined();
    expect(parsed.board.title).toBe("Monthly Budget Board");
    expect(DEFAULT_CONFIG.board.sheet_name).toBe("Active Budget");
    expect(parsed.columns).toHaveLength(4);
    expect(parsed.columns[0]).toEqual({ id: 'backlog', title: 'Backlog', cash_in_play: 0 });
    expect(parsed.columns[1]).toEqual({ id: 'rollover', title: 'Rollover', cash_in_play: 500 });
    expect(parsed.columns[2]).toEqual({ id: 'in_budget', title: "In Month's Budget", cash_in_play: 4500 });
    expect(parsed.columns[3]).toEqual({ id: 'unfunded', title: 'Unfunded', cash_in_play: 0 });
  });

  it('loadConfig fetches config.yaml and returns parsed state', async () => {
    const fakeYaml = `
board:
  title: "Test Board"
columns:
  - id: "c1"
    title: "Column 1"
    cash_in_play: 100
`;
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(fakeYaml)
    });

    const result = await loadConfig('config.yaml', mockFetch);
    expect(result.board.title).toBe("Test Board");
    expect(result.columns).toHaveLength(1);
    expect(result.columns[0].id).toBe("c1");
  });

  it('loadConfig falls back gracefully to DEFAULT_CONFIG on fetch failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const result = await loadConfig('config.yaml', mockFetch);

    expect(result).toEqual(DEFAULT_CONFIG);
    expect(result.columns).toHaveLength(4);
    expect(result.columns.map(c => c.id)).toEqual(['backlog', 'rollover', 'in_budget', 'unfunded']);
  });
});
