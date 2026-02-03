# 系統架構定義 (System Architecture)

## 1. 設計哲學

- **核心模式**：模組化架構 (Module Pattern) + 依賴注入 (Dependency Injection)
- **錯誤隔離**：所有模組在 GameKernel 的更新循環中被 Try-Catch 包裹，避免單一模組錯誤導致系統崩潰
- **數據流向**：單向數據流 (ScriptEngine → StateManager → UIModule → DOM)
- **非同步優先**：支援非同步資源載入與指令執行，確保流暢的遊戲體驗

## 2. 技術棧 (Technology Stack)

- **語言**：TypeScript 4.x
- **運行環境**：Node.js + Web Browser
- **建置工具**：Vite (開發伺服器 + 打包)
- **測試框架**：Jest (單元測試)
- **資料持久化**：LocalStorage (腳本、存檔)

## 3. 專案目錄結構 (Folder Structure)

```
/avg-engine-web
  ├── /src
  │    ├── /core              # 核心引擎
  │    │    ├── GameKernel.ts       # 遊戲核心控制器（單例）
  │    │    ├── IGameModule.ts      # 模組介面定義
  │    │    └── StateManager.ts     # 狀態與變數管理
  │    ├── /modules           # 功能模組
  │    │    ├── UIModule.ts         # UI 渲染與互動
  │    │    ├── ScriptEngine.ts     # 腳本解析與執行
  │    │    ├── AssetManager.ts     # 資源預載與管理
  │    │    ├── AudioManager.ts     # 音訊控制（BGM/SFX）
  │    │    └── CharacterModule.ts  # 角色立繪管理
  │    ├── index.ts           # 應用程式進入點
  │    └── scripteditor.js    # 腳本編輯器（獨立視窗）
  ├── /assets                 # 遊戲資源
  │    ├── /bg                # 背景圖片
  │    ├── /char              # 角色立繪
  │    ├── /music             # 背景音樂
  │    ├── /sound             # 音效
  │    └── /mov               # 影片
  ├── /tests                  # Jest 測試案例
  ├── /DefineDocument         # 系統設計與規範文件
  ├── index.html              # Web 進入點
  ├── script_editor.html      # 腳本編輯器介面
  ├── package.json
  └── tsconfig.json
```

## 4. 核心介面 (Core Interface)

所有功能模組必須實作 `IGameModule` 介面：

```typescript
export interface IGameModule {
    moduleName: string;      // 模組名稱（用於識別）
    initialize(): void;      // 初始化（註冊事件、綁定 DOM）
    update(): void;          // 每幀執行（若需要）
    shutdown(): void;        // 清理資源（移除監聽器、釋放記憶體）
}
```

**職責說明：**
- `initialize()`: 在 `GameKernel.initializeModules()` 統一呼叫，負責模組的啟動設定
- `update()`: 遊戲主循環中被呼叫（目前多數模組未使用，預留擴展）
- `shutdown()`: 遊戲結束或重置時呼叫，避免記憶體洩漏

## 5. 模組架構與職責劃分

### 核心層 (Core Layer)

#### GameKernel
- **職責**：遊戲核心控制器，管理所有模組的生命週期
- **功能**：
  - 模組註冊與初始化
  - 統一的更新循環（錯誤隔離）
  - 使用者輸入處理（點擊、鍵盤）
  - 腳本載入與遊戲啟動
- **特性**：單例模式，全域唯一實例

#### StateManager
- **職責**：遊戲狀態與變數管理
- **功能**：
  - 遊戲狀態切換（TITLE, PLAYING, WAIT_CHOICE 等）
  - 全域變數存取（SET/GET）
  - 旗標系統（存檔、成就判定）

#### IGameModule
- **職責**：定義所有模組必須遵守的介面契約
- **設計目的**：確保模組可插拔性與一致的生命週期管理

### 功能層 (Module Layer)

#### ScriptEngine
- **職責**：腳本解析與指令執行
- **功能**：
  - 腳本行解析（支援管道符 `|` 分隔語法）
  - 標籤系統（LABEL/GOTO）
  - 條件判斷（IF/SET）
  - 非同步指令執行（資源載入、影片播放）
  - 與其他模組的協調（呼叫 UIModule、AudioManager 等）

#### UIModule
- **職責**：使用者介面渲染與互動
- **功能**：
  - 主選單顯示（MENU）
  - 對話視窗與打字機效果
  - 選項按鈕（CHOICE）
  - 全螢幕影片播放（MV）
  - 畫面淡出效果（FADE_OUT）

#### AssetManager
- **職責**：資源預載與快取管理
- **功能**：
  - 背景圖片載入與切換（BG）
  - 圖片快取（避免重複載入）
  - 震動效果（BG 指令參數3）

#### AudioManager
- **職責**：音訊控制
- **功能**：
  - BGM 播放與控制（播放、停止、淡入淡出）
  - SFX 多重播放
  - 音量控制
  - 資源路徑自動補全

#### CharacterModule
- **職責**：角色立繪管理
- **功能**：
  - 三位置顯示系統（left, center, right）
  - 立繪顯示/隱藏/替換（CHARA 指令）
  - 資源預載
  - 立繪高亮邏輯（說話者高亮）

## 6. 資料流向圖

```
使用者輸入 (Click/Space)
    ↓
GameKernel.onUserClick()
    ↓
ScriptEngine.next()
    ↓
ScriptEngine.executeLine()
    ↓ (解析指令)
    ├─→ UIModule.renderText()      → DOM 更新
    ├─→ AssetManager.setBackground() → 背景切換
    ├─→ CharacterModule.showCharacter() → 立繪顯示
    ├─→ AudioManager.playBGM()      → 音訊播放
    └─→ StateManager.setVariable()  → 變數更新
```

## 7. 錯誤處理機制

**原則**：防禦性程式設計，避免單點故障

- **模組層級**：每個模組的 `update()` 都在 Try-Catch 中執行
- **指令層級**：ScriptEngine 中每個指令執行都有錯誤捕獲
- **資源層級**：資源載入失敗時使用降級策略（fallback 圖片、靜音處理）
- **使用者友善**：錯誤訊息記錄至 Console，但不中斷遊戲流程

## 8. 與 Unity 版本的差異

| 項目 | Unity 版本 | TypeScript 版本 |
|------|-----------|----------------|
| 場景管理 | Unity Scene 系統 | Web 單頁應用 + CSS 顯示切換 |
| 資源載入 | Resources.Load() | 動態 Image/Audio 載入 |
| 狀態持久化 | PlayerPrefs | LocalStorage |
| UI 系統 | Unity UI (Canvas) | 原生 HTML/CSS + DOM 操作 |
| 腳本格式 | 可能使用 JSON/XML | 純文字管道符語法 |

## 9. 擴展性考量

**設計支援未來擴展**：
- 新增模組：實作 `IGameModule` 並在 GameKernel 中註冊
- 新增指令：在 `ScriptEngine.executeLine()` 中添加 case 分支
- 新增資源類型：擴展 AssetManager 的載入邏輯
- 存檔系統：利用 StateManager 的變數系統 + LocalStorage

## 10. 參考文件

- [腳本格式說明](../scriptFormat.md)
- [開發環境設定](../ReadMe.md)
- [主流程與進入點](./01_MainFlow_Entry.md)
- [UI 系統設計](./02_UI_System.md)