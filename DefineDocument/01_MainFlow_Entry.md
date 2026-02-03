# 遊戲主流程與進入點 (Main Flow & Entry Point)

## 1. 進入點 (Entry Point)

### 1.1 應用程式啟動

**檔案**：`src/index.ts`

**啟動流程**：

```typescript
window.onload = () => {
    bootstrap().catch(err => console.error("Bootstrap error:", err));
};
```

當瀏覽器載入完成後，執行 `bootstrap()` 函數。

### 1.2 Bootstrap 函數職責

1. **實例化 GameKernel**（單例）
2. **從 LocalStorage 載入主腳本**（如有設定）
3. **載入預設測試腳本**（如無主腳本）
4. **初始化所有模組**（呼叫 `kernel.initializeModules()`）
5. **設定編輯器通訊**（接收 `postMessage` 事件）
6. **綁定開啟編輯器按鈕**

### 1.3 腳本載入機制

#### LocalStorage 主腳本載入

系統會嘗試從 LocalStorage 讀取標記為「主腳本 (Main)」的劇本：

```typescript
const savedScriptsStr = localStorage.getItem('scripteditor_scripts');
const scripts = JSON.parse(savedScriptsStr);
const mainScript = scripts.find(s => s.isMain);
const content = localStorage.getItem(`scripteditor_script_${mainScript.name}`);
```

**資料結構**：
- `scripteditor_scripts`: JSON 陣列，儲存腳本索引 `[{name, isMain}]`
- `scripteditor_script_[NAME]`: 各腳本的純文字內容

#### 預設測試腳本

若無主腳本，系統會載入內建的預設劇本（包含完整的示範流程，展示所有核心功能）。

### 1.4 模組初始化順序

GameKernel 在建構函數中按以下順序註冊模組：

1. **AssetManager** - 資源管理（需最先初始化，供其他模組使用）
2. **StateManager** - 狀態管理
3. **CharacterModule** - 角色立繪
4. **AudioManager** - 音訊控制
5. **ScriptEngine** - 腳本引擎
6. **UIModule** - UI 渲染（最後初始化，依賴其他模組）

呼叫 `initializeModules()` 後，所有模組的 `initialize()` 方法會依序執行。

## 2. 狀態流程圖 (State Flow)

### 2.1 遊戲狀態 (GameState)

系統定義以下狀態（由 StateManager 管理）：

```typescript
enum GameState {
    STATE_TITLE = 0,              // 主選單
    STATE_PLAYING = 1,            // 遊戲進行中
    STATE_WAIT_CHOICE = 2,        // 等待玩家選擇
    STATE_WAIT_END_INTERACTION = 3, // 等待結束互動
    STATE_FADING_OUT = 4          // 淡出中
}
```

### 2.2 狀態轉換流程

```
[應用程式啟動]
    ↓
[bootstrap() 執行]
    ↓
[GameKernel 初始化]
    ↓
[顯示 MENU 畫面] ← STATE_TITLE
    │
    │ (使用者點擊「開始遊戲」)
    ↓
[隱藏 MENU，顯示對話框] ← STATE_PLAYING
    ↓
[ScriptEngine 逐行執行腳本]
    │
    ├─→ [遇到 CHOICE 指令] → STATE_WAIT_CHOICE
    │       ↓ (使用者選擇)
    │       └─→ 返回 STATE_PLAYING
    │
    ├─→ [遇到 MV 指令] → 播放影片（阻塞）
    │       ↓ (影片結束)
    │       └─→ 繼續執行
    │
    └─→ [腳本執行完畢] → STATE_WAIT_END_INTERACTION
            ↓ (使用者點擊)
            └─→ STATE_FADING_OUT → 淡出動畫
                    ↓
                [觸發 avg_fade_complete 事件]
```

## 3. 使用者互動處理

### 3.1 點擊處理

**觸發位置**：`GameKernel.onUserClick()`

**流程**：

1. **檢查當前狀態**
   - `STATE_TITLE`: 忽略點擊（選單按鈕有獨立處理）
   - `STATE_WAIT_END_INTERACTION`: 觸發淡出動畫
   - `STATE_FADING_OUT`: 忽略點擊（動畫進行中）
   - 其他狀態: 交由 ScriptEngine 處理

2. **執行下一行指令**
   ```typescript
   await scriptEngine.next();
   ```

3. **ScriptEngine 內部判斷**
   - 若 UIModule 正在打字：完成打字效果
   - 若打字已完成：執行下一條腳本指令

### 3.2 鍵盤處理

**支援的按鍵**：
- **Space (空白鍵)**：等同於點擊，觸發 `onUserClick()`
- **Escape (ESC)**：（預留，目前未實作）

**實作位置**：`UIModule.handleDocumentSpaceKey()`

### 3.3 選單按鈕

**位置**：MENU 畫面

- **開始遊戲 (New Game)**：`uiModule.onNewGameClick()` → 隱藏選單，啟動腳本
- **繼續遊戲 (Load Game)**：（預留功能）
- **系統設定 (Settings)**：（預留功能）

## 4. 編輯器通訊機制

### 4.1 跨視窗通訊

**技術**：`window.postMessage()` API

**流程**：

1. 使用者在主視窗點擊「開啟編輯器」按鈕
2. 開啟新視窗 `script_editor.html`
3. 編輯器中點擊「執行腳本 (Run)」按鈕
4. 編輯器發送訊息到主視窗：
   ```javascript
   window.opener.postMessage({
       type: 'UPDATE_SCRIPT',
       script: scriptContent
   }, '*');
   ```

5. 主視窗接收訊息並重新載入腳本：
   ```typescript
   window.addEventListener('message', (event) => {
       if (event.data && event.data.type === 'UPDATE_SCRIPT') {
           kernel.loadScript(scriptLines);
           kernel.initializeModules();
           kernel.start();
       }
   });
   ```

### 4.2 腳本熱更新

編輯器發送的腳本會：
1. 重置 ScriptEngine
2. 重新初始化所有模組
3. 隱藏選單，顯示對話框
4. 從第一行開始執行

## 5. 異常處理 (Error Handling)

### 5.1 模組層級錯誤隔離

**實作位置**：`GameKernel.update()`

```typescript
for (const module of this.modules) {
    try {
        module.update();
    } catch (error) {
        console.error('Module update error:', error);
    }
}
```

**設計目的**：單一模組錯誤不影響其他模組運作

### 5.2 腳本指令錯誤

**處理策略**：
- 未知指令：記錄警告，跳過該行
- 參數錯誤：使用預設值或忽略
- 資源載入失敗：顯示錯誤訊息，繼續執行

### 5.3 使用者友善原則

- **Console 記錄**：所有錯誤記錄至開發者工具
- **不中斷遊戲**：錯誤不導致白屏或當機
- **降級策略**：缺少資源時使用預設值

## 6. 生命週期總結

```
應用程式啟動 (window.onload)
    ↓
bootstrap() - 初始化核心
    ↓
GameKernel.initializeModules() - 初始化所有模組
    ↓
顯示 MENU (STATE_TITLE)
    ↓ (使用者互動)
開始遊戲 (kernel.startGame())
    ↓
ScriptEngine.next() - 逐行執行腳本
    ↓ (遊戲進行中)
使用者點擊/按鍵 → onUserClick() → 推進劇情
    ↓ (腳本結束)
STATE_WAIT_END_INTERACTION → 淡出動畫
    ↓
avg_fade_complete 事件觸發
```

## 7. 參考文件

- [系統架構](./00_Architecture.md)
- [腳本引擎](./03_ScriptEngine.md)
- [UI 系統](./02_UI_System.md)
- [狀態管理](./08_StateManager.md)