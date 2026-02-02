# AVG Node JS 引擎實驗室

這是一個基於 Node.js 與 TypeScript 開發的 AVG (Adventure Game) 引擎核心實驗專案。

## 核心架構
/avg-engine-web
  ├── /src
  │    ├── /core           # 核心引擎 (Kernel, Base Classes)
  │    ├── /modules        # 功能模組 (UI, Audio, Script, State)
  │    │    ├── UIModule.ts
  │    │    ├── ScriptModule.ts
  │    │    └── ...
  │    ├── /interfaces     # 介面定義
  │    └── index.ts        # 進入點 (Boot)
  ├── /DefineDocument    #定義文件
  ├── /tests               # Jest 測試案例
  ├── /public              # 靜態資源 (Images, Audio, Scripts)
  ├── package.json
  └── tsconfig.json
- **GameKernel**: 單例模式的核心控制器，負責模組註冊與生命週期管理。
- **StateManager**: 負責遊戲狀態、變數與旗標的管理。
- **ScriptEngine**: 劇本解析引擎，支援 `SAY`、`SET`、`IF` 等指令。
- **UIModule**: 負責 Web 介面渲染與使用者互動。

## 功能特性

* **動態立繪顯示系統**：支援在遊戲畫面中的左、右、中三個位置顯示角色立繪，並可透過腳本指令 `CHARA` 進行動態更換與隱藏。（詳細指令請參考 [腳本格式說明](./scriptFormat.md#chara---顯示隱藏立繪)）
* **音訊防禦性檢查**：修正啟動新遊戲或執行指令時，BGM 音量參數錯誤導致系統崩潰的問題。

## 腳本編輯器強化功能

本專案提供了一個強大的網頁版腳本編輯器 (`script_editor.html`)，支援即時預覽與多腳本管理。

### 1. 主要功能列表與簡介
- **多腳本管理**：支援在瀏覽器中儲存多個不同的劇本檔案，無需頻繁切換實體檔案。
- **主腳本切換**：可指定其中一個腳本為「主腳本 (Main)」，作為遊戲啟動時預設載入的內容。
- **腳本 CRUD**：支援新增、重新命名、刪除以及更新腳本內容。
- **純文字檔案上傳**：支援將本地的 `.txt` 或 `.md` 檔案直接導入為新腳本或覆蓋現有主腳本。
- **即時語法預覽**：編輯時會自動分析最後一行指令，顯示當前指令的語法提示與腳本狀態。
- **自動儲存**：編輯器會即時將變動儲存至 LocalStorage，避免因意外關閉視窗導致內容遺失。

### 2. 操作說明
- **新增腳本**：點擊側邊欄工具列的「＋」按鈕並輸入名稱即可。
- **切換腳本**：在腳本清單中點擊任一腳本名稱，編輯器會自動切換顯示。
- **搜尋與排序**：使用上方的搜尋框可即時過濾劇本；清單會自動依名稱 (A-Z) 排序，方便連續劇本 (如 Script01-01, Script01-02) 排列。
- **刪除腳本**：選取腳本後，點擊工具列的「🗑 (刪除)」按鈕。
- **重新命名**：選取腳本後，點擊工具列的「✎ (重命名)」按鈕。
- **設為主腳本**：在腳本清單中對目標腳本點擊 **滑鼠右鍵**，選擇確認即可設定為主劇本 (標記為 MAIN)。
- **上傳腳本**：使用下方的「開啟檔案」按鈕載入本地檔案 (不影響 LocalStorage)，或使用舊版上傳功能導入。
- **執行與同步**：點擊「執行腳本 (Run)」按鈕，會透過 `postMessage` 將內容即時傳送到遊戲視窗執行。

### 3. LocalStorage 結構簡介
腳本資料持久化儲存於瀏覽器的 LocalStorage 中，結構如下：
- `scripteditor_scripts`: 儲存腳本索引陣列 (JSON 字串)，格式為 `[{ "name": "...", "isMain": boolean }]`。
- `scripteditor_script_[NAME]`: 儲存各個腳本的純文字內文。

### 4. 主要 API 及其用途 (src/scripteditor.js)
- `ScriptManager.getScriptList()`: 取得目前所有的腳本索引清單。
- `ScriptManager.saveScript(name, content)`: 儲存特定腳本內容，若索引不存在會自動建立。
- `ScriptManager.addScript(name, content)`: 建立新腳本。
- `ScriptManager.deleteScript(name)`: 刪除腳本與其索引。
- `ScriptManager.setMainScript(name)`: 設定單一主腳本。
- `ScriptManager.handleFileUpload(file, overwriteMain)`: 處理檔案上傳邏輯。

### 5. 注意事項與限制
- **瀏覽器依賴**：腳本儲存於特定瀏覽器的 LocalStorage 中，更換瀏覽器或清除快取會導致資料遺失。
- **檔案格式**：上傳僅支援 `.txt` 與 `.md`，編碼建議使用 `UTF-8`。
- **跨視窗通訊**：編輯器必須由遊戲主視窗開啟，才能透過 `postMessage` 進行即時同步執行。

## 檔案結構

- `src/core/`: 核心系統 (Kernel, StateManager, Interfaces)
- `src/modules/`: 功能模組 (ScriptEngine, UIModule)
- `tests/`: Jest 測試案例
- `index.html`: Web 版本進入點樣板

## 開發環境啟動

### 1. 安裝依賴
```bash
npm install
```

### 2. 執行單元測試
```bash
npm test
# 查看測試覆蓋率
npm run test:coverage
```

### 3. 啟動 Web 開發伺服器 (Vite)
```bash
npm run dev
```
啟動後，開啟瀏覽器造訪 `http://localhost:5173` 即可看到遊戲畫面。

## 劇本語法範例

- `SAY|角色名稱|對話內容`
- `SET|變數名稱|數值`
- `IF|變數名稱|數值|GOTO|行號`

## 互動方式

在 Web 介面中，點擊螢幕任何地方或對話框，即可驅動 `ScriptEngine` 執行下一行指令。
