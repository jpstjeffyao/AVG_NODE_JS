# 系統架構定義 (System Architecture)
## 1. 設計哲學
- **核心模式**：Service Locator Pattern + Dependency Injection (DI)。
- **錯誤隔離**：所有模組必須被 Try-Catch 包裹在 Kernel 的 Update 循環中。
- **數據流向**：單向數據流 (Data -> State -> Presenter -> View)。

## 2. 專案目錄結構 (Folder Structure)
/Scripts
  /Core           # 核心引擎 (GameKernel, Interfaces, EventBus)
  /Modules        # 具體功能模組
    /UI           # 負責畫面顯示
    /ScriptEngine # 負責解析劇本
    /State        # 負責數據變數與存檔
    /Resources    # 負責載入 Asset
    /Audio        # 負責聲音
  /Data           # 定義數據結構 (DTOs)
  /Scenes         # Unity 場景 (Boot, Title, Gameplay)

## 3. 核心介面 (Core Interfaces)
所有模組必須實作此介面：
```csharp
public interface IGameModule {
    string ModuleName { get; }
    void Initialize();  // 初始化
    void OnUpdate();    // 每幀執行
    void Shutdown();    // 清理資源
}