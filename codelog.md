# 腳本編輯器功能擴充與系統變更日誌 (2026-02-02)

## 🐛 錯誤修復 (GameKernel & ScriptEngine)

### 遊戲重新開始功能修復 (Bug Fix)
*   **問題描述**: 遊戲結束回到標題畫面後，點擊「開始遊戲」無法重新開始遊戲，因為腳本引擎的執行進度未被重置。
*   **修復內容**:
    *   **[`src/modules/ScriptEngine.ts`](src/modules/ScriptEngine.ts)**: 更新 `initialize()` 方法，除了重置 `currentLineIndex` 外，現在也會清除 `positionMap`，確保角色位置狀態被正確重置。
    *   **[`src/core/GameKernel.ts`](src/core/GameKernel.ts)**: 在 `startGame()` 方法中新增呼叫 `this.scriptEngine.initialize()`，確保每次開始遊戲時，腳本引擎都處於初始狀態。

### 腳本語法修正 (Script Syntax Fix)
*   **問題描述**: `src/index.ts` 中的範例腳本使用了錯誤的 `BGM_FADE_OUT|5` 語法，導致執行時出現 "Unknown command" 錯誤。
*   **修復內容**:
    *   **[`src/index.ts`](src/index.ts)**: 將 `BGM_FADE_OUT|5` 修正為符合規範的 `[BGM_FADE_OUT: 5]`。

## 🐛 錯誤修復 (UIModule)

### 選單顯示與對話框清除問題 (Bug Fix)
*   **問題描述**: 當腳本執行到 `CHOICE` 指令進入選單時，對話視窗雖然隱藏，但選項按鈕也被一併隱藏，導致選單無法顯示，且玩家期望「選單出現時清除舊對話內容」的需求未被正確滿足。
*   **修復內容**:
    *   **[`src/modules/UIModule.ts`](src/modules/UIModule.ts)**: 修改 `showChoices` 方法，將動態建立的選項容器 (`choiceContainer`) 改為直接附加到 `game-root` (或 `document.body`)，而非原本的 `_container` (即 `#avg-ui` 對話框)。
    *   **效果**: 這確保了即使呼叫 `hideDialog()` 隱藏了對話框（滿足清除舊對話內容的需求），選項按鈕仍能獨立顯示於畫面中央，且層級正確 (`z-index: 1000`)。

# 腳本編輯器功能擴充與系統變更日誌 (2026-02-01)
... (Previous logs)
