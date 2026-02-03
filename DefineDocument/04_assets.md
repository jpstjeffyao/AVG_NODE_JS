# 資源管理系統 (Asset Manager)

## 1. 模組概述

**AssetManager** 負責遊戲中所有視覺資源的載入、快取與顯示管理，包括背景圖片、角色立繪等靜態資源。

**核心職責**：
- 資源預載與快取（避免重複載入）
- 背景圖片管理（切換、震動效果）
- 圖片顯示層級控制
- 資源路徑規範化

## 2. 資源目錄結構

```
/assets
  ├── /bg          # 背景圖片
  │   ├── bg_01.jpg
  │   ├── bg_02.jpg
  │   └── ...
  ├── /char        # 角色立繪
  │   ├── elizabeth_neutral_L.png
  │   ├── elizabeth_happy_L.png
  │   └── ...
  ├── /music       # 背景音樂
  │   └── (由 AudioManager 管理)
  ├── /sound       # 音效
  │   └── (由 AudioManager 管理)
  └── /mov         # 影片
      └── (由 UIModule 管理)
```

**命名規範**：
- **背景圖**：`bg_XX.jpg` 或 `bg_XX.png`（XX 為編號或名稱）
- **角色立繪**：`角色名稱_表情_方向.png`
  - 範例：`elizabeth_neutral_L.png`（伊莉莎白_中性表情_向左）

## 3. 背景圖片管理 (BG)

### 3.1 腳本指令

**語法**：`BG|背景名稱|震動強度(可選)`

**參數說明**：
- `背景名稱` (string)：背景圖檔名（不含副檔名和路徑）
  - 範例：`bg_room`、`bg_forest`
- `震動強度` (number, 可選)：0.0 到 1.0，控制切換時的震動效果強度
  - 0.0：無震動
  - 0.5：中等震動
  - 1.0：強烈震動

**範例**：
```
BG|bg_room           # 切換至 bg_room.jpg，無震動
BG|bg_forest|0.3     # 切換至 bg_forest.jpg，輕微震動
BG|bg_castle|0.8     # 切換至 bg_castle.jpg，強烈震動
```

### 3.2 實作細節

#### 背景切換

```typescript
async setBackground(bgName: string, shakeIntensity?: number): Promise<void> {
    const bgPath = `assets/bg/${bgName}.jpg`;
    
    // 預載圖片
    await this.preloadImage(bgPath);
    
    // 設定背景
    const bgLayer = document.getElementById('background-layer');
    bgLayer.style.backgroundImage = `url(${bgPath})`;
    
    // 震動效果
    if (shakeIntensity && shakeIntensity > 0) {
        this.applyShakeEffect(shakeIntensity);
    }
}
```

#### 震動效果

```typescript
applyShakeEffect(intensity: number): void {
    const bgLayer = document.getElementById('background-layer');
    const maxShake = 20 * intensity; // 最大震動幅度（像素）
    
    // 使用 CSS animation 實現震動
    bgLayer.style.animation = `shake 0.3s ease-in-out`;
    
    setTimeout(() => {
        bgLayer.style.animation = '';
    }, 300);
}
```

**CSS 定義**：
```css
@keyframes shake {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-5px, 2px); }
    50% { transform: translate(5px, -2px); }
    75% { transform: translate(-3px, -1px); }
}
```

### 3.3 資源快取

**目的**：避免重複載入相同圖片，提升效能。

```typescript
private imageCache: Map<string, HTMLImageElement> = new Map();

async preloadImage(path: string): Promise<HTMLImageElement> {
    // 檢查快取
    if (this.imageCache.has(path)) {
        return this.imageCache.get(path)!;
    }
    
    // 載入新圖片
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            this.imageCache.set(path, img);
            resolve(img);
        };
        img.onerror = () => reject(new Error(`Failed to load: ${path}`));
        img.src = path;
    });
}
```

## 4. 角色立繪管理 (CHARA)

**注意**：角色立繪的實際管理由 `CharacterModule` 負責，但資源預載功能由 `AssetManager` 提供。

### 4.1 資源預載支援

CharacterModule 在顯示角色前會呼叫 AssetManager 預載圖片：

```typescript
// CharacterModule.showCharacter() 中
const charPath = `assets/char/${charId}.png`;
await this.assetManager.preloadImage(charPath);
```

### 4.2 支援的格式

- **圖片格式**：PNG（支援透明背景）、JPG
- **推薦尺寸**：
  - 背景圖：1920x1080 (Full HD)
  - 角色立繪：600x1200（高度優先，保持比例）

## 5. 資源路徑規範

### 5.1 自動路徑補全

**設計目的**：腳本中只需填寫檔名，系統自動補全路徑和副檔名。

**實作邏輯**：
```typescript
// 背景圖
const bgPath = `assets/bg/${bgName}.jpg`;

// 角色立繪
const charPath = `assets/char/${charId}.png`;
```

### 5.2 副檔名自動檢測（擴展功能）

若需支援多種格式，可實作副檔名自動檢測：

```typescript
async findImagePath(basePath: string): Promise<string> {
    const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
    
    for (const ext of extensions) {
        const fullPath = basePath + ext;
        try {
            await this.preloadImage(fullPath);
            return fullPath;
        } catch {
            continue;
        }
    }
    
    throw new Error(`Image not found: ${basePath}`);
}
```

## 6. 顯示層級 (Z-Index)

**層級定義**（由低到高）：

1. **背景層** (`#background-layer`, z-index: 1)
   - 全螢幕背景圖片
   - 使用 `background-image` 顯示

2. **角色層** (`#character-layer`, z-index: 5)
   - 角色立繪容器
   - 包含 left, center, right 三個位置

3. **對話層** (`#dialog-container`, z-index: 10)
   - 對話框、角色名稱、文字

4. **選項層** (`#choices-container`, z-index: 15)
   - 選項按鈕

5. **覆蓋層** (z-index: 8888+)
   - 淡出覆蓋層
   - 影片播放層 (z-index: 9999)

## 7. 錯誤處理

### 7.1 資源載入失敗

**策略**：
- 記錄錯誤至 Console
- 使用降級圖片（純色背景或預設圖）
- 繼續執行腳本，不中斷遊戲

```typescript
async setBackground(bgName: string): Promise<void> {
    try {
        await this.preloadImage(`assets/bg/${bgName}.jpg`);
        // ...設定背景
    } catch (error) {
        console.error(`Background load failed: ${bgName}`, error);
        // 使用預設背景
        this.setDefaultBackground();
    }
}
```

### 7.2 快取清理

若資源過多導致記憶體問題，可實作快取清理：

```typescript
clearCache(): void {
    this.imageCache.clear();
}

removeFromCache(path: string): void {
    this.imageCache.delete(path);
}
```

## 8. 效能優化

### 8.1 批量預載

在章節開始前預載所有資源：

```typescript
async preloadBatch(paths: string[]): Promise<void> {
    await Promise.all(paths.map(path => this.preloadImage(path)));
}
```

**使用範例**：
```typescript
// 在章節開始時
await assetManager.preloadBatch([
    'assets/bg/bg_forest.jpg',
    'assets/bg/bg_town.jpg',
    'assets/char/hero_neutral.png',
    'assets/char/hero_happy.png'
]);
```

### 8.2 延遲載入

非關鍵資源可在背景中延遲載入：

```typescript
preloadInBackground(paths: string[]): void {
    setTimeout(() => {
        paths.forEach(path => this.preloadImage(path));
    }, 1000);
}
```

## 9. 與其他模組的整合

### 9.1 ScriptEngine

**呼叫方式**：
```typescript
case 'BG':
    const [bgName, shakeStr] = parts.slice(1);
    const shake = shakeStr ? parseFloat(shakeStr) : 0;
    await this.kernel.assetManager.setBackground(bgName, shake);
    break;
```

### 9.2 CharacterModule

**依賴關係**：
```typescript
constructor(private assetManager: AssetManager) {}

async showCharacter(charId: string, position: string): Promise<void> {
    const charPath = `assets/char/${charId}.png`;
    await this.assetManager.preloadImage(charPath);
    // ...顯示邏輯
}
```

## 10. 擴展性

### 10.1 支援動畫背景

可擴展支援 GIF 或 WebP 動畫背景：

```typescript
async setAnimatedBackground(bgName: string): Promise<void> {
    const bgPath = `assets/bg/${bgName}.gif`;
    // ...設定動畫背景
}
```

### 10.2 背景切換過渡效果

可添加淡入淡出或其他過渡效果：

```typescript
async transitionBackground(newBg: string, duration: number = 500): Promise<void> {
    // 淡出舊背景 → 切換 → 淡入新背景
}
```

## 11. 參考文件

- [系統架構](./00_Architecture.md)
- [腳本引擎](./03_ScriptEngine.md)
- [角色立繪系統](./07_CharacterModule.md)
- [腳本格式說明](../scriptFormat.md)