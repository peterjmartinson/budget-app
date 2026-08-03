### **Description**
Simplify the card interaction model on the budget board. Currently, each card displays its description, along with separate **Edit** and **Delete** buttons on the front of the card. Clicking **Edit** opens a modal dialog. 

We want to clean up the card UI and streamline the interaction flow:
1. **Remove Card Actions**: Remove the **Edit** and **Delete** buttons from the card item front.
2. **Remove Card Description from Card Front**: Do not render the card description on the board front; it should only be viewable and editable inside the dialog modal.
3. **Whole-Card Click to Edit**: Make clicking anywhere on the card body (excluding the drag handle) trigger the edit action, immediately opening the edit dialog.
4. **Move Delete Action to Dialog**: Move the **Delete** button into the card modal actions footer. The button should only be shown when editing an existing card (hidden when creating a new card).

---

### **Technical Implementation Details**

#### **1. UI & Styling Updates**
- **[js/boardRenderer.js](file:///c:/Users/Admin/Documents/budget-app/js/boardRenderer.js)**
  - In `renderCardItem(card)`: Remove the `.card-actions` container (and the buttons inside) and the `<p class="card-description">` element.
  - In `renderBoard(state, ...)`: Update the `#card-modal` modal markup to include a Delete button (`<button type="button" id="modal-delete-btn" class="btn btn-danger hidden">Delete Card</button>`) inside the `.modal-actions` actions div.
- **[styles.css](file:///c:/Users/Admin/Documents/budget-app/styles.css)**
  - Update `.card-item` rules to set `cursor: pointer` (previously `cursor: grab`).
  - Add styling rules for `.card-drag-handle` to have `cursor: grab`, preserving dragging affordance.
  - Add styling for the new `.btn-danger` and `.btn-danger:hover` classes using the crimson color styling pattern from the old `.btn-delete-card`.

#### **2. Event Handling & Logic**
- **[js/app.js](file:///c:/Users/Admin/Documents/budget-app/js/app.js)**
  - In `setupEventListeners(container)`:
    - Replace the click handler for `.btn-edit-card` with a click handler on `.card-item`. Ensure it ignores clicks originating from the `.card-drag-handle`.
    - Replace the click handler for `.btn-delete-card` with a click handler on `#modal-delete-btn`. Ensure it calls `closeModal()` when a deletion is confirmed.
  - In `openModal(cardData)`:
    - If `cardData.id` is present (Edit Mode): show the `#modal-delete-btn` and assign `data-card-id` to it.
    - If `cardData.id` is not present (Add Mode): hide the `#modal-delete-btn` and remove its `data-card-id`.

---

### **Verification & Testing**
- **[tests/cardDom.test.js](file:///c:/Users/Admin/Documents/budget-app/tests/cardDom.test.js)**
  - Update the card rendering unit tests to assert that:
    - `.btn-edit-card`, `.btn-delete-card`, and `.card-description` are *not* rendered on the board card items.
    - `#modal-delete-btn` exists within the rendered modal structure.
  - Run the test suite using:
    ```bash
    npm test
    ```