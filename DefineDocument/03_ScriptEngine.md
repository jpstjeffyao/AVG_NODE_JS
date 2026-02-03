# 腳本引擎系統 (Script Engine)

## 1. 系統概述

**ScriptEngine** 是 AVG 引擎的核心模組，負責解析腳本語法、執行遊戲指令，並協調其他模組完成遊戲邏輯。

**核心職責**：
- 腳本載入與解析
- 指令逐行執行
- 標籤系統管理（LABEL/GOTO）
- 條件判斷（IF）與變數控制（SET）
- 非同步指令處理（資源載入、影片播放）
- 與其他模組的協調（UIModule、AudioManager、AssetManager 等）

## 2. 腳本格式

### 2.1 基本語法

**分隔符**：使用管道符 `|` 分隔指令與參數

**格式**：`指令|參數1|參數2|...`

**註解**：以 `#` 開頭的行會被忽略

**範例**：
```
# 這是註解
SAY|Hero|你好！
BG|bg_room
CHOICE|選項A:label_a|選項B:label_b
```

### 2.2 大小寫不敏感

所有指令關鍵字不區分大小寫：

```
SAY|Hero|對話    # 正確
say|Hero|對話    # 正確
Say|Hero|對話    # 正確
```

## 3. 支援的指令清單

### 3.1 對話與文字

| 指令 | 語法 | 說明 |
|------|------|------|
| `SAY` | `SAY\|角色名稱\|對話內容` | 顯示角色對話 |

**範例**：
```
SAY|Hero|今天天氣真好！
SAY|系統|遊戲已儲存。
```

### 3.2 場景與視覺

| 指令 | 語法 | 說明 |
|------|------|------|
| `BG` | `BG\|背景名稱\|震動強度(可選)` | 切換背景圖片 |
| `CHARA` | `CHARA\|SHOW\|角色ID\|位置` | 顯示角色立繪 |
| | `CHARA\|HIDE\|位置` | 隱藏指定位置立繪 |
| | `CHARA\|CLEAR` | 清除所有立繪 |
| `MV` | `MV\|影片路徑\|音量(可選)` | 播放全螢幕影片 |

**範例**：
```
BG|bg_forest|0.5
CHARA|SHOW|hero_happy|center
CHARA|HIDE|left
CHARA|CLEAR
MV|assets/mov/opening.mp4|0.8
```

### 3.3 音訊控制

| 指令 | 語法 | 說明 |
|------|------|------|
| `BGM_PLAY` | `BGM_PLAY\|檔案名稱\|音量\|循環` | 播放背景音樂 |
| `BGM_STOP` | `BGM_STOP` | 停止背景音樂 |
| `BGM_FADE_OUT` | `BGM_FADE_OUT\|秒數` | 背景音樂淡出 |
| `BGM_FADE_IN` | `BGM_FADE_IN\|秒數\|檔案\|音量\|循環` | 背景音樂淡入 |
| `SFX_PLAY` | `SFX_PLAY\|檔案名稱\|音量` | 播放音效 |

**範例**：
```
BGM_PLAY|FairyTale.mp3|0.7|true
BGM_FADE_OUT|5
SFX_PLAY|door_open.wav|0.8
```

### 3.4 邏輯控制

| 指令 | 語法 | 說明 |
|------|------|------|
| `SET` | `SET\|變數名稱\|數值` | 設定變數 |
| `IF` | `IF\|變數名稱\|數值\|GOTO\|標籤` | 條件判斷與跳轉 |
| `LABEL` | `LABEL\|標籤名稱` | 定義標籤 |
| `GOTO` | `GOTO\|標籤名稱` | 跳轉至標籤 |
| `CALL_SCRIPT` | `CALL_SCRIPT\|腳本名稱` | 切換至其他腳本 |

**範例**：
```
SET|affection|50
IF|affection|50|GOTO|good_ending
LABEL|good_ending
GOTO|next_chapter
CALL_SCRIPT|Chapter02
```

### 3.5 互動選擇

| 指令 | 語法 | 說明 |
|------|------|------|
| `CHOICE` | `CHOICE\|文字1:標籤1\|文字2:標籤2\|...` | 顯示選項 |

**範例**：
```
CHOICE|接受任務:accept|拒絕任務:reject
```

## 4. 執行流程

### 4.1 腳本載入

```typescript
loadScript(lines: string[]): void {
    // 1. 儲存腳本行
    this.scriptLines = lines;
    
    // 2. 重置執行狀態
    this.currentLineIndex = 0;
    
    // 3. 掃描所有標籤
    this.scanLabels();
}
```

### 4.2 標籤掃描

在載入腳本時，預先掃描所有 `LABEL` 並記錄行號：

```typescript
scanLabels(): void {
    this.labels.clear();
    
    for (let i = 0; i < this.scriptLines.length; i++) {
        const line = this.scriptLines[i].trim();
        if (line.toUpperCase().startsWith('LABEL|')) {
            const labelName = line.split('|')[1].trim();
            this.labels.set(labelName, i);
        }
    }
}
```

**儲存結構**：`Map<string, number>` (標籤名 → 行號)

### 4.3 逐行執行

**主方法**：`next()`

```typescript
async next(): Promise<void> {
    // 1. 檢查是否還有指令
    if (this.currentLineIndex >= this.scriptLines.length) {
        console.log("[ScriptEngine] Script finished.");
        return;
    }
    
    // 2. 取得當前行
    const line = this.scriptLines[this.currentLineIndex].trim();
    
    // 3. 跳過空行與註解
    if (line.length === 0 || line.startsWith('#')) {
        this.currentLineIndex++;
        return this.next(); // 遞迴執行下一行
    }
    
    // 4. 執行指令
    await this.executeLine(line);
    
    // 5. 移至下一行（如非阻塞指令）
    if (!this.isBlockingCommand(line)) {
        this.currentLineIndex++;
    }
}
```

### 4.4 指令解析

**主方法**：`executeLine(line: string)`

```typescript
async executeLine(line: string): Promise<void> {
    // 1. 分割指令與參數
    const parts = line.split('|').map(p => p.trim());
    const command = parts[0].toUpperCase();
    
    // 2. 執行對應指令
    switch (command) {
        case 'SAY':
            const [name, text] = parts.slice(1);
            this.kernel.uiModule.renderText(name, text);
            break;
            
        case 'BG':
            const [bgName, shakeStr] = parts.slice(1);
            const shake = shakeStr ? parseFloat(shakeStr) : 0;
            await this.kernel.assetManager.setBackground(bgName, shake);
            break;
            
        case 'CHARA':
            // ...角色立繪邏輯
            break;
            
        case 'CHOICE':
            // ...選項邏輯
            break;
            
        // ...其他指令
        
        default:
            console.warn(`Unknown command: ${command}`);
    }
}
```

## 5. 非同步指令處理

### 5.1 阻塞指令

**定義**：需要等待完成才能繼續的指令（如資源載入、影片播放）

**識別方法**：

```typescript
isBlockingCommand(line: string): boolean {
    const command = line.split('|')[0].toUpperCase();
    return ['SAY', 'CHOICE', 'MV'].includes(command);
}
```

**阻塞指令列表**：
- `SAY`：等待玩家點擊推進
- `CHOICE`：等待玩家選擇
- `MV`：等待影片播放完畢

### 5.2 非阻塞指令

**定義**：可立即執行完成的指令（如設定變數、播放音效）

**範例**：
- `SET`、`GOTO`、`LABEL`
- `BGM_PLAY`、`SFX_PLAY`
- `BG`、`CHARA`

**執行特性**：執行完畢後自動推進至下一行

### 5.3 await 資源載入

所有涉及資源載入的指令都使用 `await` 確保載入完成：

```typescript
case 'BG':
    await this.kernel.assetManager.setBackground(bgName, shake);
    break;

case 'MV':
    await this.kernel.uiModule.playVideo(videoPath, volume);
    break;
```

## 6. 標籤與跳轉系統

### 6.1 標籤定義

**LABEL 指令**：

```typescript
case 'LABEL':
    // 標籤只是標記，不執行任何動作
    break;
```

**設計理念**：LABEL 本身不做任何事，只在掃描階段記錄位置。

### 6.2 無條件跳轉

**GOTO 指令**：

```typescript
case 'GOTO':
    const targetLabel = parts[1];
    this.gotoLabel(targetLabel);
    break;
```

**跳轉方法**：

```typescript
gotoLabel(labelName: string): void {
    if (this.labels.has(labelName)) {
        this.currentLineIndex = this.labels.get(labelName)!;
    } else {
        console.error(`Label not found: ${labelName}`);
    }
}
```

### 6.3 條件跳轉

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

**邏輯**：只有當變數值等於指定值時才跳轉

## 7. 變數系統

### 7.1 SET 指令

```typescript
case 'SET':
    const [varName, value] = parts.slice(1);
    this.stateManager.setVariable(varName, parseInt(value));
    console.log(`[ScriptEngine] Set ${varName} = ${value}`);
    break;
```

### 7.2 變數儲存

變數由 `StateManager` 管理：

```typescript
// StateManager
private variables: Map<string, number> = new Map();

setVariable(name: string, value: number): void {
    this.variables.set(name, value);
}

getVariable(name: string): number {
    return this.variables.get(name) || 0;
}
```

### 7.3 變數應用範例

```
# 好感度系統
SET|affection|0

CHOICE|送禮物:give_gift|聊天:chat

LABEL|give_gift
SET|affection|50
SAY|Hero|她看起來很開心！
GOTO|check_affection

LABEL|chat
SET|affection|20
SAY|Hero|聊了一會兒。

LABEL|check_affection
IF|affection|50|GOTO|good_ending
SAY|Hero|普通結局
GOTO|end

LABEL|good_ending
SAY|Hero|好結局！

LABEL|end
```

## 8. 腳本切換

### 8.1 CALL_SCRIPT 指令

```typescript
case 'CALL_SCRIPT':
    const scriptName = parts[1];
    
    // 從 LocalStorage 載入腳本
    const content = localStorage.getItem(`scripteditor_script_${scriptName}`);
    
    if (content) {
        const lines = content.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0 && !l.startsWith('#'));
        
        this.loadScript(lines);
        await this.next(); // 開始執行新腳本
    } else {
        console.error(`Script not found: ${scriptName}`);
    }
    break;
```

### 8.2 腳本切換應用

**章節切換**：
```
SAY|系統|第一章完結
CALL_SCRIPT|Chapter02
```

**路線分支**：
```
CHOICE|城鎮路線:town|森林路線:forest

LABEL|town
CALL_SCRIPT|Town_Route

LABEL|forest
CALL_SCRIPT|Forest_Route
```

## 9. 與其他模組的整合

### 9.1 UIModule

**呼叫方式**：
```typescript
this.kernel.uiModule.renderText(name, text);
this.kernel.uiModule.showChoices(choices);
await this.kernel.uiModule.playVideo(path, volume);
```

### 9.2 AudioManager

**呼叫方式**：
```typescript
this.kernel.audio.playBGM(file, volume, loop);
this.kernel.audio.fadeOutBGM(duration);
this.kernel.audio.playSFX(file, volume);
```

### 9.3 AssetManager

**呼叫方式**：
```typescript
await this.kernel.assetManager.setBackground(bgName, shake);
```

### 9.4 CharacterModule

**呼叫方式**：
```typescript
await this.kernel.characterModule.showCharacter(charId, position);
this.kernel.characterModule.hideCharacter(position);
this.kernel.characterModule.clearAllCharacters();
```

### 9.5 StateManager

**呼叫方式**：
```typescript
this.stateManager.setVariable(name, value);
this.stateManager.getVariable(name);
this.stateManager.setState(GameState.STATE_PLAYING);
```

## 10. 錯誤處理

### 10.1 未知指令

```typescript
default:
    console.warn(`[ScriptEngine] Unknown command: ${command}`);
    // 不中斷執行，繼續下一行
    break;
```

### 10.2 參數錯誤

```typescript
case 'SAY':
    if (parts.length < 3) {
        console.error(`SAY command requires 2 parameters`);
        break;
    }
    // ...執行
```

### 10.3 標籤不存在

```typescript
gotoLabel(labelName: string): void {
    if (this.labels.has(labelName)) {
        this.currentLineIndex = this.labels.get(labelName)!;
    } else {
        console.error(`[ScriptEngine] Label not found: ${labelName}`);
        // 不跳轉，繼續當前流程
    }
}
```

## 11. 除錯與日誌

### 11.1 執行日誌

```typescript
console.log(`[ScriptEngine] Executing line ${this.currentLineIndex}: ${line}`);
console.log(`[ScriptEngine] Set ${varName} = ${value}`);
console.log(`[ScriptEngine] Jump to label: ${labelName}`);
```

### 11.2 狀態查詢

```typescript
// 查看當前行號
getCurrentLineIndex(): number {
    return this.currentLineIndex;
}

// 查看標籤列表
getLabels(): Map<string, number> {
    return this.labels;
}
```

## 12. 效能優化

### 12.1 標籤預掃描

在載入時預先掃描標籤，避免執行時搜尋。

### 12.2 指令快取（未實作）

可擴展實作指令解析結果快取：

```typescript
private parsedCommands: Map<number, ParsedCommand> = new Map();
```

### 12.3 非同步批次處理

非阻塞指令可批次執行：

```typescript
// 連續執行多個非阻塞指令
while (!this.isBlockingCommand(currentLine)) {
    await this.executeLine(currentLine);
    this.currentLineIndex++;
    currentLine = this.scriptLines[this.currentLineIndex];
}
```

## 13. 擴展性

### 13.1 新增指令

在 `executeLine()` 的 `switch` 中添加新 case：

```typescript
case 'NEW_COMMAND':
    const param = parts[1];
    // 執行邏輯
    break;
```

### 13.2 自訂指令處理器

可實作插件系統：

```typescript
registerCommandHandler(command: string, handler: Function): void {
    this.customHandlers.set(command, handler);
}
```

## 14. 參考文件

- [系統架構](./00_Architecture.md)
- [主流程與進入點](./01_MainFlow_Entry.md)
- [UI 系統](./02_UI_System.md)
- [選項系統](./05_choices.md)
- [狀態管理](./08_StateManager.md)
- [腳本格式說明](../scriptFormat.md)
