# 腳本引擎指令優化 (2026-02-02 22:34)

## 🔄 指令優化 (Command Optimization)

### MV 指令路徑簡化 (MV Command Path Simplification)
*   **變更內容**: `MV` 指令的路徑現在固定在 `assets/mov/` 底下。
*   **新語法**: `MV|檔案名稱|音量(可選)`
*   **優點**: 減少腳本撰寫負擔，統一影片資產管理。
*   **範例**: `MV|Main.mp4|1.0` 會自動對應到 `assets/mov/Main.mp4`。

### 指令不分大小寫 (Case-Insensitive Commands)
*   **變更內容**: 腳本指令現在改為 **不分大小寫** (Case-Insensitive)。
*   **運作機制**: 在 `executeLine` 處理時會先將指令部分轉為大寫再進行比對。
*   **優點**: 提升撰寫劇本時的靈活性，降低大小寫輸入錯誤導致的指令無效問題。
*   **範例**: `mv|...`, `Bg|...`, `say|...` 均可正常運作。

# 遊戲邏輯指令文件更新 (2026-02-02 22:18)


## 📝 文件更新 (Documentation Update)

### 遊戲邏輯控制指令詳細說明 (Game Logic Commands Documentation)
*   **更新內容**: 在 `scriptFormat.md` 中新增「遊戲邏輯控制指令」完整章節
*   **新增文件**:
    *   **SET 指令**: 詳細說明變數設定功能，包含語法、參數、應用場景（好感度系統、分支劇情、成就系統等）
    *   **IF 指令**: 完整的條件判斷說明，包含運作邏輯、基礎範例、多重分支進階範例
    *   **CALL_SCRIPT 指令**: 腳本切換功能說明，包含運作機制、劇本組織建議、注意事項
    *   **綜合應用範例**: 提供結合三個指令的完整遊戲場景範例
*   **文件特色**:
    *   每個指令都有清晰的語法格式說明
    *   提供實用的程式碼範例
    *   包含應用場景與最佳實踐建議
    *   綜合範例展示如何組合使用多個指令
*   **影響檔案**: `scriptFormat.md`

# 腳本編輯器自動完成功能更新 (2026-02-02 22:14)


## ✨ 功能增強 (Script Editor Autocomplete Enhancement)

### 音訊指令自動完成支援 (Audio Command Autocomplete Support)
*   **功能描述**: 更新腳本編輯器的自動完成字庫，支援新的管道符號格式音訊指令。
*   **新增指令**:
    *   `BGM_PLAY|` - 播放背景音樂
    *   `BGM_STOP` - 停止背景音樂
    *   `BGM_FADE_OUT|` - 背景音樂淡出
    *   `BGM_FADE_IN|` - 背景音樂淡入
    *   `SFX_PLAY|` - 播放音效
*   **額外改進**: 同時加入 `SET|`, `CALL_SCRIPT|`, `IF|` 等指令到自動完成清單，提升編輯體驗。
*   **語法高亮**: 更新 `mainCommandRegex` 正則表達式，確保新指令能正確高亮顯示。
*   **影響檔案**: `src/scripteditor.js`
*   **使用方式**: 在編輯器中輸入 `BGM` 或 `SFX` 時，按 `Ctrl+Space` 或自動觸發提示清單。

# 音訊指令格式標準化 (2026-02-02 21:56)


## 🔄 重構 (Audio Command Format Standardization)

### 統一音訊指令語法 (Unified Audio Command Syntax)
*   **變更內容**: 將所有音訊控制指令從方括號格式 `[COMMAND: args]` 改為管道符號格式 `COMMAND|args`，與其他腳本指令 (BG, SAY, CHARA 等) 保持一致。
*   **新語法**:
    *   `BGM_PLAY|檔案名稱|音量|是否循環` (原: `[BGM_PLAY: 路徑, 音量, 循環]`)
    *   `BGM_STOP` (原: `[BGM_STOP]`)
    *   `BGM_FADE_OUT|秒數` (原: `[BGM_FADE_OUT: 秒數]`)
    *   `BGM_FADE_IN|秒數|檔案名稱|目標音量|是否循環` (原: `[BGM_FADE_IN: 秒數, 路徑, 音量, 循環]`)
    *   `SFX_PLAY|檔案名稱|音量` (原: `[SFX_PLAY: 路徑, 音量]`)

### 簡化資產路徑處理 (Simplified Asset Path Handling)
*   **變更內容**: 音訊檔案路徑不再需要完整路徑，只需填寫檔案名稱，系統會自動加上固定前綴。
*   **路徑規則**:
    *   **BGM (背景音樂)**: 固定路徑為 `assets/music/`
        *   範例: `BGM_PLAY|001.wav|0.7|true` → 載入 `assets/music/001.wav`
    *   **SFX (音效)**: 固定路徑為 `assets/sound/`
        *   範例: `SFX_PLAY|night_insects.wav|0.5` → 載入 `assets/sound/night_insects.wav`
*   **優點**: 
    *   減少腳本撰寫時的重複輸入
    *   統一資產組織結構
    *   降低路徑錯誤的可能性

### 技術實作 (Technical Implementation)
*   **影響檔案**:
    *   `src/modules/ScriptEngine.ts`: 
        *   移除方括號格式的正則表達式解析邏輯 (line 112-166)
        *   移除舊的 `BGM`/`SE` 簡化指令 (line 241-262)
        *   新增五個音訊指令處理器: `BGM_PLAY`, `BGM_STOP`, `BGM_FADE_OUT`, `BGM_FADE_IN`, `SFX_PLAY`
        *   實作自動路徑前綴邏輯 (`assets/music/` 和 `assets/sound/`)
    *   `scriptFormat.md`: 更新音訊控制指令文件，反映新語法與路徑規則
    *   `tests/ScriptEngine.test.ts`: 
        *   更新現有 `BGM_PLAY` 測試案例
        *   新增四個測試案例: `BGM_STOP`, `BGM_FADE_OUT`, `BGM_FADE_IN`, `SFX_PLAY`
*   **測試結果**: 所有 13 個測試案例通過 ✅

### 向後相容性 (Backward Compatibility)
*   **⚠️ 破壞性變更**: 此更新不向後相容。使用舊語法 `[BGM_PLAY: ...]` 的腳本需要手動更新為新格式 `BGM_PLAY|...|...|...`。
*   **遷移建議**: 
    1. 將所有 `[BGM_PLAY: path, vol, loop]` 改為 `BGM_PLAY|filename|vol|loop`
    2. 移除路徑中的 `assets/music/` 前綴，只保留檔案名稱
    3. 將所有 `[SFX_PLAY: path, vol]` 改為 `SFX_PLAY|filename|vol`
    4. 移除路徑中的 `assets/sound/` 或 `assets/sfx/` 前綴

# Bootstrap 資產載入錯誤修復 (2026-02-02 21:31)


## 🐛 錯誤修復 (Bootstrap Asset Loading)

### 移除無效的硬編碼資產預載入 (Invalid Asset Preload Removal)
*   **問題描述**: 應用程式啟動時，控制台顯示多個資產載入失敗錯誤：
    *   `/bg/bg_room.jpg` - 404 錯誤
    *   `/char/hero.png` - 404 錯誤
    *   `/char/hero_happy.png` - 404 錯誤
*   **原因分析**: `src/index.ts` 中的 `gameAssets` 陣列硬編碼了三個不存在的資產檔案路徑。這些檔案從未存在於 `assets/bg` 或 `assets/char` 資料夾中。
*   **修復內容**:
    *   移除 `gameAssets` 常數陣列定義（第 5-9 行）
    *   移除 `bootstrap()` 函數中的資產預載入邏輯（第 18-23 行）
    *   保留核心初始化流程，因為實際使用的資產會由腳本引擎在執行時動態載入
*   **影響範圍**: `src/index.ts`
*   **測試結果**: 應用程式現在可以正常啟動，不再顯示資產載入錯誤訊息

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