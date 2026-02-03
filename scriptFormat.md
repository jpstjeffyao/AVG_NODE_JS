# 腳本編輯格式說明

## 素材來源
素材來源為 D:\VS CODE\AVG_NODE_JS\assets

## 格式說明

- **背景設定 BG|bg_room|0.5**: 設定背景為 `bg_room.jpg`。
    *   參數3 (可選): 震動強度 (0.0 - 1.0)。若設定此參數，背景在切換時會產生短暫的震動效果。
- **SPRITE|hero|center|char_hero**: 參數1控制顯示角色 `hero.png`，參數2位置控制為 `center`，參數3 角色圖像為 `char_hero`。
- **SAY|主角|這裡是...獨立的編輯器視窗！**: 主角說話，內容為 `這裡是...獨立的編輯器視窗！`。
- **SPRITE|hero_happy|center|char_hero**: 顯示角色 `hero_happy`，位置為 `center`，角色圖像為 `char_hero`。
- **SAY|主角|現在畫面變得更整潔了。**: 主角說話，內容為 `現在畫面變得更整潔了。`。
- **SPRITE_CLR|center**: 清除角色顯示，位置為 `center`。
- **SAY|主角|這就是我們想要的結果。**: 主角說話，內容為 `這就是我們想要的結果。`。
- **CHOICE|重新開始:start|結束實驗:end**: 提供選擇，選項為 `重新開始` 和 `結束實驗`。
- **SET|變數名稱|數值**: 設定全域變數的值（數值型）。
- **CALL_SCRIPT|劇本名稱**: 切換並載入另一個劇本檔案。系統會從 LocalStorage 中尋找對應名稱的劇本內容並重新開始執行。
    *   範例: `CALL_SCRIPT|Script01-02`
- **播放影片 MV|影片檔案名稱|音量(可選)**: 在畫面上全螢幕播放指定影片。影片播放完畢後，遊戲將自動繼續。
    *   `影片檔案名稱` (string): 影片檔案的名稱，例如 `main.mp4`。路徑固定在 `assets/mov/` 底下。
    *   `音量` (number, 可選): 0.0 到 1.0 之間。若省略，預設為 1.0 (100%)。
    *   **註**: 腳本指令現在改為 **不分大小寫** (Case-Insensitive)，例如 `mv` 與 `MV` 效果相同。
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


## 遊戲邏輯控制指令 (Game Logic Commands)

### SET - 設定變數

用於設定全域變數的值，可用於記錄玩家選擇、遊戲狀態、好感度等數值。

#### 語法格式

`SET|變數名稱|數值`

#### 參數詳解

*   **`變數名稱`** (string): 變數的識別名稱，建議使用有意義的英文名稱
*   **`數值`** (number): 要設定的數值（整數）

#### 使用範例

```
# 設定好感度
SET|affection|50

# 記錄玩家選擇
SET|playerChoice|1

# 設定遊戲進度旗標
SET|chapter|2
```

#### 應用場景

*   **好感度系統**: 追蹤角色好感度變化
*   **分支劇情**: 記錄玩家的重要選擇
*   **成就系統**: 記錄達成條件
*   **遊戲進度**: 追蹤章節或關卡進度

---

### IF - 條件判斷

根據變數的值來決定是否跳轉到指定的標籤位置，實現分支劇情。

#### 語法格式

`IF|變數名稱|比對數值|GOTO|標籤名稱`

#### 參數詳解

*   **`變數名稱`** (string): 要檢查的變數名稱
*   **`比對數值`** (number): 用於比對的數值
*   **`GOTO`**: 固定關鍵字，表示跳轉動作
*   **`標籤名稱`** (string): 當條件成立時要跳轉的目標標籤

#### 運作邏輯

*   如果 `變數名稱` 的值 **等於** `比對數值`，則跳轉到 `標籤名稱`
*   如果條件不成立，則繼續執行下一行指令

#### 使用範例

```
# 根據好感度顯示不同結局
SET|affection|80
IF|affection|80|GOTO|good_ending

# 如果好感度不是 80，會執行這裡
SAY|系統|普通結局
GOTO|end

LABEL|good_ending
SAY|系統|好結局！
LABEL|end
```

#### 進階範例：多重分支

```
# 玩家選擇後的分支處理
CHOICE|幫助村民:help_village|繼續旅程:continue_journey|休息一天:take_rest

LABEL|help_village
SET|karma|1
SAY|旁白|你決定幫助村民...
GOTO|after_choice

LABEL|continue_journey
SET|karma|0
SAY|旁白|你選擇繼續前進...
GOTO|after_choice

LABEL|take_rest
SET|karma|-1
SAY|旁白|你決定休息一天...

LABEL|after_choice
# 根據 karma 值顯示不同反應
IF|karma|1|GOTO|positive_reaction
IF|karma|-1|GOTO|negative_reaction

SAY|村長|謝謝你的幫助
GOTO|continue_story

LABEL|positive_reaction
SAY|村長|你真是個好人！
SET|affection|100
GOTO|continue_story

LABEL|negative_reaction
SAY|村長|你怎麼這麼自私...
SET|affection|20

LABEL|continue_story
SAY|旁白|故事繼續...
```

---

### CALL_SCRIPT - 呼叫其他腳本

切換並載入另一個劇本檔案，用於實現章節切換、場景轉換等功能。

#### 語法格式

`CALL_SCRIPT|劇本名稱`

#### 參數詳解

*   **`劇本名稱`** (string): 要載入的劇本檔案名稱，必須是已存在於 LocalStorage 中的劇本

#### 運作機制

*   系統會從 LocalStorage 中尋找 `scripteditor_script_[劇本名稱]` 的內容
*   載入成功後，會從新劇本的第一行開始執行
*   **重要**: 當前劇本的執行狀態會被重置，變數會保留

#### 使用範例

```
# 第一章結束，切換到第二章
SAY|旁白|第一章完結
CALL_SCRIPT|Chapter02

# 根據選擇進入不同路線
CHOICE|前往城鎮:town|前往森林:forest

LABEL|town
CALL_SCRIPT|Town_Route

LABEL|forest
CALL_SCRIPT|Forest_Route
```

#### 劇本組織建議

**主選單劇本 (MainMenu)**
```
BG|title_screen
SAY|系統|歡迎來到遊戲
CHOICE|新遊戲:new_game|繼續遊戲:continue

LABEL|new_game
SET|chapter|1
CALL_SCRIPT|Chapter01

LABEL|continue
# 載入存檔邏輯
CALL_SCRIPT|Chapter02
```

**章節劇本 (Chapter01)**
```
BG|forest
SAY|主角|冒險開始了！
# ... 章節內容 ...
SAY|旁白|第一章完結
CALL_SCRIPT|Chapter02
```

**章節劇本 (Chapter02)**
```
BG|town
SAY|主角|來到了城鎮
# ... 章節內容 ...
```

#### 注意事項

*   確保目標劇本已在 Script Editor 中建立
*   劇本名稱區分大小寫
*   建議使用有意義的命名規則，如 `Chapter01`, `Scene_Battle`, `Ending_Good` 等
*   可以搭配 `SET` 和 `IF` 指令實現複雜的劇情分支

---

### 綜合應用範例

以下是一個結合 `SET`、`IF`、`CALL_SCRIPT` 的完整範例：

```
# 遊戲開始
BG|village
SET|playerLevel|1
SET|hasKey|0

SAY|村長|年輕的冒險者，你願意幫我們找回失落的鑰匙嗎？
CHOICE|願意幫忙:accept_quest|拒絕:reject_quest

LABEL|accept_quest
SET|questAccepted|1
SAY|村長|太好了！鑰匙在森林深處。
CALL_SCRIPT|Forest_Quest

LABEL|reject_quest
SET|questAccepted|0
SAY|村長|真遺憾...
CALL_SCRIPT|Bad_Ending

# Forest_Quest 劇本內容
# (需要在 Script Editor 中另外建立)
BG|forest
SAY|旁白|你進入了森林...
# ... 探索過程 ...
SET|hasKey|1
SAY|旁白|你找到了鑰匙！
CALL_SCRIPT|Village_Return

# Village_Return 劇本內容
BG|village
IF|hasKey|1|GOTO|success
SAY|村長|你怎麼空手回來了？
GOTO|end

LABEL|success
SAY|村長|太感謝了！這是你的獎勵。
SET|playerLevel|2
CALL_SCRIPT|Next_Chapter

LABEL|end
```

 
 
## 音訊控制指令 (Audio Control Commands)

使用管道符號 `|` 分隔的格式來控制背景音樂 (BGM) 和音效 (SFX)，與其他腳本指令保持一致。

> [!NOTE]
> 音訊檔案路徑已簡化：只需填寫檔案名稱，系統會自動加上固定路徑。
> - BGM 固定路徑：`assets/music/`
> - SFX 固定路徑：`assets/sound/`

### 背景音樂 (BGM)

*   **播放BGM**
    *   語法: `BGM_PLAY|檔案名稱|音量|是否循環`
    *   參數:
        *   `檔案名稱` (string): 音樂檔案名稱，例如 `001.wav`、`FairyTale.mp3`
        *   `音量` (number): 0.0 到 1.0 之間
        *   `是否循環` (boolean): `true` 或 `false`
    *   範例: `BGM_PLAY|001.wav|0.7|true`
    *   說明: 系統會自動從 `assets/music/001.wav` 載入音樂

*   **停止BGM**
    *   語法: `BGM_STOP`
    *   說明: 立即停止目前播放的 BGM，無需任何參數

*   **BGM淡出**
    *   語法: `BGM_FADE_OUT|秒數`
    *   參數:
        *   `秒數` (number): 淡出至停止所需的時間
    *   範例: `BGM_FADE_OUT|5`

*   **BGM淡入**
    *   語法: `BGM_FADE_IN|秒數|檔案名稱|目標音量|是否循環`
    *   參數:
        *   `秒數` (number): 淡入所需的時間
        *   `檔案名稱` (string): 音樂檔案名稱
        *   `目標音量` (number): 0.0 到 1.0 之間
        *   `是否循環` (boolean): `true` 或 `false`
    *   範例: `BGM_FADE_IN|3|001.wav|0.6|true`
    *   說明: 系統會自動從 `assets/music/001.wav` 載入音樂

### 音效 (SFX)

*   **播放音效**
    *   語法: `SFX_PLAY|檔案名稱|音量`
    *   參數:
        *   `檔案名稱` (string): 音效檔案名稱，例如 `night_insects.wav`
        *   `音量` (number): 0.0 到 1.0 之間
    *   範例: `SFX_PLAY|night_insects.wav|0.5`
    *   說明: 播放一次音效。系統支援多個音效同時播放。系統會自動從 `assets/sound/night_insects.wav` 載入音效
