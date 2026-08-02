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
    const scriptFunction = new Function('SpreadsheetApp', 'ContentService', `${codeContent}; return { doGet, doPost, getTargetSheet, SHEET_NAME };`);
    const exportsObj = scriptFunction(globalThis.SpreadsheetApp, globalThis.ContentService);
    globalThis.doGet = exportsObj.doGet;
    globalThis.doPost = exportsObj.doPost;
  });

  it('doGet selects sheet by name "Active Budget"', () => {
    mockSpreadsheet.getSheetByName.mockReturnValue(mockSheet);

    const response = doGet({});
    expect(mockSpreadsheet.getSheetByName).toHaveBeenCalledWith('Active Budget');
    expect(mockSheet.getDataRange).toHaveBeenCalled();
  });

  it('doPost selects sheet by name "Active Budget"', () => {
    mockSpreadsheet.getSheetByName.mockReturnValue(mockSheet);

    const response = doPost({
      postData: { contents: JSON.stringify([{ columnId: 'backlog', title: 'Test', amount: 10 }]) }
    });
    expect(mockSpreadsheet.getSheetByName).toHaveBeenCalledWith('Active Budget');
    expect(mockSheet.clearContents).toHaveBeenCalled();
    expect(mockSheet.appendRow).toHaveBeenCalled();
  });

  it('creates "Active Budget" sheet if tab does not exist', () => {
    mockSpreadsheet.getSheetByName.mockReturnValue(null);

    const response = doGet({});
    expect(mockSpreadsheet.getSheetByName).toHaveBeenCalledWith('Active Budget');
    expect(mockSpreadsheet.insertSheet).toHaveBeenCalledWith('Active Budget');
  });
});
