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