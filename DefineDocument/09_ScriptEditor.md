# 腳本編輯器系統 (Script Editor)

## 1. 系統概述

**腳本編輯器** 是一個強大的網頁工具，提供即時腳本編輯、多腳本管理和即時預覽功能，大幅提升遊戲開發效率。

**核心功能**：
- 多腳本管理（建立、重命名、刪除）
- 主腳本標記系統
- 腳本列表（A-Z 排序、搜尋過濾）
- 語法即時預覽
- 檔案導入/導出
- 與主視窗的即時通訊（postMessage）
- LocalStorage 自動儲存

## 2. 檔案結構

```
/
├── script_editor.html    # 編輯器 HTML 介面
├── src/
│   └── scripteditor.js   # 編輯器邏輯（獨立於遊戲核心）
└── index.html           # 主遊戲視窗
```

**獨立設計**：編輯器與遊戲核心分離，可獨立開啟使用

## 3. LocalStorage 資料結構

### 3.1 腳本索引

**Key**：`scripteditor_scripts`

**格式**：JSON 陣列

```json
[
    {
        "name": "Script01-01",
        "isMain": true
    },
    {
        "name": "Script01-02",
        "isMain": false
    },
    {
        "name": "Chapter02",
        "isMain": false
    }
]
```

**欄位說明**：
- `name`：腳本名稱（唯一識別）
- `isMain`：是否為主腳本（系統啟動時載入）

### 3.2 腳本內容

**Key**：`scripteditor_script_[NAME]`

**格式**：純文字（腳本行以 `\n` 分隔）

**範例**：
- Key: `scripteditor_script_Script01-01`
- Value: `"SAY|Hero|你好！\nBG|bg_room\nCHOICE|選項A:label_a|選項B:label_b"`

## 4. 核心功能

### 4.1 多腳本管理

#### 建立新腳本

**操作**：點擊工具列「+ (新增)」按鈕

**流程**：
1. 彈出提示輸入腳本名稱
2. 檢查名稱是否重複
3. 建立新腳本並加入索引
4. 自動切換至新腳本

**實作**：
```javascript
addScript(name, content = '') {
    name = name.trim();
    if (!name) {
        alert('腳本名稱不能為空');
        return false;
    }
    
    const scripts = this.getScriptList();
    if (scripts.find(s => s.name === name)) {
        alert('腳本名稱已存在');
        return false;
    }
    
    scripts.push({ name, isMain: false });
    localStorage.setItem('scripteditor_scripts', JSON.stringify(scripts));
    localStorage.setItem(`scripteditor_script_${name}`, content);
    
    return true;
}
```

#### 刪除腳本

**操作**：點擊工具列「🗑 (刪除)」按鈕

**保護機制**：
- 無法刪除主腳本（必須先取消主腳本標記）
- 需要確認彈窗

**實作**：
```javascript
deleteScript(name) {
    const scripts = this.getScriptList();
    const script = scripts.find(s => s.name === name);
    
    if (script && script.isMain) {
        alert('無法刪除主腳本，請先取消主腳本標記');
        return false;
    }
    
    if (!confirm(`確定要刪除腳本 "${name}" 嗎？`)) {
        return false;
    }
    
    // 從索引中移除
    const updated = scripts.filter(s => s.name !== name);
    localStorage.setItem('scripteditor_scripts', JSON.stringify(updated));
    
    // 刪除內容
    localStorage.removeItem(`scripteditor_script_${name}`);
    
    return true;
}
```

#### 重命名腳本

**操作**：點擊工具列「✎ (重命名)」按鈕

**流程**：
1. 彈出提示輸入新名稱
2. 檢查新名稱是否重複
3. 更新索引和內容 Key

**實作**：
```javascript
renameScript(oldName, newName) {
    newName = newName.trim();
    if (!newName || oldName === newName) return false;
    
    const scripts = this.getScriptList();
    if (scripts.find(s => s.name === newName)) {
        alert('腳本名稱已存在');
        return false;
    }
    
    // 更新索引
    const script = scripts.find(s => s.name === oldName);
    if (script) {
        script.name = newName;
        localStorage.setItem('scripteditor_scripts', JSON.stringify(scripts));
    }
    
    // 移動內容
    const content = localStorage.getItem(`scripteditor_script_${oldName}`);
    if (content) {
        localStorage.setItem(`scripteditor_script_${newName}`, content);
        localStorage.removeItem(`scripteditor_script_${oldName}`);
    }
    
    return true;
}
```

### 4.2 主腳本系統

**定義**：標記為「主腳本」的劇本會在遊戲啟動時自動載入

**限制**：同時只能有一個主腳本

#### 設定主腳本

**操作**：在腳本列表中對目標腳本點擊**滑鼠右鍵**

**實作**：
```javascript
setMainScript(name) {
    const scripts = this.getScriptList();
    
    // 清除所有主腳本標記
    scripts.forEach(s => s.isMain = false);
    
    // 設定新的主腳本
    const script = scripts.find(s => s.name === name);
    if (script) {
        script.isMain = true;
    }
    
    localStorage.setItem('scripteditor_scripts', JSON.stringify(scripts));
}
```

**視覺標記**：主腳本在列表中會顯示 `[MAIN]` 標籤

### 4.3 腳本列表

**特性**：
- **A-Z 排序**：腳本按名稱字母順序排列（適合 `Script01-01`, `Script01-02` 等命名）
- **搜尋過濾**：即時搜尋功能
- **點擊切換**：點擊腳本名稱即可切換編輯

**實作**：
```javascript
renderScriptList(filterText = '') {
    const scripts = this.getScriptList();
    const listContainer = document.getElementById('script-list');
    listContainer.innerHTML = '';
    
    // 排序
    scripts.sort((a, b) => a.name.localeCompare(b.name));
    
    // 過濾
    const filtered = scripts.filter(s => 
        s.name.toLowerCase().includes(filterText.toLowerCase())
    );
    
    // 渲染
    filtered.forEach(script => {
        const item = document.createElement('div');
        item.className = 'script-item';
        item.textContent = script.name;
        
        if (script.isMain) {
            item.textContent += ' [MAIN]';
            item.classList.add('main-script');
        }
        
        item.addEventListener('click', () => this.loadScript(script.name));
        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.setMainScript(script.name);
        });
        
        listContainer.appendChild(item);
    });
}
```

### 4.4 即時語法預覽

**功能**：顯示當前編輯行的語法提示

**實作位置**：`script_editor.html` 的狀態列

**範例顯示**：
```
當前指令: SAY
語法: SAY|角色名稱|對話內容
狀態: ✓ 語法正確
```

## 5. 檔案導入/導出

### 5.1 開啟本地檔案

**操作**：點擊「開啟檔案」按鈕

**支援格式**：`.txt`、`.md`

**實作**：
```javascript
handleFileUpload(file, overwriteMain = false) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const content = e.target.result;
        
        if (overwriteMain) {
            // 覆蓋主腳本
            const scripts = this.getScriptList();
            const mainScript = scripts.find(s => s.isMain);
            if (mainScript) {
                this.saveScript(mainScript.name, content);
            }
        } else {
            // 建立新腳本
            const name = file.name.replace(/\.(txt|md)$/, '');
            this.addScript(name, content);
        }
    };
    
    reader.readAsText(file, 'UTF-8');
}
```

### 5.2 導出腳本（未完整實作）

**建議實作**：
```javascript
exportScript(name) {
    const content = localStorage.getItem(`scripteditor_script_${name}`);
    if (!content) return;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
}
```

## 6. 與主視窗通訊

### 6.1 postMessage 機制

**技術**：使用 `window.postMessage()` API 進行跨視窗通訊

**流程**：

1. **編輯器**：點擊「執行腳本 (Run)」按鈕
   ```javascript
   runScript() {
       const content = this.getCurrentScriptContent();
       window.opener.postMessage({
           type: 'UPDATE_SCRIPT',
           script: content
       }, '*');
   }
   ```

2. **主視窗**：接收訊息並重新載入腳本
   ```javascript
   window.addEventListener('message', (event) => {
       if (event.data && event.data.type === 'UPDATE_SCRIPT') {
           const scriptLines = event.data.script.split('\n')
               .map(line => line.trim())
               .filter(line => line.length > 0 && !line.startsWith('#'));
           
           kernel.loadScript(scriptLines);
           kernel.initializeModules();
           kernel.start();
       }
   });
   ```

### 6.2 熱更新

**特性**：執行腳本後，主視窗會：
1. 重置 ScriptEngine
2. 重新初始化所有模組
3. 隱藏選單，顯示對話框
4. 從第一行開始執行

**優點**：無需重新整理頁面，即時查看腳本效果

## 7. 自動儲存

**觸發時機**：每次編輯內容時

**實作**：
```javascript
// 綁定 textarea 的 input 事件
textarea.addEventListener('input', () => {
    const content = textarea.value;
    const currentScript = this.getCurrentScriptName();
    this.saveScript(currentScript, content);
});
```

**優點**：避免意外關閉視窗導致內容遺失

## 8. 使用者介面

### 8.1 主要區域

```
┌─────────────────────────────────────────┐
│ [工具列]                                │
│ [+新增] [✎重命名] [🗑刪除] [執行]       │
├──────────┬────────────────────────────┤
│          │                            │
│ [腳本列表] │    [編輯區]                │
│          │                            │
│ Script01 │    SAY|Hero|對話內容       │
│ Script02 │    BG|bg_room              │
│ [MAIN]   │    ...                     │
│          │                            │
├──────────┴────────────────────────────┤
│ [搜尋框] [開啟檔案] [狀態列]           │
└─────────────────────────────────────────┘
```

### 8.2 CSS 樣式建議

```css
#script-list {
    width: 200px;
    overflow-y: auto;
    border-right: 1px solid #ccc;
}

.script-item {
    padding: 8px;
    cursor: pointer;
    border-bottom: 1px solid #eee;
}

.script-item:hover {
    background: #f0f0f0;
}

.script-item.main-script {
    font-weight: bold;
    color: #007bff;
}

#editor-textarea {
    flex: 1;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    padding: 10px;
}
```

## 9. 最佳實踐

### 9.1 腳本命名建議

**推薦格式**：`ChapterXX-YY` 或 `ScriptXX-YY`

**範例**：
- `Script01-01` (第一章第一節)
- `Script01-02` (第一章第二節)
- `Battle_Forest` (森林戰鬥)
- `Ending_Good` (好結局)

**優點**：A-Z 排序後自動按順序排列

### 9.2 主腳本選擇

**建議**：將遊戲入口或主選單腳本設為主腳本

**範例**：
- `MainMenu` (主選單)
- `Prologue` (序章)
- `Script01-01` (第一章開頭)

### 9.3 備份策略

**問題**：LocalStorage 可能被清除（清除瀏覽器資料）

**解決方案**：
1. 定期導出重要腳本
2. 使用版本控制（Git）管理腳本檔案
3. 雲端備份（Google Drive、Dropbox）

## 10. 除錯與測試

### 10.1 查看 LocalStorage

**開發者工具**：
```javascript
// 查看所有腳本
console.log(JSON.parse(localStorage.getItem('scripteditor_scripts')));

// 查看特定腳本內容
console.log(localStorage.getItem('scripteditor_script_Script01-01'));
```

### 10.2 清除所有腳本（重置）

```javascript
// 清除所有編輯器資料
Object.keys(localStorage)
    .filter(key => key.startsWith('scripteditor_'))
    .forEach(key => localStorage.removeItem(key));
```

## 11. 擴展性

### 11.1 語法高亮（未實作）

可整合 CodeMirror 或 Monaco Editor：

```javascript
const editor = CodeMirror.fromTextArea(textarea, {
    mode: 'avg-script',
    lineNumbers: true,
    theme: 'monokai'
});
```

### 11.2 自動完成（未實作）

```javascript
textarea.addEventListener('input', (e) => {
    const currentLine = getCurrentLine();
    const suggestions = getCommandSuggestions(currentLine);
    showAutoComplete(suggestions);
});
```

### 11.3 協作編輯（未實作）

使用 WebSocket 實現多人協作編輯：

```javascript
socket.on('script_update', (data) => {
    updateEditor(data.content);
});
```

## 12. 注意事項

### 12.1 瀏覽器限制

- LocalStorage 容量限制：~5-10 MB
- 單一腳本建議不超過 1 MB
- 跨瀏覽器不共享：Chrome 和 Firefox 的 LocalStorage 獨立

### 12.2 跨視窗通訊限制

- 必須由主視窗開啟編輯器（`window.open()`）
- 主視窗關閉後，編輯器無法傳送訊息
- 使用 `window.opener` 確保通訊正常

### 12.3 安全性

- LocalStorage 為明文儲存，不加密
- 不適合儲存敏感資訊
- XSS 攻擊可讀取 LocalStorage

## 13. 參考文件

- [系統架構](./00_Architecture.md)
- [主流程與進入點](./01_MainFlow_Entry.md)
- [腳本引擎](./03_ScriptEngine.md)
- [腳本格式說明](../scriptFormat.md)
- [README](../ReadMe.md)
