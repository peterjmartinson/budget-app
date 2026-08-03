# Monthly Budget Board

In-house dynamic single-page budget management board with live math calculations, drag-and-drop workflow, streamlined card editing, Google Sheets synchronization, and CSV import/export capability.

## Features & Documentation

- **Streamlined Card UI:** Click any card to edit details in the modal, drag via the drag handle, and delete cards within the edit dialog.
- **[Google Sheets Setup Guide](docs/GOOGLE_SHEETS_SETUP.md):** Step-by-step instructions for configuring cross-device synchronization with Google Sheets Apps Script.
- **[Apps Script Backend Code](Code.gs):** Standalone Apps Script snippet for Google Sheets integration.
- **Local Fallback & Portability:** Native CSV import/export and offline `localStorage` state store.

## Running & Testing

```bash
# Run tests
npm test
```
