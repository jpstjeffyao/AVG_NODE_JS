# DefineDocument 系統定義文件全面更新 (2026-02-03 22:55)

## 📚 文件系統重構 (Documentation System Overhaul)

### 現有文件更新 (Existing Documents Update)
*   **變更範圍**: 更新 DefineDocument 目錄中的 5 個現有文件
*   **更新內容**:
    *   **00_Architecture.md**: 完全重寫，移除所有 Unity/C# 架構描述，改為詳細的 TypeScript/Node.js 架構說明
        *   新增技術棧說明（TypeScript, Vite, Jest）
        *   更新專案目錄結構，反映實際的 `src/core/`, `src/modules/`, `assets/` 結構
        *   重新定義模組架構與職責劃分
        *   補充資料流向圖和與 Unity 版本的差異對比
    *   **01_MainFlow_Entry.md**: 重寫主流程文件，移除 Unity Scene 系統
        *   詳細說明 Web 應用的 `bootstrap()` 啟動流程
        *   補充 LocalStorage 主腳本載入機制
        *   更新遊戲狀態轉換流程圖
        *   說明編輯器與主視窗的 `postMessage` 通訊機制
    *   **02_UI_System.md**: 大幅擴展 UI 系統文件
        *   保留原有的空白鍵推進功能說明
        *   新增主選單系統（MENU）的完整說明
        *   新增打字機效果的實作細節
        *   新增全螢幕影片播放（MV）功能說明
        *   新增畫面淡出效果（fadeOut）說明
        *   新增選項系統的 UI 實作細節
    *   **04_assets.md**: 擴展資源管理文件
        *   補充完整的資源目錄結構說明
        *   詳細說明 BG 指令（包含震動效果）
        *   補充 CHARA 指令的資源管理（由 CharacterModule 負責）
        *   新增資源快取機制說明
        *   補充錯誤處理和效能優化建議
    *   **05_choices.md**: 擴展選項系統文件
        *   保留原有的腳本範例
        *   新增完整的技術實作細節
        *   補充事件處理機制（事件委派、事件清理）
        *   新增標籤與跳轉系統的詳細說明
        *   補充進階應用範例和最佳實踐

### 新增系統文件 (New System Documents)
*   **新增檔案**: 建立 5 個新的系統定義文件，填補關鍵系統的文件空白
*   **新增內容**:
    *   **03_ScriptEngine.md**: 腳本引擎完整文件（14 個章節）
        *   完整的指令清單（對話、場景、音訊、邏輯、互動）
        *   腳本載入與執行流程說明
        *   標籤掃描與跳轉系統詳解
        *   變數系統與條件判斷說明
        *   非同步指令處理機制
        *   與其他模組的整合方式
        *   錯誤處理和除錯建議
    *   **06_AudioManager.md**: 音訊管理系統文件（12 個章節）
        *   BGM 控制指令詳解（播放、停止、淡入淡出）
        *   SFX 多重播放機制說明
        *   音訊路徑自動補全規範
        *   音量控制與推薦值
        *   ScriptEngine 整合方式
        *   支援的檔案格式說明
        *   效能優化建議
    *   **07_CharacterModule.md**: 角色立繪系統文件（14 個章節）
        *   三位置立繪系統（left, center, right）
        *   CHARA 指令完整說明（SHOW, HIDE, CLEAR）
        *   資源命名規範
        *   說話者高亮邏輯實作
        *   與 AssetManager 的整合
        *   動畫效果說明
        *   完整場景範例
    *   **08_StateManager.md**: 狀態管理系統文件（12 個章節）
        *   遊戲狀態（GameState）詳細定義
        *   狀態轉換流程圖
        *   變數系統實作（SET/GET）
        *   旗標系統說明
        *   存檔/讀檔機制（未完整實作）
        *   變數應用範例（好感度、章節進度）
        *   除錯工具和最佳實踐
    *   **09_ScriptEditor.md**: 腳本編輯器系統文件（13 個章節）
        *   多腳本管理功能（建立、刪除、重命名）
        *   主腳本標記系統
        *   LocalStorage 資料結構詳解
        *   腳本列表（A-Z 排序、搜尋過濾）
        *   檔案導入/導出功能
        *   postMessage 跨視窗通訊機制
        *   自動儲存功能說明

### 文件特色與設計理念
*   **繁體中文撰寫**: 所有文件使用繁體中文，方便本地化閱讀
*   **一致性**: 所有文件遵循統一的格式和結構
*   **完整性**: 每個文件包含系統概述、功能說明、實作細節、範例程式碼
*   **實用性**: 提供豐富的程式碼範例和應用情境
*   **可維護性**: 使用 Markdown 檔案連結相互引用，方便查閱
*   **擴展性**: 每個文件都包含未來擴展的建議

### 影響檔案列表
*   **更新檔案** (5 個):
    *   `DefineDocument/00_Architecture.md`
    *   `DefineDocument/01_MainFlow_Entry.md`
    *   `DefineDocument/02_UI_System.md`
    *   `DefineDocument/04_assets.md`
    *   `DefineDocument/05_choices.md`
*   **新增檔案** (5 個):
    *   `DefineDocument/03_ScriptEngine.md`
    *   `DefineDocument/06_AudioManager.md`
    *   `DefineDocument/07_CharacterModule.md`
    *   `DefineDocument/08_StateManager.md`
    *   `DefineDocument/09_ScriptEditor.md`

### 文件統計
*   **總計**: 10 個定義文件（全部涵蓋核心系統）
*   **更新檔案行數**: 約 2,000+ 行 Markdown
*   **新增檔案行數**: 約 3,500+ 行 Markdown
*   **程式碼範例**: 100+ 個實用範例
*   **章節總數**: 120+ 個章節

### 參考與一致性
*   **與程式碼同步**: 所有文件內容已與當前的 TypeScript 實作驗證一致
*   **與其他文件互補**: 與 `scriptFormat.md` 和 `ReadMe.md` 保持一致性
*   **交叉引用**: 文件之間通過 Markdown 連結相互引用，形成完整的文件系統

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