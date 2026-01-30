import { IGameModule } from '../core/IGameModule';
import { StateManager } from '../core/StateManager';
import { CharacterPosition } from './CharacterModule';

/**
 * 腳本引擎，負責解析與執行遊戲腳本指令
 */
export class ScriptEngine implements IGameModule {
    public moduleName: string = "ScriptEngine";
    private stateManager: StateManager;
    private currentLineIndex: number = 0;
    private scriptLines: string[] = [];
    private labels: { [key: string]: number } = {};
    private isWaitingForChoice: boolean = false;
    private isWaitingForAsset: boolean = false;
    
    /**
     * 紀錄立繪位置與角色ID的對應關係。
     * 用於在執行 SAY 指令時，根據說話者名稱決定哪個位置的立繪需要高亮。
     * Key: 位置 (如 'left', 'center')
     * Value: 角色名稱 (如 'Hero')
     */
    private positionMap: Map<string, string> = new Map();

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
    }

    /**
     * 載入腳本行並掃描標籤
     */
    loadScript(lines: string[]): void {
        this.scriptLines = lines;
        this.scanLabels();
        this.currentLineIndex = 0; // 重設行號索引
    }

    /**
     * 掃描腳本中的 LABEL 指令並記錄位置
     */
    private scanLabels(): void {
        this.labels = {};
        this.scriptLines.forEach((line, index) => {
            const parts = line.split('|');
            if (parts[0] === 'LABEL') {
                this.labels[parts[1]] = index;
            }
        });
    }

    /**
     * 執行下一行指令
     */
    /**
     * 執行下一行指令
     * 改為非同步方法，等待當前指令執行完畢
     */
    async next(): Promise<void> {
        if (this.isWaitingForChoice || this.isWaitingForAsset) return;

        if (this.currentLineIndex < this.scriptLines.length) {
            const line = this.scriptLines[this.currentLineIndex];
            await this.executeLine(line);
            this.currentLineIndex++;
        }
    }

    /**
     * 解析並執行單行指令
     * 根據指令標記 (Command Token) 呼叫對應的模組功能。
     * 改為非同步方法，以支援 await 資源載入。
     */
    private async executeLine(line: string): Promise<void> {
        const parts = line.split('|');
        const command = parts[0];

        // 取得單例 Kernel 實例，以便存取其他模組 (如 AssetManager, UIModule)
        const kernel = (window as any).GameKernel?.getInstance();
        const modules = kernel?.modules || [];

        switch (command) {
            case 'LABEL':
                // LABEL 僅作為導覽標記，執行過程中無需邏輯處理
                break;
            case 'GOTO':
                // 跳轉指令：GOTO|標籤名稱
                const targetLabel = parts[1];
                if (this.labels[targetLabel] !== undefined) {
                    // 將當前行數索引移動到標籤所在位置
                    this.currentLineIndex = this.labels[targetLabel];
                } else {
                    console.error(`Label not found: ${targetLabel}`);
                }
                break;
            case 'CHOICE':
                // 分支選項指令：CHOICE|選項1:跳轉標籤1|選項2:跳轉標籤2
                const uiModuleChoice = modules.find((m: any) => m.moduleName === "UIModule");

                this.isWaitingForChoice = true;
                const choices: string[] = [];
                const targetLabels: string[] = [];

                // 解析選項文字與對應的標籤跳轉目標
                for (let i = 1; i < parts.length; i++) {
                    const choiceParts = parts[i].split(':');
                    choices.push(choiceParts[0]);
                    targetLabels.push(choiceParts[1]);
                }

                // 呼叫 UIModule 渲染選項按鈕
                if (uiModuleChoice) {
                    uiModuleChoice.clearDialog();
                    uiModuleChoice.showChoices(choices);

                    // 定義點擊選項後的回呼函式
                    const handleChoice = (event: any) => {
                        const selectedLabel = event.detail;
                        const choiceIndex = choices.indexOf(selectedLabel);
                        if (choiceIndex !== -1) {
                            const target = targetLabels[choiceIndex];
                            if (this.labels[target] !== undefined) {
                                // 執行跳轉並解除等待狀態
                                this.currentLineIndex = this.labels[target];
                                this.isWaitingForChoice = false;
                                // 清除監聽器以防重複觸發
                                window.removeEventListener('choiceMade', handleChoice);
                                // 選擇後立即自動執行跳轉後的首行指令
                                // 選擇後立即自動執行跳轉後的首行指令 (非同步呼叫)
                                this.next();
                            }
                        }
                    };

                    window.addEventListener('choiceMade', handleChoice);
                }
                break;
            case 'SAY':
                // 對話指令：SAY|說話者名稱|對話內容
                const speaker = parts[1];
                const content = parts[2] || "";
                console.log(`[ScriptEngine] SAY 指令解析 - speaker: ${speaker}, content: ${content}`);

                // 處理立繪高亮：根據當前說話者是誰，調整畫面中各個位置立繪的亮度
                // 非說話者的立繪會稍微變暗 (0.6)，說話者則保持原樣 (1.0)
                const assetModuleSAY = modules.find((m: any) => m.moduleName === "AssetManager");
                if (assetModuleSAY) {
                    this.positionMap.forEach((charID, pos) => {
                        const brightness = (charID === speaker) ? 1.0 : 0.6;
                        assetModuleSAY.setSpriteHighlight(pos, brightness);
                    });
                }

                // 通知 UIModule 進行打字機效果渲染與名稱顯示
                const uiModule = modules.find((m: any) => m.moduleName === "UIModule");
                if (uiModule) {
                    console.log(`[ScriptEngine] 呼叫 UIModule.renderText - speaker: ${speaker}, content: ${content}`);
                    uiModule.showDialog();
                    uiModule.renderText(speaker, content);
                }
                break;
            case 'BG':
                // 背景指令：BG|背景圖識別碼
                const bgKey = parts[1];
                const assetModuleBG = modules.find((m: any) => m.moduleName === "AssetManager");
                if (assetModuleBG) {
                    // 設定資源載入等待狀態
                    this.isWaitingForAsset = true;
                    try {
                        // 呼叫非同步的 setBG 並等待完成
                        await assetModuleBG.setBG(bgKey);
                    } finally {
                        this.isWaitingForAsset = false;
                    }
                }
                break;
            case 'SPRITE':
                // 立繪指令：SPRITE|角色識別碼|放置位置|圖像檔名稱
                // 範例: SPRITE|Hero|left|hero_happy
                if (parts.length !== 4) {
                    console.error(
                        `SPRITE 指令格式錯誤。預期格式: 'SPRITE|角色Key|位置|圖像Key'，但收到的指令是: '${line}'`
                    );
                    break;
                }
                const charKey = parts[1];
                const spritePos = parts[2]; // 'left', 'center', 'right'
                const imgKey = parts[3];

                console.log(`[ScriptEngine] SPRITE 指令解析 - charKey: ${charKey}, position: ${spritePos}, imgKey: ${imgKey}`);

                // 更新內部對照表：讓引擎知道現在 'left' 位置站的是 'Hero'
                this.positionMap.set(spritePos, charKey);

                const assetModuleSprite = modules.find((m: any) => m.moduleName === "AssetManager");
                if (assetModuleSprite) {
                    // 設定資源載入等待狀態
                    this.isWaitingForAsset = true;
                    try {
                        // 委託 AssetManager 處理圖像載入與 DOM 更新，並等待完成
                        await assetModuleSprite.handleSpriteCommand(charKey, spritePos, imgKey);
                    } finally {
                        this.isWaitingForAsset = false;
                    }
                }
                break;
            case 'SPRITE_CLR':
                // 清除立繪指令：SPRITE_CLR|位置
                if (parts.length !== 2) {
                    console.error(
                        `SPRITE_CLR 指令格式錯誤。預期格式: 'SPRITE_CLR|position'，但收到的指令是: '${line}'`
                    );
                    break;
                }
                const clrPos = parts[1];
                // 從對照表中移除該位置的角色資訊
                this.positionMap.delete(clrPos);
                
                const assetModuleClr = modules.find((m: any) => m.moduleName === "AssetManager");
                if (assetModuleClr && assetModuleClr.clearSprite) {
                    // 通知 AssetManager 移除對應 DOM 元素
                    assetModuleClr.clearSprite(clrPos);
                }
                break;
            case 'CHARA':
                const subCommand = parts[1];
                const charModule = kernel?.characterModule;
                if (!charModule) break;

                switch (subCommand) {
                    case 'SHOW':
                        const characterId = parts[2];
                        const expression = parts[3];
                        const position = parts[4] as CharacterPosition;
                        charModule.show(characterId, expression, position);
                        break;
                    case 'HIDE':
                        const hidePos = parts[2] as CharacterPosition;
                        charModule.hide(hidePos);
                        break;
                    case 'CLEAR':
                        charModule.clear();
                        break;
                }
                break;
            case 'SET':
                this.stateManager.setValue(parts[1], parseInt(parts[2]));
                break;
            case 'BGM':
                const bgmKey = parts[1];
                const audioModuleBGM = modules.find((m: any) => m.moduleName === "AudioManager");
                if (audioModuleBGM) {
                    audioModuleBGM.playBGM(bgmKey);
                }
                break;
            case 'SE':
                const seKey = parts[1];
                const audioModuleSE = modules.find((m: any) => m.moduleName === "AudioManager");
                if (audioModuleSE) {
                    audioModuleSE.playSE(seKey);
                }
                break;
            case 'IF':
                const variableValue = this.stateManager.getValue(parts[1]);
                const targetIfLabel = parts[4];
                if (variableValue === parseInt(parts[2])) {
                    if (this.labels[targetIfLabel] !== undefined) {
                        this.currentLineIndex = this.labels[targetIfLabel];
                    }
                }
                break;
            default:
                console.error(`Unknown command: ${command}`);
        }
    }

    initialize(): void {
        this.currentLineIndex = 0;
    }

    update(): void {
        // Update logic here if needed
    }

    shutdown(): void {
        // Shutdown logic here if needed
    }
}
