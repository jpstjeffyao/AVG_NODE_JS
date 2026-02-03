# 音訊管理系統 (Audio Manager)

## 1. 系統概述

**AudioManager** 負責遊戲中所有音訊的播放與控制，包括背景音樂（BGM）和音效（SFX）。

**核心職責**：
- 背景音樂播放與控制（播放、停止、淡入淡出）
- 音效多重播放支援
- 音量控制
- 資源路徑自動補全

## 2. 音訊資源結構

```
/assets
  ├── /music       # 背景音樂 (BGM)
  │   ├── FairyTale.mp3
  │   ├── 001.wav
  │   └── ...
  └── /sound       # 音效 (SFX)
      ├── door_open.wav
      ├── night_insects.wav
      └── ...
```

**路徑規範**：
- BGM 固定路徑：`assets/music/`
- SFX 固定路徑：`assets/sound/`
- 腳本中只需填寫檔案名稱，系統自動補全路徑

## 3. 背景音樂 (BGM)

### 3.1 支援的指令

#### BGM_PLAY - 播放背景音樂

**語法**：`BGM_PLAY|檔案名稱|音量|是否循環`

**參數**：
- `檔案名稱` (string)：音樂檔案名稱，例如 `FairyTale.mp3`
- `音量` (number)：0.0 到 1.0 之間
- `是否循環` (boolean)：`true` 或 `false`

**範例**：
```
BGM_PLAY|FairyTale.mp3|0.7|true
BGM_PLAY|001.wav|0.5|false
```

#### BGM_STOP - 停止背景音樂

**語法**：`BGM_STOP`

**說明**：立即停止目前播放的 BGM，無需任何參數

**範例**：
```
BGM_STOP
```

#### BGM_FADE_OUT - 背景音樂淡出

**語法**：`BGM_FADE_OUT|秒數`

**參數**：
- `秒數` (number)：淡出至停止所需的時間（秒）

**範例**：
```
BGM_FADE_OUT|5    # 5 秒內淡出至停止
BGM_FADE_OUT|3    # 3 秒內淡出至停止
```

#### BGM_FADE_IN - 背景音樂淡入

**語法**：`BGM_FADE_IN|秒數|檔案名稱|目標音量|是否循環`

**參數**：
- `秒數` (number)：淡入所需的時間（秒）
- `檔案名稱` (string)：音樂檔案名稱
- `目標音量` (number)：0.0 到 1.0 之間
- `是否循環` (boolean)：`true` 或 `false`

**範例**：
```
BGM_FADE_IN|3|FairyTale.mp3|0.6|true
```

### 3.2 實作細節

#### 播放 BGM

```typescript
playBGM(filename: string, volume: number, loop: boolean): void {
    // 1. 停止當前 BGM
    this.stopBGM();
    
    // 2. 建立新的 Audio 元素
    this.bgm = new Audio(`assets/music/${filename}`);
    this.bgm.volume = Math.max(0, Math.min(1, volume)); // 限制範圍
    this.bgm.loop = loop;
    
    // 3. 播放
    this.bgm.play().catch(err => {
        console.error('[AudioManager] BGM play error:', err);
    });
}
```

#### 停止 BGM

```typescript
stopBGM(): void {
    if (this.bgm) {
        this.bgm.pause();
        this.bgm.currentTime = 0;
        this.bgm = null;
    }
}
```

#### 淡出 BGM

```typescript
fadeOutBGM(duration: number): void {
    if (!this.bgm) return;
    
    const startVolume = this.bgm.volume;
    const step = startVolume / (duration * 60); // 60 FPS 假設
    
    const fadeInterval = setInterval(() => {
        if (!this.bgm || this.bgm.volume <= 0) {
            clearInterval(fadeInterval);
            this.stopBGM();
            return;
        }
        
        this.bgm.volume = Math.max(0, this.bgm.volume - step);
    }, 1000 / 60); // 每幀更新
}
```

#### 淡入 BGM

```typescript
fadeInBGM(duration: number, filename: string, targetVolume: number, loop: boolean): void {
    // 1. 播放音樂（初始音量為 0）
    this.playBGM(filename, 0, loop);
    
    // 2. 逐漸提高音量
    const step = targetVolume / (duration * 60);
    
    const fadeInterval = setInterval(() => {
        if (!this.bgm || this.bgm.volume >= targetVolume) {
            if (this.bgm) this.bgm.volume = targetVolume;
            clearInterval(fadeInterval);
            return;
        }
        
        this.bgm.volume = Math.min(targetVolume, this.bgm.volume + step);
    }, 1000 / 60);
}
```

### 3.3 使用情境

**場景轉換**：
```
BGM_FADE_OUT|3
BG|bg_forest
BGM_FADE_IN|2|forest_theme.mp3|0.7|true
```

**章節結束**：
```
SAY|系統|第一章完結
BGM_FADE_OUT|5
```

**戰鬥開始**：
```
BGM_STOP
BGM_PLAY|battle_theme.mp3|0.8|true
```

## 4. 音效 (SFX)

### 4.1 支援的指令

#### SFX_PLAY - 播放音效

**語法**：`SFX_PLAY|檔案名稱|音量`

**參數**：
- `檔案名稱` (string)：音效檔案名稱
- `音量` (number)：0.0 到 1.0 之間

**範例**：
```
SFX_PLAY|door_open.wav|0.8
SFX_PLAY|night_insects.wav|0.5
```

### 4.2 實作細節

#### 播放 SFX

```typescript
playSFX(filename: string, volume: number): void {
    // 建立新的 Audio 元素（不覆蓋現有音效）
    const sfx = new Audio(`assets/sound/${filename}`);
    sfx.volume = Math.max(0, Math.min(1, volume));
    
    // 播放完畢後自動銷毀
    sfx.addEventListener('ended', () => {
        sfx.remove();
    });
    
    sfx.play().catch(err => {
        console.error('[AudioManager] SFX play error:', err);
    });
}
```

**設計特性**：
- **多重播放**：每次呼叫建立新的 Audio 實例，支援同時播放多個音效
- **自動清理**：播放完畢後自動移除，避免記憶體洩漏
- **非同步**：不阻塞腳本執行

### 4.3 使用情境

**環境音效**：
```
BG|bg_forest
SFX_PLAY|bird_chirping.wav|0.3
SFX_PLAY|wind_sound.wav|0.2
```

**互動音效**：
```
SAY|Hero|我打開了門。
SFX_PLAY|door_open.wav|0.8
```

**事件觸發**：
```
SAY|系統|物品已獲得！
SFX_PLAY|item_get.wav|1.0
```

## 5. 路徑自動補全

### 5.1 設計理念

**目的**：簡化腳本編寫，避免重複輸入路徑

**實作**：
```typescript
// BGM
const bgmPath = `assets/music/${filename}`;

// SFX
const sfxPath = `assets/sound/${filename}`;
```

### 5.2 範例對比

**使用自動補全**（推薦）：
```
BGM_PLAY|FairyTale.mp3|0.7|true
SFX_PLAY|door_open.wav|0.8
```

**不使用自動補全**（冗長）：
```
BGM_PLAY|assets/music/FairyTale.mp3|0.7|true
SFX_PLAY|assets/sound/door_open.wav|0.8
```

## 6. 音量控制

### 6.1 音量範圍

**標準範圍**：0.0（靜音）到 1.0（最大音量）

**防禦性處理**：
```typescript
volume = Math.max(0, Math.min(1, volume));
```

即使腳本提供超出範圍的值，系統也會自動修正。

### 6.2 推薦音量值

| 用途 | 推薦音量 |
|------|---------|
| BGM（主旋律） | 0.6 - 0.8 |
| BGM（環境音樂） | 0.4 - 0.6 |
| SFX（重要音效） | 0.8 - 1.0 |
| SFX（環境音效） | 0.3 - 0.5 |

## 7. ScriptEngine 整合

### 7.1 指令解析

```typescript
// ScriptEngine.executeLine()
case 'BGM_PLAY':
    const [bgmFile, volumeStr, loopStr] = parts.slice(1);
    const volume = parseFloat(volumeStr);
    const loop = loopStr === 'true';
    this.kernel.audio.playBGM(bgmFile, volume, loop);
    break;

case 'BGM_STOP':
    this.kernel.audio.stopBGM();
    break;

case 'BGM_FADE_OUT':
    const duration = parseFloat(parts[1]);
    this.kernel.audio.fadeOutBGM(duration);
    break;

case 'BGM_FADE_IN':
    const [fadeInDur, fadeInFile, fadeInVol, fadeInLoop] = parts.slice(1);
    this.kernel.audio.fadeInBGM(
        parseFloat(fadeInDur),
        fadeInFile,
        parseFloat(fadeInVol),
        fadeInLoop === 'true'
    );
    break;

case 'SFX_PLAY':
    const [sfxFile, sfxVolStr] = parts.slice(1);
    this.kernel.audio.playSFX(sfxFile, parseFloat(sfxVolStr));
    break;
```

## 8. 錯誤處理

### 8.1 檔案不存在

```typescript
sfx.addEventListener('error', () => {
    console.error(`[AudioManager] Failed to load: ${filename}`);
});
```

**策略**：記錄錯誤但不中斷遊戲執行

### 8.2 參數錯誤

```typescript
playBGM(filename: string, volume: number = 0.7, loop: boolean = true): void {
    // 提供預設值，避免未定義錯誤
    volume = volume ?? 0.7;
    loop = loop ?? true;
    // ...
}
```

### 8.3 瀏覽器限制

**問題**：現代瀏覽器要求使用者互動後才能播放音訊

**解決方案**：
```typescript
// 在使用者首次點擊後解鎖音訊
document.addEventListener('click', () => {
    if (this.bgm) {
        this.bgm.play().catch(() => {});
    }
}, { once: true });
```

## 9. 支援的檔案格式

| 格式 | 支援度 | 建議用途 |
|------|--------|---------|
| MP3 | ✅ 全瀏覽器 | BGM（檔案小、品質佳） |
| WAV | ✅ 全瀏覽器 | SFX（無壓縮、延遲低） |
| OGG | ⚠️ 部分瀏覽器 | BGM（開源格式） |
| AAC | ⚠️ 部分瀏覽器 | BGM（高品質） |

**推薦組合**：
- BGM：使用 MP3
- SFX：使用 WAV

## 10. 效能優化

### 10.1 音訊預載（擴展功能）

```typescript
private audioCache: Map<string, HTMLAudioElement> = new Map();

preloadAudio(filename: string, type: 'music' | 'sound'): void {
    const path = type === 'music' 
        ? `assets/music/${filename}` 
        : `assets/sound/${filename}`;
    
    const audio = new Audio(path);
    this.audioCache.set(filename, audio);
}
```

### 10.2 SFX 池管理（擴展功能）

```typescript
// 限制同時播放的 SFX 數量
private maxSFX = 10;
private activeSFX: HTMLAudioElement[] = [];

playSFX(filename: string, volume: number): void {
    if (this.activeSFX.length >= this.maxSFX) {
        this.activeSFX[0].pause();
        this.activeSFX.shift();
    }
    
    const sfx = new Audio(`assets/sound/${filename}`);
    this.activeSFX.push(sfx);
    // ...
}
```

## 11. 擴展性

### 11.1 音量主控（未實作）

```typescript
private masterVolume = 1.0;

setMasterVolume(volume: number): void {
    this.masterVolume = volume;
    if (this.bgm) {
        this.bgm.volume *= this.masterVolume;
    }
}
```

### 11.2 音訊分類控制（未實作）

```typescript
private bgmVolume = 1.0;
private sfxVolume = 1.0;

setBGMVolume(volume: number): void {
    this.bgmVolume = volume;
    // 更新當前 BGM 音量
}

setSFXVolume(volume: number): void {
    this.sfxVolume = volume;
}
```

## 12. 參考文件

- [系統架構](./00_Architecture.md)
- [腳本引擎](./03_ScriptEngine.md)
- [腳本格式說明](../scriptFormat.md)
