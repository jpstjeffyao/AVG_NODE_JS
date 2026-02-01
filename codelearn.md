# 程式碼流程與架構說明

## 專案概述
這是一個基於 Node.js 和 TypeScript 開發的 AVG (Adventure Game) 引擎核心實驗專案。其目標是提供一個彈性且可擴展的框架，用於創建 AVG 遊戲，專注於遊戲狀態管理、腳本解析和 UI 渲染等核心功能。

## 核心架構組件

### 1. GameKernel (核心控制器)
- **職責**: 作為單例模式的核心控制器，負責整個遊戲的生命週期管理和模組註冊。它是各個模組之間的協調者，確保它們正確地初始化、更新和銷毀。
- **流程**: 在遊戲啟動時初始化所有註冊的模組，並在接收到使用者輸入（如點擊或按下空白鍵）時，協調 `ScriptEngine` 推進遊戲進程。

### 2. StateManager (狀態管理器)
- **職責**: 負責管理遊戲的各種狀態、變數和旗標，例如玩家的選擇、劇情進度、角色好感度等。
- **流程**: `ScriptEngine` 在執行 `SET` 和 `IF` 等指令時會與 `StateManager` 互動，讀取或修改遊戲數據，以影響劇情走向或遊戲邏輯。

### 3. ScriptEngine (腳本引擎)
- **職責**: 解析遊戲腳本，並執行其中的指令。支援如 `SAY` (對話)、`SET` (設定變數)、`IF` (條件判斷)、`CHOICE` (選項)、`BG` (設定背景)、`SPRITE` (顯示立繪)、`CHARA` (立繪控制) 等豐富的指令集。
- **流程**: 從腳本中逐行讀取指令，根據指令類型調用相應的模組（如 `UIModule` 顯示對話，`AssetManager` 設定背景，`AudioManager` 播放音效等）來執行操作。

### 4. UIModule (使用者介面模組)
- **職責**: 管理遊戲的 Web 介面渲染和使用者互動。包括顯示對話框、角色立繪、背景圖片、選項按鈕等，並處理使用者的點擊和鍵盤輸入。
- **流程**:
    - **初始化**: 綁定 `keydown` 和 `click` 等事件監聽器。
    - **對話顯示**: 接收 `ScriptEngine` 傳來的對話內容並以打字機效果顯示。
    - **使用者輸入**: 監聽全螢幕點擊和空白鍵事件。當文字正在打字時，空白鍵會加速完成打字效果；文字顯示完畢後，空白鍵或點擊會觸發 `GameKernel.onUserClick()`，通知引擎推進到下一個腳本指令。
    - **特殊情境**: 對於輸入框 (`INPUT`, `TEXTAREA`) 或編輯器 (`.script-editor`)，空白鍵的預設行為（輸入空格）會被保留，避免干擾文字輸入。

### 5. AssetManager (資源管理器)
- **職責**: 負責遊戲所需資源（如圖片、音訊）的預載和管理。也控制遊戲中背景層和角色層的顯示，並處理平滑的過渡效果（如 CSS Opacity 動畫）。
- **流程**: 在遊戲啟動或特定場景載入時，預載所需資源。當 `ScriptEngine` 執行 `BG` 或 `SPRITE` 指令時，`AssetManager` 會負責加載並顯示對應的圖片。

### 6. AudioManager (音訊管理器)
- **職責**: 管理遊戲中的背景音樂 (BGM) 和音效 (SFX) 的播放。
- **流程**: `ScriptEngine` 執行 `BGM_PLAY`、`SFX_PLAY`、`BGM_FADE_OUT` 等指令時，`AudioManager` 會根據指令播放、停止或淡入淡出音訊。

### 7. CharacterModule (角色模組)
- **職責**: 專門管理遊戲中角色立繪的顯示、隱藏和位置變更。
- **流程**: `ScriptEngine` 執行 `CHARA` 指令時，`CharacterModule` 會根據指令在指定位置（左、中、右）顯示、替換或隱藏角色立繪。

## 遊戲核心流程

1.  **初始化**: `GameKernel` 啟動，初始化所有註冊的模組 (`StateManager`, `ScriptEngine`, `UIModule`, `AssetManager`, `AudioManager`, `CharacterModule` 等)。
2.  **載入腳本**: `ScriptEngine` 載入初始腳本（或主腳本）。
3.  **指令執行循環**:
    *   `ScriptEngine` 讀取並解析當前腳本的下一行指令。
    *   根據指令類型，`ScriptEngine` 調用相應的模組來執行操作：
        *   `SAY` -> `UIModule` 顯示對話。
        *   `BG` -> `AssetManager` 載入並顯示背景。
        *   `CHARA` / `SPRITE` -> `CharacterModule` / `AssetManager` 顯示或隱藏立繪。
        *   `SET` / `IF` -> `StateManager` 更新或查詢遊戲狀態。
        *   `BGM_PLAY` / `SFX_PLAY` -> `AudioManager` 播放音訊。
    *   若指令是需要使用者互動的（如 `SAY` 或 `CHOICE`），則遊戲會暫停，等待使用者輸入。
4.  **使用者互動**:
    *   使用者點擊螢幕或按下空白鍵。
    *   `UIModule` 捕獲此事件，並根據當前狀態（打字中、打字結束、選項模式）進行處理。
    *   如果文字已顯示完畢，`UIModule` 會通知 `GameKernel`，`GameKernel` 繼而通知 `ScriptEngine` 繼續執行下一個指令。
5.  **遊戲循環**: 這個指令執行和使用者互動的循環會一直持續，直到腳本結束或遇到特殊的遊戲結束指令。
6.  **選項處理**: 當遇到 `CHOICE` 指令時，`UIModule` 會渲染選項按鈕。使用者選擇後，`ScriptEngine` 會跳轉到對應 `LABEL` 的腳本行。

## 檔案結構概覽

-   `src/core/`: 包含 `GameKernel.ts`, `StateManager.ts` 以及通用介面 `IGameModule.ts`。
-   `src/modules/`: 包含各個功能模組的實現，如 `ScriptEngine.ts`, `UIModule.ts`, `AssetManager.ts`, `AudioManager.ts`, `CharacterModule.ts`。
-   `tests/`: 包含使用 Jest 編寫的單元測試文件。
-   `script_editor.html`: 提供一個網頁版的腳本編輯器，用於實時管理、編輯和預覽腳本。
-   `index.html`: 遊戲的 Web 入口點。
-   `assets/`: 存放遊戲的圖像、音效、音樂等資源文件。
-   `DefineDocument/`: 存放各種設計和架構文檔。

這個架構設計旨在提供清晰的職責分離和模組化，使得遊戲邏輯、UI 和資源管理可以獨立開發和維護，同時通過 `GameKernel` 進行有效協調。

## 相關程式框架與技術棧

此專案主要使用以下程式框架與技術：

-   **語言**: TypeScript (JavaScript 的超集，提供靜態類型檢查，增強程式碼可維護性與可靠性)。
-   **運行環境**: Node.js (用於開發依賴管理、建置工具運行，以及潛在的後端服務擴展)。
-   **建置工具/開發伺服器**: Vite (現代化的前端建置工具，提供快速的開發伺服器和優化的打包體驗)。
-   **測試框架**: Jest (強大的 JavaScript 測試框架，用於單元測試和整合測試)。
-   **前端技術**: 香草 JavaScript (Vanilla JavaScript)、HTML5、CSS3 (專案的 UI 層主要基於原生的 Web 技術實現，注重模組化和組件化設計)。

## 學習路線說明

若要深入理解與貢獻此專案，建議遵循以下學習路線：

1.  **TypeScript 基礎**: 熟悉 TypeScript 的語法、類型系統、介面 (Interface)、類別 (Class) 等核心概念。這對於理解專案中大量的 `.ts` 檔案至關重要。
2.  **Node.js 與 npm/pnpm 基礎**: 理解 Node.js 的運行機制和 npm (或 pnpm) 包管理工具的使用，包括依賴安裝、腳本運行等。
3.  **Vite 使用**: 了解 Vite 的配置和工作原理，如何在開發環境中運行專案、處理靜態資源等。
4.  **Web 前端基礎**: 紮實的 HTML5、CSS3 和香草 JavaScript 知識是理解 UI 渲染和互動邏輯的基礎。特別是 DOM 操作、事件處理、非同步編程 (async/await)。
5.  **模組化開發思維**: 專案採用了模組化設計，理解如何組織程式碼、導入導出模組 (ES Modules) 有助於快速定位功能。
6.  **Jest 測試**: 學習如何閱讀和編寫 Jest 測試，這能幫助你理解各模組的預期行為和進行功能驗證。
7.  **專案核心模組學習**:
    *   **`GameKernel` 與 `IGameModule`**: 理解整個引擎的啟動、模組註冊和生命週期管理。
    *   **`ScriptEngine`**: 深入研究腳本解析邏輯、指令執行流程以及如何擴展新的腳本指令。
    *   **`UIModule`**: 分析 UI 渲染機制、使用者輸入處理和動畫效果的實現。
    *   **`StateManager`**: 了解遊戲數據的儲存、讀取和狀態變更的實現方式。
    *   **`AssetManager`, `AudioManager`, `CharacterModule`**: 學習資源載入、音訊控制和角色立繪管理的具體實現。
8.  **AVG 遊戲設計模式**: 了解冒險遊戲的常見設計模式，例如對話流程、選項分支、狀態管理等，將有助於從更高層次理解專案的設計理念。

通過以上步驟，你將能夠全面掌握此 AVG 引擎的運作原理，並有效地進行開發和功能擴展。
