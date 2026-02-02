# 腳本編輯器功能擴充與系統變更日誌 (2026-02-02 16:30)

## ✨ 新功能 (Visual Preview & Workspace)

### 視覺化預覽舞台 (Visual Preview Stage)
*   **功能描述**: 編輯器右側現在擁有一個即時的視覺模擬區域，取代原本的純文字佔位符。
*   **運作機制**: 
    *   系統會掃描從開頭至當前游標行的腳本內容。
    *   **背景 (BG)**: 自動顯示最近設定的背景圖片。
    *   **立繪 (CHARA)**: 自動在左/中/右位置顯示最後設定的角色立繪。
    *   **對話 (SAY)**: 若游標停留在 `SAY` 指令上，預覽區底部會顯示模擬的對話框與文字。
*   **用途**: 讓創作者在無需完整執行遊戲的情況下，即時確認畫面構圖與素材引用是否正確。

### 側邊欄折疊 (Collapsible Sidebar)
*   **功能描述**: 編輯器左上角新增「展開/收起 (☰)」按鈕。
*   **用途**: 在專注寫作時可收起劇本清單，最大化編輯區域的寬度。

# 腳本編輯器功能擴充與系統變更日誌 (2026-02-02 16:00)

## 🎨 介面優化 (UI Final Polish)

### 佈局微調 (Layout Tweaks)
*   **側邊欄加寬**: `Script List` 寬度進一步增加至 290px。
*   **編輯器 RWD**: 修正了 CodeMirror 編輯器的垂直捲動行為，現在能正確隨視窗高度自動伸縮，確保捲軸始終可見。
*   **視覺對齊**: 調整了右側「語法預覽區」的底部邊界，使其與中間的「執行腳本」按鈕頂部對齊，視覺上更加整齊一致。

# 腳本編輯器功能擴充與系統變更日誌 (2026-02-02 15:45)

## 🎨 介面優化 (UI Adjustments)

### 側邊欄與編輯器佈局 (Sidebar & Layout)
*   **側邊欄加寬**: `Script List` 寬度從 250px 增加至 260px，提供更多空間顯示長檔名。
*   **RWD 自適應**: 編輯器區域 (`#editor-container`) 現在改為 `flex: 1`，會隨視窗大小自動縮放，不再固定寬度，提升大螢幕下的編輯體驗。

# 腳本編輯器功能擴充與系統變更日誌 (2026-02-02 15:30)

## ✨ 新功能 (Multi-script Engine Support)

### 劇本跳轉指令 (CALL_SCRIPT Command)
*   **功能描述**: 新增指令 `CALL_SCRIPT|劇本名稱`，允許在遊戲過程中切換載入不同的劇本檔案。
*   **技術實作**: `ScriptEngine` 會從 LocalStorage 讀取對應名稱的劇本內容並即時更換執行。

### 遊戲啟動載入機制 (Dynamic Boot Loading)
*   **功能描述**: 遊戲啟動時，會優先檢查 Script Editor 是否有設定「主劇本 (Main Script)」。
*   **主要改進**:
    *   **優先載入**: 若有主劇本則載入該內容，否則才回退至內建的測試劇本。
    *   **同步體驗**: 使用者在編輯器中指定的 Main 劇本會直接反映在遊戲刷新後的啟動內容中。

# 腳本編輯器功能擴充與系統變更日誌 (2026-02-02 15:15)

## ✨ 新功能 (Script Editor Auto-save)

### 自動儲存與狀態顯示 (Auto-save & Status UI)
*   **功能描述**: 編輯器現在會根據內容變動自動儲存回 LocalStorage，並在標題即時反應儲存狀態。
*   **主要改進**:
    *   **自動寫入**: 移除手動儲存的負擔，每一筆編輯都會自動對應到目前的本機劇本檔案。
    *   **狀態切換**: 標題會根據編輯行為在「編輯中 (藍色)」與「已儲存 (綠色)」之間切換，提供視覺反饋。
    *   **技術實作**: 透過 CodeMirror 的 `change` 與 `beforeChange` 事件捕捉編輯週期。

# 腳本編輯器功能擴充與系統變更日誌 (2026-02-02 15:00)

## 🐛 錯誤修復與介面重構 (Script Editor Layout)

### 介面重構至三欄式 (3-Column Layout)
*   **變更內容**: 將編輯器介面從原有的側邊欄+預覽，重構為 **劇本清單 (左)** | **編輯器 (中)** | **預覽 (右)** 的三欄式佈局。
*   **目的**: 解決劇本清單與編輯器擠在一起的問題，提供更寬敞的編輯空間與更直觀的導航體驗。
*   **技術細節**:
    *   `script_editor.html`: 新增 `#sidebar-list` 容器，調整 CSS Flex 佈局。
    *   移除舊有的「側邊欄收合」功能 (#toggle-sidebar)，因為三欄式佈局下已不適用。

### 運行時錯誤修復 (Runtime Fixes)
*   **問題描述**: 重構介面後，因移除了 DOM 元素導致 `Uncaught TypeError`，進而中斷 JS 執行，造成 `editor` 未初始化與劇本清單無法點擊。
*   **修復內容**:
    *   移除 `src/scripteditor.js` 中對 `#toggle-sidebar` 的事件監聽。
    *   調整 `initEditor()` 與 `renderScriptList()` 的執行順序，確保在嘗試渲染列表或處理點擊前，CodeMirror 編輯器實體已正確初始化。

# 腳本編輯器功能擴充與系統變更日誌 (2026-02-02 14:45)

## 🐛 錯誤修復 (Script Editor)

### 腳本清單回調函數錯誤 (Script List Callback Error)
*   **問題描述**: 在初始化腳本編輯器時，控制台報錯 `Uncaught TypeError: ScriptManager.onScriptListChanged is not a function`，導致腳本清單無法正確顯示與更新。
*   **原因分析**: `ScriptManager` 模組在匯出 (return) 時，錯誤地匯出了內部的變數 `onListChangedCallback` (初始為 null)，而非匯出用於註冊回調的函數 `onScriptListChanged`。
*   **修復內容**: 修正 `src/scripteditor.js` 中的 `ScriptManager` return 物件，正確匯出 `onScriptListChanged` 函數。

# 腳本編輯器功能擴充與系統變更日誌 (2026-02-02 14:30)

## ✨ 新功能 (Script Editor UI)

### 劇本清單管理面板 (Script List Panel)
*   **功能描述**: 在編輯器側邊欄新增了劇本清單面板，方便使用者管理大量劇本。
*   **主要功能**:
    *   **劇本列表**: 顯示目前 LocalStorage 中儲存的所有劇本，並自動依名稱排序 (A-Z)，方便管理如 `Script01-01`, `Script01-02` 等連續劇本。
    *   **搜尋過濾**: 提供搜尋框，可即時過濾劇本名稱。
    *   **CRUD 操作**: 
        *   **新增 (+)**: 建立新劇本。
        *   **刪除 (🗑)**: 刪除目前選中的劇本。
        *   **重新命名 (✎)**: 修改劇本名稱。
    *   **主劇本標記**: 在清單中標示 "MAIN" 劇本，並可透過右鍵選單設定主劇本。
*   **技術實作**:
    *   修改 `script_editor.html`: 加入 `#script-list-panel` 結構與 CSS 樣式。
    *   修改 `src/scripteditor.js`: 實作 `renderScriptList`、搜尋邏輯以及各項按鈕的事件監聽器。

# 腳本編輯器功能擴充與系統變更日誌 (2026-02-02)

## ✨ 新功能 (Script Editor & Visual Effects)

### 背景震動效果 (Background Shake)
*   **功能描述**: 擴充 `BG` 指令，支援在切換背景或單獨呼叫時觸發畫面震動效果，增強劇情的衝擊力或動態感。
*   **腳本語法**: `BG|圖片名稱|震動強度(可選)`
    *   **震動強度**: 浮點數，範圍建議為 `0.0` 至 `1.0`。數值越大，震動幅度越劇烈。例如 `BG|bg_room|0.5`。
*   **技術實作**:
    *   **CSS 動畫**: 在 `index.html` 中定義 `@keyframes shake-effect`，並透過 CSS 變數 `--shake-intensity` 動態控制位移量。
    *   **`AssetManager` 擴充**: 新增 `shakeBG(intensity)` 方法。此方法會計算像素位移量，設定 CSS 變數，並透過 `shaking` class 觸發動畫，隨後在動畫結束 (300ms) 後自動清理。
    *   **`ScriptEngine` 解析**: 更新 `BG` 指令的解析邏輯，讀取第三個參數並呼叫 `AssetManager.shakeBG`。

## 🐛 錯誤修復 (GameKernel & ScriptEngine)
... (Previous logs)