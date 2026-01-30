# UI 系統設計文件

## 空白鍵推進功能 (Space Key Progression)

### 1. 互動規則與適用情境
空白鍵 (Space) 被視為與全螢幕點擊 (Click) 等效的互動方式，主要用於推進遊戲進程。

*   **打字中 (Typing)**：若目前正在執行打字機文字渲染效果，按下空白鍵會觸發 `completeTyping()`，立即顯示該段落的所有文字，並停止打字機動畫。
*   **打字結束 (Typing Finished)**：文字已全部顯示後，按下空白鍵會觸發 `onUserClick()`，通知 `GameKernel` 推進至下一個劇本指令（例如下一段對話或切換場景）。
*   **選項顯示 (Choice Mode)**：當畫面出現分支選項按鈕時，空白鍵推進功能仍會嘗試觸發 `onUserClick()`，但由於選項按鈕本身會攔截特定點擊，建議玩家直接點擊按鈕進行選擇。
*   **聚焦輸入欄位 (Input Focus)**：為了避免干擾正常的輸入行為，當焦點位於 `INPUT`、`TEXTAREA`、`isContentEditable` 元素或具有 `.script-editor` 類別的元素時，空白鍵將回歸其預設輸入行為（輸入空白字元），不會觸發遊戲推進。

### 2. 生命週期說明
空白鍵的監聽器生命週期與 `UIModule` 的生命週期同步：

*   **註冊 (Registration)**：於 `UIModule.initialize()` 被呼叫時，透過 `document.addEventListener("keydown", this.handleDocumentSpaceKey)` 進行全域註冊。
*   **釋放 (Release)**：當模組不再使用或銷毀時，於 `UIModule.dispose()` 透過 `document.removeEventListener("keydown", this.handleDocumentSpaceKey)` 移除監聽器，避免記憶體洩漏或在非預期情境下觸發。

### 3. 主要程式碼位置與方法
相關實作皆位於 [`src/modules/UIModule.ts`](src/modules/UIModule.ts)：

*   **`UIModule.initialize()`**：負責在模組啟動時綁定 `keydown` 事件。
*   **`UIModule.dispose()`**：負責在模組結束時卸載監聽器。
*   **`UIModule.handleDocumentSpaceKey(event)`**：
    *   檢查 `event.code === 'Space'`。
    *   檢查當前 `event.target` 是否為輸入欄位。
    *   執行 `event.preventDefault()` 以防止網頁捲動。
    *   呼叫 `GameKernel.onUserClick()` 執行實際的推進邏輯。

### 4. 注意事項
*   **僅於主視窗啟用**：程式碼中會檢查 `window.location.pathname`，若路徑包含 `script_editor.html` 則不啟用，以避免在劇本編輯器編輯文字時干擾輸入。
*   **防止捲動**：在觸發遊戲推進時，必須呼叫 `event.preventDefault()`，以防止瀏覽器因空白鍵而產生頁面捲動的預設行為。
*   **與 Click 事件一致性**：空白鍵的行為必須嚴格與 `handleDocumentClick` 保持邏輯同步，確保玩家使用鍵盤或滑鼠的操作體驗一致。
