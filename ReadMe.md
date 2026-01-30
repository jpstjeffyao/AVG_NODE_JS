# AVG Node JS 引擎實驗室

這是一個基於 Node.js 與 TypeScript 開發的 AVG (Adventure Game) 引擎核心實驗專案。

## 核心架構

- **GameKernel**: 單例模式的核心控制器，負責模組註冊與生命週期管理。
- **StateManager**: 負責遊戲狀態、變數與旗標的管理。
- **ScriptEngine**: 劇本解析引擎，支援 `SAY`、`SET`、`IF` 等指令。
- **UIModule**: 負責 Web 介面渲染與使用者互動。

## 功能特性

* **動態立繪顯示系統**：支援在遊戲畫面中的左、右、中三個位置顯示角色立繪，並可透過腳本指令 `CHARA` 進行動態更換與隱藏。（詳細指令請參考 [腳本格式說明](./scriptFormat.md#chara---顯示隱藏立繪)）

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
