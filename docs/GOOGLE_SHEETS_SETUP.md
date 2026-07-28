# Google Sheets Synchronization Setup Guide

This guide walks you through setting up cross-device synchronization between your Monthly Budget Board and a Google Sheet using Google Apps Script.

---

## Step 1: Create a Google Sheet
1. Open [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. (Optional) Title your spreadsheet e.g., `Monthly Budget Board Data`.

---

## Step 2: Open Apps Script Editor
1. In the Google Sheets top menu, click **Extensions** &rarr; **Apps Script**.
2. Clear any default code in `Code.gs`.

---

## Step 3: Add Backend Script
Copy and paste the entire script from [Code.gs](file:///home/peter/Code/budget-app/Code.gs) into the Apps Script editor:

```javascript
function doGet(e) { ... }
function doPost(e) { ... }
```

Click the **Save** icon (or press `Ctrl+S`).

---

## Step 4: Deploy as a Web App
1. In the top right corner of Apps Script, click **Deploy** &rarr; **New deployment**.
2. Click the gear icon (**Select type**) and choose **Web app**.
3. Fill out deployment configuration:
   - **Description:** `Budget App Sync Backend`
   - **Execute as:** `Me` (your Google account)
   - **Who has access:** `Anyone`
4. Click **Deploy**.
5. When prompted, click **Authorize access**, select your Google Account, click **Advanced**, and click **Go to Untitled project (unsafe)**. Click **Allow**.

---

## Step 5: Configure Budget App
1. Copy the **Web App URL** provided at the end of deployment (ends with `/exec`).
2. Open your Monthly Budget Board web application.
3. Click the **Settings** gear icon in the header.
4. Paste your Web App URL into the **Google Apps Script Web App URL** input field.
5. Click **Save Configuration**.

---

## How to Use Sync Controls

- **Sync to Sheet:** Pushes all cards currently in your local application state to your Google Sheet. When you make local edits, an `Unsaved Changes` badge will appear until you sync.
- **Fetch Sheet:** Pulls the latest cards from your Google Sheet into your app.
- **Export / Import CSV:** Use the CSV buttons for local offline backups and bulk card imports.
