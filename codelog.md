# 腳本編輯器功能擴充與系統變更日誌 (2026-01-30)

本次更新包含音訊載入流程優化、BGM 播放異常修復、以及角色亮度顯示邏輯的調整。

## 🎵 音訊系統與 BGM 載入優化

### 修正原因
原先 BGM 播放流程未整合至資產預載機制，導致在資源未完全載入時呼叫 `play()` 可能觸發 `NotSupportedError`。此外，缺乏明確的載入失敗提示，不利於除錯。

### 修正內容
*   **[`src/modules/AssetManager.ts`](src/modules/AssetManager.ts)**:
    *   新增 `getAsset(key)` 方法，允許其他模組安全地從快取取得已載入的資產。
*   **[`src/modules/AudioManager.ts`](src/modules/AudioManager.ts)**:
    *   重構 `playBGM` 方法，支援直接接收 `HTMLAudioElement` 作為參數，實現「先載入、後播放」。
    *   在 `play().catch()` 中加入針對 `NotSupportedError` 與 `NotAllowedError` 的詳細偵錯提示。
*   **[`src/modules/ScriptEngine.ts`](src/modules/ScriptEngine.ts)**:
    *   調整 `BGM_PLAY` 與 `BGM` 指令處理邏輯，改為先透過 `AssetManager.ensureLoaded` 確保資源就緒，再由 `AudioManager` 執行播放。

## 🎭 角色亮度 UI 邏輯修正

### 修正原因
在對話指令為「旁白」（說話者名稱為空）時，系統原先會將所有立繪變暗，導致畫面視覺重心不正確。

### 修正內容
*   **[`src/modules/UIModule.ts`](src/modules/UIModule.ts)**:
    *   優化 `updateSpriteHighlights` 方法：新增判斷邏輯，若 `speakerName` 為空或僅含空白，則強制將所有插槽的角色亮度設為 `1.0`（正常亮度）。
    *   保留「有明確說話者時，非說話者自動變暗」的視覺引導功能。

---

## 🎭 立繪亮度與角色名稱識別優化 (2026-01-30)

### 修正動機
在 AVG 遊戲中，當特定角色發言時，其他未發言的角色立繪應自動變暗以引導視覺重心。原先系統在「旁白（無說話者名稱）」時會錯誤地將所有立繪變暗，且腳本顯示名稱（如「伊莉莎白」）與內部識別名稱（如 「elizabeth」）不一致時，高亮判定會失效。

### 技術方案
*   **[`src/modules/ScriptEngine.ts`](src/modules/ScriptEngine.ts)**:
    *   **`characterNameMap` 設計**: 建立顯示名稱與內部 ID 的對應表，例如 `{'伊莉莎白': 'elizabeth'}`。
    *   **`normalizeCharacterKey` 邏輯**: 將輸入名稱進行修剪、轉小寫，並優先透過對應表轉換為標準化 ID，確保比對的一致性。
*   **[`src/modules/UIModule.ts`](src/modules/UIModule.ts)**:
    *   **`updateSpriteHighlights` 優化**:
        *   **旁白判斷**: 若說話者名稱為空或空白，強制將所有立繪亮度設為 `1.0`。
        *   **比對邏輯優化**: 使用 `ScriptEngine.normalizeCharacterKey` 同時處理「目前說話者」與「插槽內存角色」的 ID，再進行相等比對。

### 影響範圍
*   `SAY` 指令執行的視覺表現。
*   `SPRITE` 與 `CHARA` 指令中角色名稱的綁定。

---

# 腳本編輯器功能擴充與系統變更日誌 (2026-01-30)

本次更新包含音訊播放系統的防禦性修正、劇本編輯器多腳本管理系統的擴充，以及遊戲主畫面 UI 的精簡調整。

## 🧹 UI 精簡任務 (UI Simplification)

### 調整原因
遊戲主畫面上方的音量調節與靜音按鈕目前為無作用控制項，為了提升使用者體驗並維持介面簡潔，決定將其移除。

### 調整內容
*   **[`index.html`](index.html)**: 移除 `audio-controls` 容器及其內部的 `mute-btn` 與 `volume-slider` HTML 元件。
*   **[`src/modules/UIModule.ts`](src/modules/UIModule.ts)**:
    *   移除 `muteBtn` 與 `volumeSlider` 成員變數。
    *   移除 `initialize` 方法中針對音訊控制項的 DOM 取得與事件綁定邏輯。

## 🛠️ 音訊系統緊急修正 (AudioManager)

### 修正原因
在啟動新遊戲或切換場景時，若劇本指令傳入無效的音量參數（如 `undefined` 或 `NaN`），會導致 `HTMLAudioElement.volume` 拋出錯誤並中斷執行。

### 修正內容
*   **[`src/modules/AudioManager.ts`](src/modules/AudioManager.ts)**:
    *   在 `playBGM` 方法中新增 `Number.isFinite` 檢查，確保 `volume` 為有效數值。
    *   新增 `Math.max(0, Math.min(1, volume))` 限制，確保音量始終在合法範圍內。
    *   強化 `loop` 參數的類型檢查，預設值設為 `true`。
    *   增加詳細的技術註解與錯誤捕捉。

### 影響範圍
*   所有調用 `AudioManager.playBGM` 的指令（如 `BGM_PLAY`）。
*   提升系統對於劇本指令參數缺失或錯誤的容錯能力。

---

## ✨ 新功能與改進

## ✨ 新功能與改進

### 1. 多腳本管理系統 (Multi-Script Management)
*   **多腳本並存**: 支援同時儲存與切換多個不同的劇本檔案。
*   **主腳本 (Main Script) 機制**:
    *   可將特定腳本標記為「主腳本」，作為遊戲啟動時的預設載入對象。
    *   系統確保同一時間僅有一個主腳本。
*   **腳本 CRUD 操作**:
    *   **Create**: 支援建立新腳本。
    *   **Read**: 自動載入清單並讀取選定腳本內容。
    *   **Update**: 即時自動儲存 (Auto-save) 編輯中的內容，並支援重新命名。
    *   **Delete**: 刪除腳本時會同步清理對應的 LocalStorage 內容，並具備自動遞補主腳本的保護機制。

### 2. 外部檔案上傳 (Text File Upload)
*   **純文字導入**: 支援上傳 `.txt` 或 `.md` 格式的劇本檔案。
*   **彈性導入模式**:
    *   **覆蓋模式**: 將檔案內容直接覆蓋目前的主腳本。
    *   **新增模式**: 將檔案作為新腳本匯入，若名稱重複則自動增加序號。

### 3. 即時預覽與語法分析
*   **狀態資訊列**: 即時顯示當前編輯的腳本名稱與總行數。
*   **動態語法分析**: 針對最後一行輸入進行簡易解析，提示目前的指令類型（如：對話、背景、立繪）。

---

## 🔧 技術實作細節

### 📂 主要影響檔案: `src/scripteditor.js`

*   **`ScriptManager` 模組實作**:
    *   採用立即執行函式 (IIFE) 模式封裝私有狀態，確保資料安全性。
    *   **LocalStorage 結構優化**:
        *   `scripteditor_scripts`: 儲存 JSON 格式的索引清單 `[{name, isMain}]`。
        *   `scripteditor_script_[Name]`: 以名稱為後綴獨立儲存各個腳本的純文字內容，避免單一 Key 肥大化。
    *   **通訊與同步**:
        *   實作 `onScriptListChanged` 回呼機制，解耦資料層與 UI 層。
        *   整合 `postMessage` 跨視窗通訊，將目前編輯或主腳本內容同步至遊戲主視窗。

*   **程式碼補強與註解**:
    *   對所有核心函式（如 `switchScript`, `handleFileUpload`）增加 JSDoc 格式註解。
    *   強化錯誤處理（如 JSON 解析失敗、非法檔案格式、刪除最後一個腳本的保護）。

---

## 📜 歷史更新記錄 (音訊系統)

本次更新為互動故事腳本編輯器增加了完整的背景音樂 (BGM) 與音效 (SFX) 控制能力。

### 🎵 音訊指令與控制
*   **腳本指令**: 支援 `BGM_PLAY`, `BGM_STOP`, `BGM_FADE_OUT`, `BGM_FADE_IN`, `SFX_PLAY`。
*   **全域 UI**: 新增靜音按鈕與主音量控制滑桿。

### 💻 模組變更
*   **`src/modules/AudioManager.ts`**: 建立 HTML5 Audio 管理中心，支援音訊池與淡入淡出。
*   **`src/core/GameKernel.ts`**: 整合音訊管理模組至核心。
*   **`src/modules/ScriptEngine.ts`**: 擴充正則解析器以支援音訊指令。
*   **`src/modules/UIModule.ts`**: 綁定音量控制與靜音事件。

## ✅ 測試與配置

*   更新了 Jest 測試案例 (`tests/*.test.ts`) 以模擬瀏覽器 `Audio` 環境，確保核心邏輯穩定。
*   調整了 `tsconfig.json` 和 `jest.config.js` 以支援路徑別名，優化了專案結構。
