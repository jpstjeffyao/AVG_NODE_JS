# UI 系統設計文件

## 1. 系統概述

**UIModule** 是遊戲的視覺呈現層，負責所有與使用者互動的介面元素。它管理多個 UI 狀態之間的切換，並提供豐富的視覺效果。

**核心職責**：
- 主選單 (MENU) 的顯示與互動
- 對話視窗的渲染與打字機效果
- 選項按鈕 (CHOICE) 的生成與事件處理
- 全螢幕影片播放 (MV)
- 畫面淡出效果 (FADE_OUT)
- 載入提示 (Loading)

## 2. UI 元素架構

### 2.1 DOM 結構

UIModule 依賴以下 HTML 元素（定義於 `index.html`）：

```
#game-container (遊戲主容器)
├── #menu-screen (主選單畫面)
│   ├── #new-game-button
│   ├── #load-game-button
│   └── #settings-button
├── #dialog-container (對話視窗容器)
│   ├── #character-name (角色名稱框)
│   ├── #dialog-text (對話文字區)
│   └── #continue-icon (繼續提示圖示)
├── #choices-container (選項按鈕容器)
└── #loading-overlay (載入覆蓋層)
```

### 2.2 初始化流程

在 `UIModule.initialize()` 中：

1. **綁定 DOM 元素**：
   ```typescript
   this._container = document.getElementById('game-container');
   this.menuScreen = document.getElementById('menu-screen');
   this.dialogContainer = document.getElementById('dialog-container');
   // ...其他元素
   ```

2. **註冊事件監聽器**：
   - 主選單按鈕點擊事件
   - 全域空白鍵推進事件
   - 點擊對話框推進事件

3. **顯示預設畫面**：
   - 啟動時顯示 MENU，隱藏其他 UI

## 3. 主選單系統 (MENU)

### 3.1 功能說明

主選單是遊戲的入口畫面，當系統狀態為 `STATE_TITLE` 時顯示。

**按鈕功能**：
- **開始遊戲 (New Game)**：隱藏選單，啟動腳本執行
- **繼續遊戲 (Load Game)**：（預留功能，目前顯示提示訊息）
- **系統設定 (Settings)**：（預留功能，目前顯示提示訊息）

### 3.2 實作細節

#### 顯示選單

```typescript
showMenu(): void {
    this.menuScreen.classList.remove('hidden');
    this.hideDialog();
}
```

#### 隱藏選單

```typescript
hideMenu(): void {
    this.menuScreen.classList.add('hidden');
}
```

#### 開始遊戲按鈕

```typescript
onNewGameClick(): void {
    this.hideMenu();
    this.showDialog();
    this.kernel.startGame();
}
```

**流程**：
1. 隱藏選單畫面
2. 顯示對話視窗
3. 呼叫 `GameKernel.startGame()` 啟動腳本

### 3.3 點擊攔截機制

為了防止選單畫面被全域點擊事件觸發遊戲推進，UIModule 使用以下策略：

```typescript
handleDocumentClick(event: MouseEvent): void {
    if (this.kernel.stateManager.getState() === GameState.STATE_TITLE) {
        return; // 選單狀態下忽略全域點擊
    }
    // ...處理遊戲中的點擊
}
```

## 4. 對話系統

### 4.1 打字機效果 (Typewriter Effect)

**設計目的**：逐字顯示對話文字，營造閱讀節奏感。

#### 實作機制

```typescript
renderText(name: string, content: string): void {
    // 1. 設定角色名稱
    this.characterNameElement.textContent = name;
    
    // 2. 清空對話文字
    this.dialogTextElement.textContent = '';
    
    // 3. 啟動打字機效果
    this._typingState = {
        fullText: content,
        currentIndex: 0,
        intervalId: null
    };
    
    this._typingState.intervalId = setInterval(() => {
        // 逐字添加
        this.dialogTextElement.textContent += content[currentIndex];
        currentIndex++;
        
        if (currentIndex >= content.length) {
            clearInterval(this._typingState.intervalId);
            this._typingState.intervalId = null;
        }
    }, 50); // 每 50ms 顯示一個字
}
```

#### 跳過動畫

使用者在打字機效果進行中時點擊，會立即完成文字顯示：

```typescript
completeTyping(): void {
    if (this._typingState.intervalId) {
        clearInterval(this._typingState.intervalId);
        this.dialogTextElement.textContent = this._typingState.fullText;
        this._typingState.intervalId = null;
    }
}
```

#### 狀態檢查

```typescript
isTyping(): boolean {
    return this._typingState.intervalId !== null;
}
```

### 4.2 說話者高亮邏輯

當對話框顯示角色發言時，該角色的立繪會自動高亮（其他角色變暗）。

**實作位置**：`CharacterModule.highlightSpeaker()`

**觸發時機**：`UIModule.renderText()` 呼叫時

```typescript
renderText(name: string, content: string): void {
    // ...打字機邏輯
    
    // 觸發角色高亮
    const characterModule = this.kernel.characterModule;
    if (characterModule && name !== '系統' && name !== '旁白') {
        characterModule.highlightSpeaker(name);
    }
}
```

### 4.3 清除對話框

```typescript
clearDialog(): void {
    this.characterNameElement.textContent = '';
    this.dialogTextElement.textContent = '';
}
```

**使用情境**：
- 切換場景前清除舊內容
- 顯示選項前清除對話

## 5. 選項系統 (CHOICE)

### 5.1 功能說明

選項系統允許玩家在劇情分支處做出選擇，影響後續劇情走向。

**特性**：
- 支援多個選項（2-6 個推薦）
- 按鈕垂直排列於畫面中央
- 點擊選項後觸發跳轉至對應標籤

### 5.2 顯示選項

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

### 5.3 事件處理

選項按鈕的點擊事件在 ScriptEngine 中綁定：

```typescript
// ScriptEngine.executeLine() 中的 CHOICE 指令
const handleChoice = (event: any) => {
    const selectedIndex = parseInt(event.target.dataset.index);
    const targetLabel = labels[selectedIndex];
    
    // 跳轉至對應標籤
    this.gotoLabel(targetLabel);
    
    // 隱藏選項容器
    uiModule.choicesContainer.classList.add('hidden');
};

// 綁定事件
uiModule.choicesContainer.addEventListener('click', handleChoice);
```

### 5.4 清除選項

```typescript
clear(): void {
    this.choicesContainer.classList.add('hidden');
    this.choicesContainer.innerHTML = '';
}
```

## 6. 全螢幕影片播放 (MV)

### 6.1 功能說明

支援在遊戲中播放全螢幕影片（如過場動畫、OP/ED），播放完畢後自動繼續執行腳本。

### 6.2 實作細節

```typescript
async playVideo(videoPath: string, volume: number = 1.0): Promise<void> {
    return new Promise((resolve) => {
        // 1. 建立 video 元素
        const video = document.createElement('video');
        video.src = videoPath;
        video.volume = Math.max(0, Math.min(1, volume));
        video.style.cssText = `
            position: fixed; top: 0; left: 0; 
            width: 100vw; height: 100vh; 
            object-fit: contain; z-index: 9999; 
            background: black;
        `;
        
        // 2. 插入 DOM 並自動播放
        document.body.appendChild(video);
        video.play();
        
        // 3. 綁定結束事件
        const cleanup = () => {
            video.pause();
            video.remove();
        };
        
        video.addEventListener('ended', () => {
            cleanup();
            resolve();
        });
        
        // 4. 支援跳過（點擊或按鍵）
        const skipVideo = (event: Event) => {
            event.preventDefault();
            cleanup();
            resolve();
        };
        
        document.addEventListener('click', skipVideo, { once: true });
        document.addEventListener('keydown', skipVideo, { once: true });
    });
}
```

### 6.3 使用方式

**腳本指令**：`MV|影片路徑|音量`

**範例**：
```
MV|assets/mov/opening.mp4|0.8
MV|assets/mov/ending.mp4
```

**ScriptEngine 呼叫**：
```typescript
await uiModule.playVideo(videoPath, volume);
```

## 7. 淡出效果 (FADE_OUT)

### 7.1 功能說明

畫面淡出至黑幕，常用於場景轉換或遊戲結束。

### 7.2 實作細節

```typescript
async fadeOut(duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; 
            width: 100vw; height: 100vh; 
            background: black; opacity: 0; 
            z-index: 8888; transition: opacity ${duration}ms;
        `;
        
        document.body.appendChild(overlay);
        
        // 觸發淡出動畫
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        // 動畫結束後移除元素
        setTimeout(() => {
            resolve();
        }, duration + 50);
    });
}
```

### 7.3 使用情境

- 遊戲結束時（`STATE_WAIT_END_INTERACTION`）
- 章節切換
- 特殊劇情效果

## 8. 空白鍵推進功能

### 8.1 互動規則與適用情境

空白鍵 (Space) 被視為與全螢幕點擊 (Click) 等效的互動方式，主要用於推進遊戲進程。

**行為邏輯**：
- **打字中 (Typing)**：按下空白鍵會觸發 `completeTyping()`，立即顯示該段落的所有文字
- **打字結束 (Typing Finished)**：按下空白鍵會觸發 `GameKernel.onUserClick()`，推進至下一個腳本指令
- **選項顯示 (Choice Mode)**：空白鍵會嘗試觸發推進，但建議玩家直接點擊按鈕選擇
- **聚焦輸入欄位 (Input Focus)**：焦點位於 `INPUT`、`TEXTAREA` 或 `.script-editor` 時，空白鍵回歸預設輸入行為

### 8.2 生命週期說明

**註冊 (Registration)**：於 `UIModule.initialize()` 時透過 `document.addEventListener("keydown", this.handleDocumentSpaceKey)` 進行全域註冊。

**釋放 (Release)**：於 `UIModule.dispose()` 時透過 `document.removeEventListener("keydown", this.handleDocumentSpaceKey)` 移除監聽器。

### 8.3 實作位置

**檔案**：`src/modules/UIModule.ts`

**主要方法**：
- `UIModule.initialize()`：綁定 keydown 事件
- `UIModule.dispose()`：卸載監聽器
- `UIModule.handleDocumentSpaceKey(event)`：檢查空白鍵並執行推進邏輯

```typescript
handleDocumentSpaceKey(event: KeyboardEvent): void {
    if (event.code !== 'Space') return;
    
    // 檢查是否為輸入欄位
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' 
        || target.isContentEditable || target.classList.contains('script-editor')) {
        return; // 不干擾輸入行為
    }
    
    event.preventDefault(); // 防止頁面捲動
    this.kernel.onUserClick(); // 執行推進
}
```

### 8.4 注意事項

- **僅於主視窗啟用**：路徑包含 `script_editor.html` 時不啟用，避免干擾編輯器操作
- **防止捲動**：必須呼叫 `event.preventDefault()`，防止瀏覽器因空白鍵產生頁面捲動
- **與 Click 事件一致性**：空白鍵的行為必須嚴格與 `handleDocumentClick` 保持邏輯同步

## 9. 載入提示 (Loading)

### 9.1 功能說明

在資源載入或非同步操作期間顯示載入提示，提升使用者體驗。

### 9.2 實作

```typescript
toggleLoading(show: boolean): void {
    if (show) {
        this.loadingOverlay.classList.remove('hidden');
    } else {
        this.loadingOverlay.classList.add('hidden');
    }
}
```

**使用情境**：
- 批量資源預載
- 影片載入中
- 腳本切換（`CALL_SCRIPT`）

## 10. 參考文件

- [系統架構](./00_Architecture.md)
- [腳本引擎](./03_ScriptEngine.md)
- [角色立繪系統](./07_CharacterModule.md)
