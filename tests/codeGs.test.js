import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Google Apps Script Backend (Code.gs)', () => {
  let mockSpreadsheet;
  let mockSheet;
  let mockContentService;
  let context;

  beforeEach(() => {
    mockSheet = {
      getDataRange: vi.fn().mockReturnValue({
        getValues: vi.fn().mockReturnValue([
          ['Column', 'Title', 'Description', 'Amount'],
          ['backlog', 'Groceries', 'Food', 150]
        ])
      }),
      clearContents: vi.fn(),
      appendRow: vi.fn()
    };

    mockSpreadsheet = {
      getSheetByName: vi.fn(),
      insertSheet: vi.fn().mockReturnValue(mockSheet)
    };

    mockContentService = {
      MimeType: { JSON: 'JSON' },
      createTextOutput: vi.fn().mockImplementation((str) => ({
        setMimeType: vi.fn().mockReturnThis(),
        getContent: () => str
      }))
    };

    globalThis.SpreadsheetApp = {
      getActiveSpreadsheet: () => mockSpreadsheet
    };
    globalThis.ContentService = mockContentService;

    // Read and evaluate Code.gs in global scope
    const codeGsPath = path.resolve(__dirname, '../Code.gs');
    const codeContent = fs.readFileSync(codeGsPath, 'utf8');
    const scriptFunction = new Function('SpreadsheetApp', 'ContentService', `${codeContent}; return { doGet, doPost, getTargetSheet, DEFAULT_SHEET_NAME };`);
    const exportsObj = scriptFunction(globalThis.SpreadsheetApp, globalThis.ContentService);
    globalThis.doGet = exportsObj.doGet;
    globalThis.doPost = exportsObj.doPost;
  });

  it('doGet selects custom sheet when passed in e.parameter.sheet', () => {
    mockSpreadsheet.getSheetByName.mockReturnValue(mockSheet);

    const response = doGet({ parameter: { sheet: 'Custom Sheet' } });
    expect(mockSpreadsheet.getSheetByName).toHaveBeenCalledWith('Custom Sheet');
    expect(mockSheet.getDataRange).toHaveBeenCalled();
  });

  it('doPost selects custom sheet when passed in e.parameter.sheet', () => {
    mockSpreadsheet.getSheetByName.mockReturnValue(mockSheet);

    const response = doPost({
      parameter: { sheet: 'Custom Sheet' },
      postData: { contents: JSON.stringify([{ columnId: 'backlog', title: 'Test', amount: 10 }]) }
    });
    expect(mockSpreadsheet.getSheetByName).toHaveBeenCalledWith('Custom Sheet');
    expect(mockSheet.clearContents).toHaveBeenCalled();
  });

  it('creates custom sheet if tab does not exist', () => {
    mockSpreadsheet.getSheetByName.mockReturnValue(null);

    const response = doGet({ parameter: { sheet: 'New Tab' } });
    expect(mockSpreadsheet.getSheetByName).toHaveBeenCalledWith('New Tab');
    expect(mockSpreadsheet.insertSheet).toHaveBeenCalledWith('New Tab');
  });

  it('doGet and doPost handle Transactions sheet tab correctly', () => {
    const txSheet = {
      getDataRange: vi.fn().mockReturnValue({
        getValues: vi.fn().mockReturnValue([
          ['ID', 'CardID', 'Date', 'Description', 'Amount'],
          ['t1', 'c1', '2026-08-01', 'Groceries Store', 45]
        ])
      }),
      clearContents: vi.fn(),
      appendRow: vi.fn()
    };
    mockSpreadsheet.getSheetByName.mockReturnValue(txSheet);

    const getRes = doGet({ parameter: { sheet: 'Transactions', type: 'transactions' } });
    const getOutput = JSON.parse(getRes.getContent());
    expect(getOutput).toEqual([
      { id: 't1', cardId: 'c1', date: '2026-08-01', description: 'Groceries Store', amount: 45 }
    ]);

    const postRes = doPost({
      parameter: { sheet: 'Transactions', type: 'transactions' },
      postData: { contents: JSON.stringify([{ id: 't1', cardId: 'c1', date: '2026-08-01', description: 'Groceries Store', amount: 45 }]) }
    });
    expect(txSheet.clearContents).toHaveBeenCalled();
    expect(txSheet.appendRow).toHaveBeenCalledWith(['ID', 'CardID', 'Date', 'Description', 'Amount']);
    expect(txSheet.appendRow).toHaveBeenCalledWith(['t1', 'c1', '2026-08-01', 'Groceries Store', 45]);
  });

  it('doGet reads card id and createdAt if present in headers', () => {
    const cardSheet = {
      getDataRange: vi.fn().mockReturnValue({
        getValues: vi.fn().mockReturnValue([
          ['ID', 'Column', 'Title', 'Description', 'Amount', 'CreatedAt'],
          ['card-99', 'in_budget', 'Gas', 'Fuel', 60, '2026-08-05T10:00:00.000Z']
        ])
      }),
      clearContents: vi.fn(),
      appendRow: vi.fn()
    };
    mockSpreadsheet.getSheetByName.mockReturnValue(cardSheet);

    const getRes = doGet({});
    const getOutput = JSON.parse(getRes.getContent());
    expect(getOutput).toEqual([
      { id: 'card-99', columnId: 'in_budget', title: 'Gas', description: 'Fuel', amount: 60, createdAt: '2026-08-05T10:00:00.000Z' }
    ]);
  });
});

