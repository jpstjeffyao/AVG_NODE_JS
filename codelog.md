# 腳本編輯器功能擴充與系統變更日誌 (2026-02-01)

本次更新重點在於影片播放功能的引入、腳本編輯器對新指令的支援，以及重要錯誤的修復，確保遊戲互動的正確性。

## 🎬 影片播放功能 (`MV` 指令)

### 新增功能
*   **新腳本指令 `MV|影片檔案路徑|音量(可選)`**: 支援在遊戲中全螢幕播放指定的 MP4 影片。
    *   **影片路徑**: 需提供相對於 `assets` 資料夾的路徑，例如 `mov/main.mp4`。
    *   **音量控制**: 可選參數，範圍 0.0 到 1.0。若未指定，預設為 1.0 (100%)。
*   **影片中斷機制**: 使用者可透過點擊滑鼠或按下任意鍵，立即中斷影片播放，並繼續執行後續腳本指令。

### 模組變更
*   **[`src/modules/ScriptEngine.ts`](src/modules/ScriptEngine.ts)**:
    *   擴充腳本解析邏輯，新增對 `MV` 指令的識別，提取影片路徑與音量參數。
    *   在影片播放期間，暫停腳本引擎的執行，直到影片結束或被中斷。
*   **[`src/modules/UIModule.ts`](src/modules/UIModule.ts)**:
    *   新增 `playVideo(videoPath: string, volume: number)` 方法，負責動態創建、顯示、播放影片元素，並處理音量設定。
    *   實作點擊/按鍵監聽器，用於中斷影片播放並進行清理。
    *   影片元素以 `fixed` 定位及高 `z-index` 確保全螢幕覆蓋。

## 📝 腳本編輯器與文件更新

### 功能擴充
*   **[`src/scripteditor.js`](src/scripteditor.js)**:
    *   更新 `mainCommandRegex` 以識別 `MV` 指令，提供語法高亮。
    *   將 `MV|` 加入 `mainCommands` 列表，使其在編輯器中提供自動完成提示。
*   **[`scriptFormat.md`](scriptFormat.md)**:
    *   更新腳本格式說明，詳細介紹 `MV` 指令的用法、參數（包括可選音量）及影片路徑規範。

## 🐛 錯誤修復與系統穩定性提升

### 1. 選單點擊意外啟動遊戲問題 (Bug Fix)
*   **問題描述**: 遊戲在標題畫面 (`STATE_TITLE`) 時，點擊功能選單按鈕以外的任何位置（或按下空白鍵），會導致遊戲意外啟動。
*   **修復內容**: **[`src/core/GameKernel.ts`](src/core/GameKernel.ts)** 中的 `onUserClick()` 方法新增邏輯，當前遊戲狀態為 `GameState.STATE_TITLE` 時，會直接忽略此類互動事件，防止遊戲被意外觸發。

### 3. 返回選單時未清除立繪問題 (Bug Fix & 重大重構)
*   **問題描述**: 遊戲劇情結束並返回主選單 (`STATE_TITLE`) 時，螢幕上的角色立繪並未自動清除，導致視覺殘留。
*   **修復與重構內容**:
    *   **釐清職責**: 重新劃分 `AssetManager` 與 `CharacterModule` 在立繪管理上的職責。現在，`AssetManager` 專注於資產（圖片、音訊）的載入與快取，不再負責 DOM 元素的插入、定位或亮度控制。
    *   **`CharacterModule` 成為立繪 DOM 的擁有者**:
        *   將 `spriteLayer` (立繪層) 和 `spriteSlots` (立繪插槽) 的建立與管理邏輯從 `AssetManager` 遷移至 `CharacterModule` 的 `initialize()` 方法。
        *   `CharacterModule.show()` 方法現在直接負責從 `AssetManager` 取得已載入的 `HTMLImageElement`，然後創建 `<img>` 元素、進行樣式設定、並將其插入到正確的立繪插槽中。
        *   `CharacterModule.show()` 同時會將這些活躍的 `HTMLImageElement` 實例儲存到其 `activeCharacters` Map 中。
        *   `CharacterModule.hide()` 和 `CharacterModule.clear()` 方法現在可以有效利用 `activeCharacters` Map 來移除 DOM 中的立繪元素。
        *   將 `setSpriteHighlight()` 方法從 `AssetManager` 遷移至 `CharacterModule`，使立繪亮度的控制權回歸給立繪的管理者。
    *   **`AssetManager` 簡化**: 移除 `AssetManager` 中所有與 `spriteLayer`、`spriteSlots` 以及 `setSprite`、`clearSprite`、`setSpriteHighlight` 和 `handleSpriteCommand` 相關的屬性和方法，使其職責更加單一。
    *   **`ScriptEngine` 適應性更新**: 修改 `SPRITE` 指令（已廢棄，相關邏輯移除）和 `SPRITE_CLR` 指令（現在呼叫 `CharacterModule.hide()`）的處理邏輯，並更新 `SAY` 指令中的立繪亮度設定，以適應 `CharacterModule` 的新 API。
*   **測試修正**:
    *   `tests/ScriptEngine.test.ts` 中移除已廢棄的 `SPRITE` 指令測試。
    *   `tests/ScriptEngine.test.ts` 和 `tests/GameKernel.test.ts` 的 `beforeEach` 鉤子中，增加了更為健壯的 DOM 模擬，確保在 `GameKernel` 和各模組初始化時，`UIModule` 和 `CharacterModule` 能正確找到其依賴的 DOM 元素，從而解決了測試中持續出現的 `[UIModule] clear: _container is null` 警告。

### 2. 測試環境健壯性增強
*   **Jest 環境配置**: 將 `jest.config.js` 的 `testEnvironment` 設定為 `jsdom`，並安裝 `jest-environment-jsdom`，為前端相關測試提供模擬的瀏覽器 DOM 環境。
*   **`GameKernel` 測試修正**: 調整 `tests/GameKernel.test.ts`，確保 `GameKernel` 實例化方式與實際應用一致，移除錯誤的單例模式測試假設。
*   **`ScriptEngine` 測試修正**:
    *   修復 `IF` 指令測試中 `SAY` 語法錯誤。
    *   完善 `BGM_PLAY` 測試的音訊模擬，確保 `HTMLAudioElement` 的 `play()` 方法正確返回 Promise，解決 `TypeError: Cannot read properties of undefined (reading 'catch')` 錯誤。
    *   為 `UIModule` 測試添加基本的 DOM 結構設置與清理，解決測試中的 `_container is null` 警告。
    *   更新 `MV` 指令測試，使其正確預期 `playVideo` 方法接收影片路徑及預設音量參數。
*   **TypeScript 類型一致性**: 統一測試檔案中 `GameState` 相關的狀態設定，避免使用字串字面量，改用 `GameState` 列舉成員，增強類型安全性。

---

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
