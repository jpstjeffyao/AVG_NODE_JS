# 角色立繪系統 (Character Module)

## 1. 系統概述

**CharacterModule** 負責管理遊戲中角色立繪的顯示、切換與動畫效果。

**核心職責**：
- 三位置立繪管理（left, center, right）
- 立繪顯示/隱藏/替換
- 資源預載與快取
- 說話者高亮效果

## 2. 資源結構

```
/assets/char
  ├── elizabeth_neutral_L.png    # 伊莉莎白-中性表情-向左
  ├── elizabeth_happy_L.png      # 伊莉莎白-開心表情-向左
  ├── elizabeth_sad_L.png        # 伊莉莎白-難過表情-向左
  ├── Captain_neutral.png        # 隊長-中性表情
  ├── Goblin_neutral.png         # 哥布林-中性表情
  └── ...
```

**命名規範**：
- 格式：`角色名稱_表情_方向.png`
- 範例：`elizabeth_happy_L`（伊莉莎白的開心表情，向左看）
- 方向標記：
  - `_L`：向左看
  - `_R`：向右看
  - 無標記：正面或不特定方向

## 3. CHARA 指令

### 3.1 SHOW - 顯示或替換立繪

**語法**：`CHARA|SHOW|角色ID|位置`

**參數**：
- `角色ID` (string)：角色資源檔名（不含副檔名）
- `位置` (string)：`left`、`center` 或 `right`

**範例**：
```
CHARA|SHOW|elizabeth_neutral_L|left
CHARA|SHOW|Captain_neutral|right
CHARA|SHOW|hero_happy|center
```

**行為**：
- 若該位置已有立繪，則替換為新立繪
- 若該位置為空，則顯示新立繪
- 自動切換動畫（淡入效果）

### 3.2 HIDE - 隱藏指定位置立繪

**語法**：`CHARA|HIDE|位置`

**參數**：
- `位置` (string)：`left`、`center` 或 `right`

**範例**：
```
CHARA|HIDE|left
CHARA|HIDE|center
```

**行為**：
- 隱藏指定位置的立繪（淡出效果）
- 若該位置無立繪，則無動作

### 3.3 CLEAR - 清除所有立繪

**語法**：`CHARA|CLEAR`

**說明**：清除畫面上所有位置的立繪

**範例**：
```
CHARA|CLEAR
```

**使用情境**：
- 場景轉換
- 進入/離開戰鬥
- 回到主選單

## 4. 位置系統

### 4.1 三位置布局

```
畫面布局：
┌─────────────────────────────────┐
│                                 │
│  [左]      [中]       [右]      │
│  left     center     right      │
│                                 │
└─────────────────────────────────┘
```

**CSS 定位**：
```css
#character-layer {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 5;
}

.character-slot {
    position: absolute;
    bottom: 0;
    max-width: 40%;
    max-height: 90%;
}

.character-slot.left {
    left: 5%;
}

.character-slot.center {
    left: 50%;
    transform: translateX(-50%);
}

.character-slot.right {
    right: 5%;
}
```

### 4.2 位置管理

```typescript
export type CharacterPosition = 'left' | 'center' | 'right';

private characterSlots: Map<CharacterPosition, HTMLElement> = new Map();

initialize(): void {
    this.characterSlots.set('left', document.getElementById('char-left')!);
    this.characterSlots.set('center', document.getElementById('char-center')!);
    this.characterSlots.set('right', document.getElementById('char-right')!);
}
```

## 5. 實作細節

### 5.1 顯示立繪

```typescript
async showCharacter(charId: string, position: CharacterPosition): Promise<void> {
    // 1. 預載圖片
    const charPath = `assets/char/${charId}.png`;
    await this.assetManager.preloadImage(charPath);
    
    // 2. 取得目標位置
    const slot = this.characterSlots.get(position);
    if (!slot) return;
    
    // 3. 清空舊立繪（如有）
    slot.innerHTML = '';
    
    // 4. 建立 img 元素
    const img = document.createElement('img');
    img.src = charPath;
    img.className = 'character-sprite';
    img.style.opacity = '0'; // 初始透明
    
    // 5. 插入 DOM
    slot.appendChild(img);
    
    // 6. 淡入動畫
    setTimeout(() => {
        img.style.opacity = '1';
        img.style.transition = 'opacity 0.5s ease-in-out';
    }, 10);
    
    // 7. 記錄當前顯示的角色
    this.currentCharacters.set(position, charId);
}
```

### 5.2 隱藏立繪

```typescript
hideCharacter(position: CharacterPosition): void {
    const slot = this.characterSlots.get(position);
    if (!slot) return;
    
    // 淡出動畫
    const img = slot.querySelector('img');
    if (img) {
        img.style.opacity = '0';
        
        // 動畫結束後移除元素
        setTimeout(() => {
            slot.innerHTML = '';
            this.currentCharacters.delete(position);
        }, 500);
    }
}
```

### 5.3 清除所有立繪

```typescript
clearAllCharacters(): void {
    this.hideCharacter('left');
    this.hideCharacter('center');
    this.hideCharacter('right');
}
```

## 6. 說話者高亮

### 6.1 功能說明

當角色說話時，該角色的立繪會高亮顯示，其他角色變暗，增強視覺焦點。

### 6.2 實作

```typescript
highlightSpeaker(speakerName: string): void {
    // 遍歷所有位置
    this.characterSlots.forEach((slot, position) => {
        const img = slot.querySelector('img');
        if (!img) return;
        
        const charId = this.currentCharacters.get(position);
        
        // 檢查是否為說話者
        if (charId && charId.toLowerCase().includes(speakerName.toLowerCase())) {
            img.style.filter = 'brightness(1.0)'; // 高亮
        } else {
            img.style.filter = 'brightness(0.6)'; // 變暗
        }
    });
}
```

### 6.3 UIModule 整合

```typescript
// UIModule.renderText()
renderText(name: string, content: string): void {
    // ...打字機邏輯
    
    // 觸發角色高亮
    if (name !== '系統' && name !== '旁白') {
        this.kernel.characterModule.highlightSpeaker(name);
    }
}
```

## 7. 資源管理

### 7.1 與 AssetManager 整合

```typescript
constructor(private assetManager: AssetManager) {}

async showCharacter(charId: string, position: CharacterPosition): Promise<void> {
    // 使用 AssetManager 預載圖片
    const charPath = `assets/char/${charId}.png`;
    await this.assetManager.preloadImage(charPath);
    // ...
}
```

### 7.2 批次預載（擴展功能）

```typescript
async preloadCharacters(charIds: string[]): Promise<void> {
    const paths = charIds.map(id => `assets/char/${id}.png`);
    await this.assetManager.preloadBatch(paths);
}
```

**使用範例**：
```typescript
// 在章節開始時預載角色
await characterModule.preloadCharacters([
    'elizabeth_neutral_L',
    'elizabeth_happy_L',
    'Captain_neutral',
    'Goblin_neutral'
]);
```

## 8. ScriptEngine 整合

### 8.1 指令解析

```typescript
// ScriptEngine.executeLine()
case 'CHARA': {
    const subCommand = parts[1].toUpperCase();
    
    if (subCommand === 'SHOW') {
        const [charId, position] = parts.slice(2);
        await this.kernel.characterModule.showCharacter(
            charId, 
            position as CharacterPosition
        );
    } else if (subCommand === 'HIDE') {
        const position = parts[2] as CharacterPosition;
        this.kernel.characterModule.hideCharacter(position);
    } else if (subCommand === 'CLEAR') {
        this.kernel.characterModule.clearAllCharacters();
    }
    
    break;
}
```

## 9. 完整場景範例

```
# 場景：王座室對話
BG|bg_throne_room
BGM_PLAY|royal_theme.mp3|0.6|true

# 顯示伊莉莎白（左側）
CHARA|SHOW|elizabeth_neutral_L|left
SAY|伊莉莎白|今日的王座，依然沉重如往昔。

# 顯示侍衛隊長（右側）
CHARA|SHOW|Captain_neutral|right
SAY|侍衛隊長|陛下，邊境有異常報告。

# 伊莉莎白表情變化（驚訝）
CHARA|SHOW|elizabeth_surprised_L|left
SAY|伊莉莎白|什麼？！

# 清除所有角色，轉場
CHARA|CLEAR
BG|bg_battlefield
```

## 10. 動畫效果

### 10.1 淡入淡出

**實作方式**：CSS transition

```css
.character-sprite {
    transition: opacity 0.5s ease-in-out;
}
```

### 10.2 擴展動畫（未實作）

可添加更多動畫效果：

**滑入效果**：
```css
@keyframes slideIn {
    from { transform: translateX(-100px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
```

**抖動效果**（驚嚇、震驚）：
```css
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}
```

## 11. 錯誤處理

### 11.1 圖片載入失敗

```typescript
await this.assetManager.preloadImage(charPath).catch(err => {
    console.error(`[CharacterModule] Failed to load: ${charId}`, err);
    // 顯示預設圖片或跳過
});
```

### 11.2 無效位置

```typescript
if (!['left', 'center', 'right'].includes(position)) {
    console.error(`[CharacterModule] Invalid position: ${position}`);
    return;
}
```

## 12. 最佳實踐

### 12.1 命名建議

- **表情一致性**：使用統一的表情名稱（neutral, happy, sad, angry, surprised）
- **方向標記**：`_L`（左）、`_R`（右）清晰標示
- **角色名稱**：使用英文或羅馬拼音（避免中文檔名跨平台問題）

### 12.2 資源優化

- **檔案格式**：PNG（支援透明背景）
- **尺寸**：600x1200 推薦（高度優先，自動縮放）
- **壓縮**：使用 TinyPNG 等工具壓縮

### 12.3 腳本組織

**推薦**：
```
# 先顯示角色，再對話
CHARA|SHOW|hero_happy|center
SAY|Hero|我很高興！
```

**不推薦**：
```
# 對話與顯示順序混亂
SAY|Hero|我很高興！
CHARA|SHOW|hero_happy|center  # 應該先顯示
```

## 13. 擴展性

### 13.1 表情快捷切換（未實作）

```typescript
changeExpression(position: CharacterPosition, expression: string): void {
    const currentId = this.currentCharacters.get(position);
    if (!currentId) return;
    
    // 保留角色名稱，只替換表情
    const baseName = currentId.split('_')[0];
    const newId = `${baseName}_${expression}_L`;
    
    this.showCharacter(newId, position);
}
```

**使用**：
```
CHARA|CHANGE_EXPR|left|happy
```

### 13.2 動作指令（未實作）

```typescript
playCharacterAction(position: CharacterPosition, action: string): void {
    // 播放跳躍、揮手等動作動畫
}
```

## 14. 參考文件

- [系統架構](./00_Architecture.md)
- [資源管理](./04_assets.md)
- [腳本引擎](./03_ScriptEngine.md)
- [UI 系統](./02_UI_System.md)
- [腳本格式說明](../scriptFormat.md)
