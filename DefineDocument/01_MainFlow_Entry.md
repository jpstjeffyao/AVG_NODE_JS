# 遊戲主流程與進入點 (Main Flow & Entry Point)

## 1. 進入點 (Entry Point)
- **Class**: `BootLoader.cs`
- **職責**：
    1. 實例化 `GameKernel` (單例)。
    2. 註冊所有模組 (Register Modules)。
    3. 讀取 `GlobalConfig` (User Options)。
    4. 載入完成後，切換至 Title Scene。

## 2. 狀態流程圖 (State Flow)
[Boot Scene] 
   ↓ (Init Modules)
[Title Scene] 
   ├──> [Options Menu] (Overlay)
   ├──> [Gallery/Load]
   ↓ (New Game / Continue)
[Gameplay Scene] (AVG Engine Running)
   ↓ (Game Over / End)
[Title Scene]

## 3. 異常處理 (Global Error Handling)
- Kernel 需訂閱 `AppDomain.CurrentDomain.UnhandledException`。
- 當某模組報錯時，彈出 "System Error" 通用視窗，並嘗試僅重啟該模組，而非閃退。