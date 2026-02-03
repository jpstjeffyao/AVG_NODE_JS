# 狀態管理系統 (State Manager)

## 1. 系統概述

**StateManager** 是遊戲的數據中樞，負責管理遊戲狀態、變數儲存、旗標系統等核心數據。

**核心職責**：
- 遊戲狀態管理（TITLE, PLAYING, WAIT_CHOICE 等）
- 全域變數儲存與讀取
- 旗標系統（用於劇情分支判定）
- 狀態持久化（未來擴展：存檔/讀檔）

## 2. 遊戲狀態 (Game State)

### 2.1 狀態定義

```typescript
export enum GameState {
    STATE_TITLE = 0,              // 主選單畫面
    STATE_PLAYING = 1,            // 遊戲進行中
    STATE_WAIT_CHOICE = 2,        // 等待玩家選擇
    STATE_WAIT_END_INTERACTION = 3, // 等待結束互動（腳本執行完畢）
    STATE_FADING_OUT = 4          // 淡出動畫進行中
}
```

### 2.2 狀態說明

| 狀態 | 數值 | 說明 | 允許的操作 |
|------|------|------|-----------|
| `STATE_TITLE` | 0 | 主選單 | 點擊選單按鈕 |
| `STATE_PLAYING` | 1 | 劇情進行 | 點擊推進劇情 |
| `STATE_WAIT_CHOICE` | 2 | 等待選擇 | 點擊選項按鈕 |
| `STATE_WAIT_END_INTERACTION` | 3 | 等待互動結束 | 點擊觸發淡出 |
| `STATE_FADING_OUT` | 4 | 淡出中 | 無（忽略輸入） |

### 2.3 狀態轉換

```
STATE_TITLE (啟動時)
    ↓ (點擊「開始遊戲」)
STATE_PLAYING (執行腳本)
    ↓ (遇到 CHOICE 指令)
STATE_WAIT_CHOICE (顯示選項)
    ↓ (點擊選項)
STATE_PLAYING (繼續執行)
    ↓ (腳本執行完畢)
STATE_WAIT_END_INTERACTION
    ↓ (點擊畫面)
STATE_FADING_OUT (淡出動畫)
    ↓ (動畫完成)
[觸發 avg_fade_complete 事件]
```

### 2.4 實作

```typescript
export class StateManager implements IGameModule {
    public moduleName = "StateManager";
    private currentState: GameState = GameState.STATE_TITLE;
    
    // 設定狀態
    setState(state: GameState): void {
        console.log(`[StateManager] State change: ${this.currentState} → ${state}`);
        this.currentState = state;
    }
    
    // 取得當前狀態
    getState(): GameState {
        return this.currentState;
    }
}
```

## 3. 變數系統

### 3.1 變數儲存

**資料結構**：`Map<string, number>`

```typescript
private variables: Map<string, number> = new Map();
```

**設計理念**：
- 使用 Map 提供 O(1) 查詢效能
- 只支援數值型變數（簡化設計）
- 變數名稱不區分大小寫（建議使用小寫）

### 3.2 設定變數

**方法**：`setVariable(name: string, value: number)`

```typescript
setVariable(name: string, value: number): void {
    this.variables.set(name, value);
    console.log(`[StateManager] Set variable: ${name} = ${value}`);
}
```

**腳本指令**：`SET|變數名稱|數值`

**範例**：
```
SET|affection|50
SET|chapter|1
SET|karma|0
```

### 3.3 取得變數

**方法**：`getVariable(name: string): number`

```typescript
getVariable(name: string): number {
    return this.variables.get(name) || 0; // 預設值為 0
}
```

**使用情境**：
```typescript
// 在 ScriptEngine 中使用
const affection = this.stateManager.getVariable('affection');
if (affection >= 50) {
    // 好感度足夠，觸發特殊劇情
}
```

### 3.4 變數應用範例

#### 好感度系統

```
# 初始化好感度
SET|affection|0

# 玩家選擇影響好感度
CHOICE|送禮物:give_gift|聊天:chat

LABEL|give_gift
SET|affection|50
SAY|Hero|她看起來很開心！
GOTO|check

LABEL|chat
SET|affection|20
SAY|Hero|聊了一會兒。

LABEL|check
IF|affection|50|GOTO|good_ending
SAY|Hero|普通結局
```

#### 章節進度

```
SET|chapter|1

# ...第一章劇情...

SET|chapter|2
CALL_SCRIPT|Chapter02
```

#### 旗標系統

```
SET|has_key|0

# 玩家獲得鑰匙
SET|has_key|1

# 檢查是否擁有鑰匙
IF|has_key|1|GOTO|unlock_door
SAY|Hero|門鎖著，我需要鑰匙。
```

## 4. 旗標系統（擴展功能）

### 4.1 布林旗標

**實作方式**：使用變數系統，0 = false, 1 = true

```
# 設定旗標
SET|quest_completed|1

# 檢查旗標
IF|quest_completed|1|GOTO|reward
```

### 4.2 旗標管理（可選實作）

```typescript
// 專用的旗標方法
setFlag(name: string, value: boolean): void {
    this.variables.set(name, value ? 1 : 0);
}

getFlag(name: string): boolean {
    return (this.variables.get(name) || 0) === 1;
}
```

**使用**：
```typescript
stateManager.setFlag('dungeon_cleared', true);
if (stateManager.getFlag('dungeon_cleared')) {
    // 地下城已清理
}
```

## 5. 變數列表管理

### 5.1 取得所有變數

```typescript
getAllVariables(): Map<string, number> {
    return new Map(this.variables); // 返回副本，避免外部修改
}
```

### 5.2 清除變數

```typescript
clearVariables(): void {
    this.variables.clear();
    console.log('[StateManager] All variables cleared');
}
```

**使用情境**：
- 開始新遊戲時重置所有變數
- 測試腳本時清除舊數據

### 5.3 重置特定變數

```typescript
resetVariable(name: string): void {
    this.variables.delete(name);
}
```

## 6. 存檔系統（未完整實作）

### 6.1 儲存遊戲狀態

```typescript
saveGame(slotName: string): void {
    const saveData = {
        state: this.currentState,
        variables: Array.from(this.variables.entries()),
        timestamp: Date.now()
    };
    
    localStorage.setItem(`savegame_${slotName}`, JSON.stringify(saveData));
    console.log(`[StateManager] Game saved to slot: ${slotName}`);
}
```

### 6.2 讀取遊戲狀態

```typescript
loadGame(slotName: string): boolean {
    const saveDataStr = localStorage.getItem(`savegame_${slotName}`);
    if (!saveDataStr) {
        console.error(`[StateManager] Save slot not found: ${slotName}`);
        return false;
    }
    
    try {
        const saveData = JSON.parse(saveDataStr);
        this.currentState = saveData.state;
        this.variables = new Map(saveData.variables);
        console.log(`[StateManager] Game loaded from slot: ${slotName}`);
        return true;
    } catch (error) {
        console.error('[StateManager] Failed to load save:', error);
        return false;
    }
}
```

### 6.3 存檔數據結構

```typescript
interface SaveData {
    state: GameState;                  // 遊戲狀態
    variables: [string, number][];     // 變數列表
    timestamp: number;                 // 儲存時間
    // 未來可擴展：
    // scriptName?: string;            // 當前腳本名稱
    // lineIndex?: number;             // 當前執行行號
}
```

## 7. 與其他模組整合

### 7.1 ScriptEngine

**SET 指令**：
```typescript
case 'SET':
    const [varName, value] = parts.slice(1);
    this.stateManager.setVariable(varName, parseInt(value));
    break;
```

**IF 指令**：
```typescript
case 'IF':
    const [varName, value, gotoKeyword, label] = parts.slice(1);
    const currentValue = this.stateManager.getVariable(varName);
    
    if (currentValue === parseInt(value)) {
        this.gotoLabel(label);
    }
    break;
```

### 7.2 GameKernel

**狀態檢查**：
```typescript
async onUserClick(): Promise<void> {
    const state = this.stateManager.getState();
    
    if (state === GameState.STATE_TITLE) {
        return; // 選單狀態，忽略點擊
    }
    
    if (state === GameState.STATE_WAIT_CHOICE) {
        return; // 等待選擇，忽略點擊
    }
    
    // ...處理點擊
}
```

### 7.3 UIModule

**顯示狀態同步**：
```typescript
showMenu(): void {
    this.kernel.stateManager.setState(GameState.STATE_TITLE);
    // ...顯示選單
}

onNewGameClick(): void {
    this.kernel.stateManager.setState(GameState.STATE_PLAYING);
    // ...開始遊戲
}
```

## 8. 除錯工具

### 8.1 變數監控

```typescript
printVariables(): void {
    console.log('[StateManager] Current variables:');
    this.variables.forEach((value, name) => {
        console.log(`  ${name} = ${value}`);
    });
}
```

**使用**：
```typescript
// 在開發者工具中
(window as any).kernel.stateManager.printVariables();
```

### 8.2 狀態日誌

```typescript
setState(state: GameState): void {
    const stateNames = [
        'STATE_TITLE',
        'STATE_PLAYING',
        'STATE_WAIT_CHOICE',
        'STATE_WAIT_END_INTERACTION',
        'STATE_FADING_OUT'
    ];
    
    console.log(`[StateManager] ${stateNames[this.currentState]} → ${stateNames[state]}`);
    this.currentState = state;
}
```

## 9. 最佳實踐

### 9.1 變數命名規範

**推薦**：
- 使用小寫和底線：`affection`、`chapter_progress`
- 描述性名稱：`has_sword`（而非 `flag1`）
- 分類前綴：`quest_forest_completed`、`char_hero_level`

**不推薦**：
- 大小寫混合：`AfFeCtiOn`
- 無意義名稱：`var1`、`temp`
- 過長名稱：`the_total_number_of_items_collected`

### 9.2 變數初始化

**建議在腳本開頭初始化關鍵變數**：
```
# ====== 變數初始化 ======
SET|affection|0
SET|chapter|1
SET|karma|0

# ====== 劇情開始 ======
SAY|Hero|冒險開始了！
```

### 9.3 避免魔術數字

**不推薦**：
```
IF|affection|50|GOTO|good_ending
```

**推薦**（在腳本或文件中註解）：
```
# affection >= 50: 好結局
# affection >= 30: 普通結局
# affection <  30: 壞結局
IF|affection|50|GOTO|good_ending
IF|affection|30|GOTO|normal_ending
GOTO|bad_ending
```

## 10. 效能考量

### 10.1 變數數量

- **輕量使用**：< 50 個變數（推薦）
- **中度使用**：50-200 個變數
- **重度使用**：> 200 個變數（可能需要優化）

**Map 的查詢性能**：O(1)，即使數百個變數也不影響效能

### 10.2 記憶體使用

每個變數約佔用：
- 變數名稱：~20 bytes（字串）
- 數值：8 bytes（number）
- Map 額外開銷：~16 bytes

**總計**：100 個變數 ≈ 4.4 KB（極小）

## 11. 擴展性

### 11.1 支援字串變數（未實作）

```typescript
private stringVariables: Map<string, string> = new Map();

setStringVariable(name: string, value: string): void {
    this.stringVariables.set(name, value);
}

getStringVariable(name: string): string {
    return this.stringVariables.get(name) || '';
}
```

### 11.2 變數監聽器（未實作）

```typescript
onVariableChange(name: string, callback: (value: number) => void): void {
    // 當變數改變時觸發回調
}
```

**應用**：
- UI 即時更新（血量、金錢）
- 成就系統觸發器

### 11.3 全域事件系統（未實作）

```typescript
emit(eventName: string, data?: any): void {
    // 發送全域事件
}

on(eventName: string, callback: Function): void {
    // 監聽全域事件
}
```

## 12. 參考文件

- [系統架構](./00_Architecture.md)
- [腳本引擎](./03_ScriptEngine.md)
- [主流程與進入點](./01_MainFlow_Entry.md)
- [選項系統](./05_choices.md)
- [腳本格式說明](../scriptFormat.md)
