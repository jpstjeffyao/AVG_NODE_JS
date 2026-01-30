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
`CHARA|SHOW|角色ID|表情|位置`

**隱藏指定位置的立繪:**
`CHARA|HIDE|位置`

**清除所有立繪:**
`CHARA|CLEAR`

#### 參數詳解

*   **`SHOW` (子指令):**
    *   `角色ID`: (必要) 用於識別角色資源，例如 `yuki`。
    *   `表情`: (必要) 用於加載不同的立繪圖片，例如 `normal`, `smile`。系統會自動組合路徑為 `/assets/char/{角色ID}_{表情}.png`。
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
CHARA|SHOW|yuki|smile|left

# 同時在右側顯示 hero 的開心表情
CHARA|SHOW|hero|happy|right

# 將左側 yuki 的表情更換為普通
CHARA|SHOW|yuki|normal|left

# 隱藏右側的立繪
CHARA|HIDE|right

# 清除所有立繪
CHARA|CLEAR