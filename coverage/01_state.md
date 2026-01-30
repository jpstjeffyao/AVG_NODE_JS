# 模組規格：State Management (數據與狀態管理)

## 1. 功能定義
- **變數追蹤**：存儲遊戲中的數值（如好感度、金錢）。
- **旗標管理**：記錄玩家是否觸發過特定事件（True/False）。
- **快照系統**：能夠將當前所有狀態導出為 JSON 對象，並能從 JSON 還原。

## 2. 內部狀態 (State Variables)
- `_data`: Map<string, number> - 存儲數值型變數。
- `_flags`: Set<string> - 存儲已觸發的旗標。
- `_metadata`: Object - 存儲當前劇本 ID、行號、時間戳。

## 3. 對外介面 (API)
- `setValue(key: string, value: number): void`
- `getValue(key: string): number`
- `setFlag(key: string, active: boolean): void`
- `checkFlag(key: string): boolean`
- `createSnapshot(): Object` (用於存檔)
- `loadSnapshot(data: Object): void` (用於讀檔)

## 4. 測試要點 (Jest Test Cases)
- **獨立性測試**：驗證設定 A 變數不會影響 B 旗標。
- **持久化測試**：驗證 `createSnapshot` 後再 `loadSnapshot`，數據是否完全一致。
- **異常處理**：當讀取不存在的變數時，應回傳預設值 0 而非崩潰。