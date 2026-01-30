# Code Log

## 2026-01-29

### 已完成任務
1. **修改 UIModule.ts 以支援顯示選項按鈕**
   - 新增 `showChoices(choices: string[])` 方法。
   - 在畫面中央動態生成按鈕並添加點擊事件。
   - 點擊按鈕時觸發 `choiceMade` 自定義事件並移除按鈕。
2. **修改 ScriptEngine.ts 以處理劇本流程指令**
   - 實作 `LABEL`：標記劇本位置。
   - 實作 `GOTO`：跳轉到指定標籤。
   - 實作 `CHOICE`：顯示選項並根據選擇跳轉標籤。
   - 更新 `IF`：使其支援跳轉到 `LABEL` 而非硬編碼的行號。
   - 實作劇本預掃描功能，建立標籤索引。
3. **更新測試劇本**
   - 在 `src/index.ts` 中加入包含 `CHOICE`、`LABEL` 與 `GOTO` 的分支劇本進行測試。
4. **實作 AudioManager.ts 以支援音訊播放**
   - 實作背景音樂 (BGM) 與音效 (SE) 播放功能。
   - 處理瀏覽器「音訊解鎖」邏輯，監聽首次點擊。
5. **擴充 ScriptEngine 指令**
   - 新增 `BGM|url` 指令。
   - 新增 `SE|url` 指令。
6. **更新入口點註冊與測試**
   - 在 `src/index.ts` 註冊 `AudioManager`。
   - 在劇本中加入 BGM 與 SE 測試指令。
7. **實作 MENU 歡迎畫面**
   - 在 `index.html` 加入 MENU 畫面 HTML 與 CSS 樣式。
   - 修改 `UIModule.ts` 以管理 MENU 與對話框的顯示/隱藏，並綁定按鈕事件。
   - 修改 `GameKernel.ts` 新增 `startGame()` 方法。
   - 修改 `src/index.ts` 移除啟動時直接執行劇本的邏輯，改由 MENU 觸發。
8. **建立前端腳本編輯器 (即時編輯與執行)**
   - 在 `index.html` 加入 `#script-editor` 區塊與對應 CSS 樣式。
   - 在 `src/index.ts` 實作 `#run-button` 點擊事件，動態載入編輯器內容並重啟遊戲引擎。
   - 調整頁面配置以容納右側編輯面板。

### 2026-01-29 (Part 2)

### 已完成任務
1. **升級腳本編輯器介面 (script_editor.html)**
   - 將編輯器改為側邊欄佈局 (Left Sidebar)。
   - 實作收合/展開功能與平滑過渡動畫。
   - 新增右側主內容區與下方的即時語法預覽區塊。
2. **增強編輯器功能 (src/scripteditor.js)**
   - 實作 `localStorage` 儲存功能，點擊 "Run" 時自動保存劇本，並在頁面載入時回復。
   - 實作 `input` 事件監聽，提供即時的語法分析預覽（顯示行數及當前指令解析）。
   - 優化程式碼註解為繁體中文。
3. **新增「載入範例」功能**
  - 在編輯器介面新增 `load-example-btn` 按鈕。
  - 實作範例劇本常數載入邏輯，點擊後自動填入編輯器並更新預覽。

### 2026-01-29 (Part 3)

### 已完成任務
1. **修復背景圖片載入失敗問題 (AssetManager.ts)**
    - 修改 `typeSubDirs` 以符合 Vite 的 `publicDir` 配置。將 `/assets/bg/` 改為 `/bg/`，將 `/assets/char/` 改為 `/char/`。
    - 修正 `ensureLoaded` 中的預設路徑邏輯，移除 `assets/` 前綴。
    - 在 `ensureLoaded` 加入偵錯紀錄，方便確認最終生成的資源 URL。
    - 為相關程式碼添加繁體中文註解。
    
    ### 2026-01-29 (Part 4)
    
    ### 已完成任務
    1. **重構非同步資產載入流程 (Core Refactor)**
       - **AssetManager.ts**: 將 `setBG` 修改為 `async Promise<void>`，並使用 `await this.ensureLoaded` 確保背景資源載入完成。
       - **ScriptEngine.ts**:
         - 將 `executeLine` 與 `next` 修改為 `async Promise<void>`。
         - 在處理 `BG` 與 `SPRITE` 指令時使用 `await` 等待資源載入模組完成工作，解決指令執行順序錯亂問題。
         - 優化錯誤處理與等待狀態標記 (`isWaitingForAsset`)。
       - **GameKernel.ts**:
         - 更新 `onUserClick`、`startGame` 與 `start` 方法為非同步，並 `await` 腳本引擎的執行，確保核心流程與 UI 渲染同步。
    2. **程式碼中文化註解**
       - 為所有修改的非同步方法加上詳細的繁體中文註解。
    
    ### 待辦事項
- 優化 UI 樣式。
- 增加更多的劇本指令支援。
