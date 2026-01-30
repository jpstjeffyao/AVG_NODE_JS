# 腳本編輯格式說明

## 素材來源
素材來源為 D:\VS CODE\AVG_NODE_JS\assets

## 格式說明

- **背景設定 BG|bg_room**: 設定背景為 `bg_room.jpg`。
- **SPRITE|hero|center|char_hero**: 參數1控制顯示角色 `hero.png`，參數2位置控制為 `center`，參數3 角色圖像為 `char_hero`。
- **SAY|主角|這裡是...獨立的編輯器視窗！**: 主角說話，內容為 `這裡是...獨立的編輯器視窗！`。
- **SPRITE|hero_happy|center|char_hero**: 顯示角色 `hero_happy`，位置為 `center`，角色圖像為 `char_hero`。
- **SAY|主角|現在畫面變得更整潔了。**: 主角說話，內容為 `現在畫面變得更整潔了。`。
- **SPRITE_CLR|center**: 清除角色顯示，位置為 `center`。
- **SAY|主角|這就是我們想要的結果。**: 主角說話，內容為 `這就是我們想要的結果。`。
- **CHOICE|重新開始:start|結束實驗:end**: 提供選擇，選項為 `重新開始` 和 `結束實驗`。
- **LABEL|start**: 標記 `start`。
- **GOTO|top**: 跳轉到 `top`。
- **LABEL|end**: 標記 `end`。
- **SAY|系統|實驗結束。**: 系統說話，內容為 `實驗結束。`。

### CHARA - 顯示/隱藏立繪

此指令用於在畫面上指定的位置（左、右、中）顯示、更換或隱藏角色立繪。

#### 語法格式

指令的基本格式為 `COMMAND|SUB_COMMAND|PARAMETERS...`。

**顯示或替換立繪:**
`CHARA|SHOW|角色|位置`

**隱藏指定位置的立繪:**
`CHARA|HIDE|位置`

**清除所有立繪:**
`CHARA|CLEAR`

#### 參數詳解

*   **`SHOW` (子指令):**
    *   `角色ID與表情`: (必要) 用於識別角色資源，例如 `yuki_neutral_L`。 用於加載不同的立繪圖片
    *   `位置`: (必要) 指定立繪顯示的位置。
        *   `left`: 顯示於畫面左側。
        *   `right`: 顯示於畫面右側。
        *   `center`: 顯示於畫面中央。

*   **`HIDE` (子指令):**
    *   `位置`: (必要) 指定要隱藏哪個位置的立繪 (`left`, `right`, `center`)。

*   **`CLEAR` (子指令):**
    *   不需任何參數，清除畫面上所有的立繪。

#### 使用範例

# 在左側顯示 yuki 的微笑表情
CHARA|SHOW|yuki_smile_L|left

# 同時在右側顯示 hero 的開心表情
CHARA|SHOW|hero_happy_R|right

# 將左側 yuki 的表情更換為普通
CHARA|SHOW|yuki_neutral_L|left

# 隱藏右側的立繪
CHARA|HIDE|right

# 清除所有立繪
CHARA|CLEAR
 
 
## 音訊控制指令 (Audio Control Commands)

使用 `[命令: 參數]` 格式來控制背景音樂 (BGM) 和音效 (SFX)。

### 背景音樂 (BGM)

*   **播放BGM**
    *   語法: `[BGM_PLAY: 音樂檔案路徑, 音量, 是否循環]`
    *   參數:
        *   `音樂檔案路徑` (string): e.g., `assets/music/your_music.mp3`
        *   `音量` (number): 0.0 到 1.0 之間
        *   `是否循環` (boolean): `true` 或 `false`
    *   範例: `[BGM_PLAY: assets/music/FairyTale.mp3, 0.7, true]`

*   **停止BGM**
    *   語法: `[BGM_STOP]`
    *   說明: 立即停止目前播放的 BGM。

*   **BGM淡出**
    *   語法: `[BGM_FADE_OUT: 秒數]`
    *   參數:
        *   `秒數` (number): 淡出至停止所需的時間。
    *   範例: `[BGM_FADE_OUT: 5]`

*   **BGM淡入**
    *   語法: `[BGM_FADE_IN: 秒數, 音樂檔案路徑, 目標音量, 是否循環]`
    *   參數:
        *   `秒數` (number): 淡入所需的時間。
        *   `音樂檔案路徑` (string)
        *   `目標音量` (number): 0.0 到 1.0 之間
        *   `是否循環` (boolean)
    *   範例: `[BGM_FADE_IN: 3, assets/music/FairyTale.mp3, 0.6, true]`

### 音效 (SFX)

*   **播放音效**
    *   語法: `[SFX_PLAY: 音效檔案路徑, 音量]`
    *   參數:
        *   `音效檔案路徑` (string): e.g., `assets/sfx/your_sound.mp3`
        *   `音量` (number): 0.0 到 1.0 之間
    *   說明: 播放一次音效。系統支援多個音效同時播放。
    *   範例: `[SFX_PLAY: assets/sfx/night_insects.mp3, 0.5]`
