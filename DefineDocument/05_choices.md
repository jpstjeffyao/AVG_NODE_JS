# 選項系統設計 (Choice System)

## 1. 系統概述

**選項系統** 是 AVG 遊戲的核心互動機制，允許玩家在劇情分支點做出選擇，影響故事走向。

**核心功能**：
- 顯示多個選項按鈕
- 捕獲玩家選擇
- 根據選擇跳轉至對應劇情分支
- 自動狀態管理（等待選擇 → 繼續執行）

## 2. 腳本指令

### 2.1 基本語法

**格式**：`CHOICE|選項文字1:標籤1|選項文字2:標籤2|...`

**參數說明**：
- 使用 `|` 分隔不同選項
- 每個選項格式為 `文字:標籤`
  - `文字`：按鈕上顯示的文字
  - `標籤`：選擇後跳轉的目標 LABEL

**範例**：
```
CHOICE|左邊:left_path|右邊:right_path
CHOICE|接受任務:accept|拒絕任務:reject|詢問詳情:ask_more
```

### 2.2 完整範例腳本

```
SAY|Hero|我們應該往哪邊走？
CHOICE|左邊的森林:left_path|右邊的城鎮:right_path

LABEL|left_path
BG|bg_forest
SAY|Hero|我們選擇了左邊的森林。
SAY|旁白|森林中傳來奇怪的聲音...
GOTO|end

LABEL|right_path
BG|bg_town
SAY|Hero|我們選擇了右邊的城鎮。
SAY|旁白|城鎮裡人來人往，十分熱鬧。
GOTO|end

LABEL|end
SAY|Hero|冒險繼續...
```

## 3. 技術實作

### 3.1 ScriptEngine 解析

**執行流程**：

```typescript
case 'CHOICE': {
    // 1. 解析選項
    const choices: string[] = [];
    const labels: string[] = [];
    
    for (let i = 1; i < parts.length; i++) {
        const [choiceText, targetLabel] = parts[i].split(':');
        choices.push(choiceText.trim());
        labels.push(targetLabel.trim());
    }
    
    // 2. 設定狀態為等待選擇
    this.stateManager.setState(GameState.STATE_WAIT_CHOICE);
    
    // 3. 顯示選項按鈕
    uiModule.showChoices(choices);
    
    // 4. 綁定選擇事件
    const handleChoice = (event: any) => {
        const index = parseInt(event.target.dataset.index);
        const targetLabel = labels[index];
        
        // 跳轉至對應標籤
        this.gotoLabel(targetLabel);
        
        // 恢復遊戲狀態
        this.stateManager.setState(GameState.STATE_PLAYING);
        
        // 隱藏選項容器
        uiModule.choicesContainer.classList.add('hidden');
        
        // 移除事件監聽器
        uiModule.choicesContainer.removeEventListener('click', handleChoice);
    };
    
    // 綁定事件
    uiModule.choicesContainer.addEventListener('click', handleChoice);
    
    break;
}
```

### 3.2 UIModule 顯示

**方法**：`UIModule.showChoices(choices: string[])`

```typescript
showChoices(choices: string[]): void {
    // 1. 顯示選項容器
    this.choicesContainer.classList.remove('hidden');
    
    // 2. 清空舊選項
    this.choicesContainer.innerHTML = '';
    
    // 3. 生成按鈕
    choices.forEach((choiceText, index) => {
        const button = document.createElement('button');
        button.textContent = choiceText;
        button.className = 'choice-button';
        button.dataset.index = index.toString();
        this.choicesContainer.appendChild(button);
    });
}
```

### 3.3 CSS 樣式

**推薦樣式**：

```css
#choices-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    gap: 15px;
    z-index: 15;
}

.choice-button {
    padding: 15px 30px;
    font-size: 18px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border: 2px solid #fff;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    min-width: 300px;
}

.choice-button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
}
```

## 4. 狀態管理

### 4.1 遊戲狀態轉換

```
STATE_PLAYING (劇情進行中)
    ↓
[遇到 CHOICE 指令]
    ↓
STATE_WAIT_CHOICE (等待玩家選擇)
    ↓
[玩家點擊選項]
    ↓
gotoLabel(targetLabel) (跳轉至對應分支)
    ↓
STATE_PLAYING (繼續執行)
```

### 4.2 狀態檢查

在 `GameKernel.onUserClick()` 中：

```typescript
if (this.stateManager.getState() === GameState.STATE_WAIT_CHOICE) {
    return; // 等待選擇中，忽略點擊事件
}
```

**目的**：防止玩家在選擇期間誤觸推進劇情。

## 5. 標籤與跳轉系統

### 5.1 LABEL 指令

**語法**：`LABEL|標籤名稱`

**功能**：標記腳本中的位置，供 GOTO 和 CHOICE 跳轉使用。

**範例**：
```
LABEL|accept_quest
SAY|村長|太好了！
```

### 5.2 GOTO 指令

**語法**：`GOTO|標籤名稱`

**功能**：直接跳轉至指定標籤。

**範例**：
```
GOTO|ending
```

### 5.3 標籤掃描

ScriptEngine 在載入腳本時會掃描所有 LABEL 並記錄位置：

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

### 5.4 跳轉執行

```typescript
gotoLabel(labelName: string): void {
    if (this.labels.has(labelName)) {
        this.currentLineIndex = this.labels.get(labelName)!;
    } else {
        console.error(`Label not found: ${labelName}`);
    }
}
```

## 6. 進階應用

### 6.1 結合變數系統

選項可以設定變數，影響後續劇情判斷：

```
CHOICE|幫助村民:help|繼續旅程:leave

LABEL|help
SET|karma|1
SAY|村長|你真是個好人！
GOTO|after_choice

LABEL|leave
SET|karma|0
SAY|村長|...真遺憾。

LABEL|after_choice
IF|karma|1|GOTO|good_ending
SAY|旁白|普通結局
GOTO|end

LABEL|good_ending
SAY|旁白|好結局！

LABEL|end
```

### 6.2 嵌套選項（不推薦）

技術上可行，但會導致邏輯複雜，建議使用 LABEL 和 GOTO 替代：

**不推薦**：
```
CHOICE|A:path_a|B:path_b
LABEL|path_a
CHOICE|A1:path_a1|A2:path_a2  # 嵌套選項
```

**推薦**：
```
CHOICE|A:path_a|B:path_b

LABEL|path_a
SAY|旁白|你選擇了 A，現在又有新的選擇...
CHOICE|A1:path_a1|A2:path_a2

LABEL|path_a1
SAY|旁白|A1 路線
GOTO|end

LABEL|path_a2
SAY|旁白|A2 路線
GOTO|end
```

### 6.3 選項數量限制

**推薦**：2-4 個選項（最佳使用者體驗）
**最大**：6 個選項（螢幕空間限制）

若需要更多選項，建議分階段顯示。

## 7. 事件處理細節

### 7.1 事件委派

使用事件委派模式避免為每個按鈕綁定事件：

```typescript
uiModule.choicesContainer.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('choice-button')) {
        const index = parseInt(target.dataset.index!);
        // 處理選擇
    }
});
```

### 7.2 事件清理

選擇完成後必須移除監聽器，避免記憶體洩漏：

```typescript
uiModule.choicesContainer.removeEventListener('click', handleChoice);
```

### 7.3 防止重複點擊

```typescript
let choiceSelected = false;

const handleChoice = (event: any) => {
    if (choiceSelected) return;
    choiceSelected = true;
    
    // ...處理選擇
};
```

## 8. 除錯與測試

### 8.1 常見錯誤

**錯誤 1**：標籤不存在
```
CHOICE|選項A:wrong_label  # 標籤名稱拼寫錯誤
```
**解決方案**：檢查 Console 錯誤訊息，確認標籤名稱正確。

**錯誤 2**：選項格式錯誤
```
CHOICE|選項A:label1,選項B:label2  # 應使用 | 而非 ,
```
**解決方案**：使用 `|` 分隔選項。

**錯誤 3**：忘記設定標籤
```
CHOICE|選項A:label1|選項B:label2
# 缺少 LABEL|label1 和 LABEL|label2
```
**解決方案**：確保所有引用的標籤都有定義。

### 8.2 測試建議

1. **測試所有分支**：確保每個選項都能正常跳轉
2. **測試變數影響**：確認選項設定的變數能正確影響後續劇情
3. **測試邊界情況**：
   - 只有 1 個選項（雖然不推薦）
   - 超過 6 個選項
   - 選項文字過長

## 9. 最佳實踐

### 9.1 命名規範

**標籤命名**：
- 使用描述性名稱：`accept_quest`、`good_ending`
- 避免數字編號：`choice1`、`choice2`（不易維護）
- 使用底線分隔：`forest_path`（而非 `forestPath`）

### 9.2 腳本組織

**建議結構**：
```
# 主劇情
SAY|...
CHOICE|...|...

# 分支 1
LABEL|branch1
...
GOTO|merge_point

# 分支 2
LABEL|branch2
...
GOTO|merge_point

# 匯合點
LABEL|merge_point
SAY|繼續主線...
```

### 9.3 使用者體驗

- **選項文字簡潔明確**：避免過長描述
- **選項數量適中**：2-4 個最佳
- **提供「返回」選項**（如適用）
- **避免過於頻繁的選項**：保持劇情流暢

## 10. 參考文件

- [系統架構](./00_Architecture.md)
- [腳本引擎](./03_ScriptEngine.md)
- [UI 系統](./02_UI_System.md)
- [狀態管理](./08_StateManager.md)
- [腳本格式說明](../scriptFormat.md)