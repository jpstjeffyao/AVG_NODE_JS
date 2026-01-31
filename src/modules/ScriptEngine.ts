import { IGameModule } from '../core/IGameModule';
import { StateManager, GameState } from '../core/StateManager';
import { CharacterPosition } from './CharacterModule';
import { GameKernel } from '../core/GameKernel';

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

    /**
     * 角色顯示名稱與內部 ID 的對照表
     */
    private characterNameMap: { [displayName: string]: string } = {
        '伊莉莎白': 'elizabeth',
        '侍衛隊長': 'Captain',
        '哥布林隊長': 'Goblin'
        // 可根據需求擴充
    };

    constructor(stateManager: StateManager, private kernel: GameKernel) {
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
            if (line.trim().startsWith('#')) return;
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

        let isBlocking = false;
        while (!isBlocking && this.currentLineIndex < this.scriptLines.length) {
            const line = this.scriptLines[this.currentLineIndex];
            
            // If line is empty or a comment, skip it and continue the loop
            if (!line.trim() || line.trim().startsWith('#')) {
                this.currentLineIndex++;
                continue;
            }

            isBlocking = this.isBlockingCommand(line);

            await this.executeLine(line);
            this.currentLineIndex++;

            // If the script ends on a non-blocking command, update the state.
            if (this.currentLineIndex >= this.scriptLines.length) {
                console.log("[ScriptEngine] End of script reached.");
                this.stateManager.setState(GameState.STATE_WAIT_END_INTERACTION);
                break; // Exit the loop
            }
        }
    }

    private isBlockingCommand(line: string): boolean {
        const command = line.split('|')[0].trim();
        // The 'CHOICE' and 'SAY' commands are blocking and require user interaction.
        return command === 'CHOICE' || command === 'SAY';
    }

    /**
     * 解析並執行單行指令
     * 根據指令標記 (Command Token) 呼叫對應的模組功能。
     * 改為非同步方法，以支援 await 資源載入。
     */
    private async executeLine(line: string): Promise<void> {
        if (line.trim().startsWith('#')) return;

        const commandRegex = /\[([A-Z_]+):(.*)\]/;
        const match = line.match(commandRegex);

        if (match) {
            const command = match[1].trim();
            const args = match[2].split(',').map(arg => arg.trim());
            const assetMgr = this.kernel.assetManager;

            this.isWaitingForAsset = true;
            try {
                switch (command) {
                    case 'BGM_PLAY': {
                        const bgmKey = args[0];
                        const bgmVol = parseFloat(args[1]);
                        const bgmLoop = args[2] === 'true';
                        const success = await assetMgr.ensureLoaded(bgmKey, 'music');
                        if (success) {
                            const assetKey = bgmKey.split('/').pop() || bgmKey;
                            const audioAsset = assetMgr.getAsset(assetKey);
                            if (audioAsset instanceof HTMLAudioElement) {
                                this.kernel.audio.playBGM(audioAsset, bgmVol, bgmLoop);
                            }
                        }
                        break;
                    }
                    case 'BGM_STOP':
                        this.kernel.audio.stopBGM();
                        break;
                    case 'BGM_FADE_OUT':
                        this.kernel.audio.fadeOutBGM(parseFloat(args[0]));
                        break;
                    case 'BGM_FADE_IN':
                        this.kernel.audio.fadeInBGM(parseFloat(args[0]), args[1], parseFloat(args[2]), args[3] === 'true');
                        break;
                    case 'SFX_PLAY': {
                        const sfxKey = args[0];
                        const sfxVol = parseFloat(args[1]);
                        const success = await assetMgr.ensureLoaded(sfxKey, 'sound');
                        if (success) {
                            const assetKey = sfxKey.split('/').pop() || sfxKey;
                            const audioAsset = assetMgr.getAsset(assetKey);
                            if (audioAsset instanceof HTMLAudioElement) {
                                this.kernel.audio.playSFX(audioAsset.src, sfxVol);
                            }
                        }
                        break;
                    }
                    default:
                        console.error(`Unknown audio command: ${command}`);
                }
            } finally {
                this.isWaitingForAsset = false;
            }
            return;
        }
        
        const parts = line.split('|');
        const command = parts[0];

        switch (command) {
            case 'LABEL':
                break;
            case 'GOTO':
                const targetLabel = parts[1];
                if (this.labels[targetLabel] !== undefined) {
                    this.currentLineIndex = this.labels[targetLabel];
                } else {
                    console.error(`Label not found: ${targetLabel}`);
                }
                break;
            case 'CHOICE':
                const uiModuleChoice = this.kernel.uiModule;
                this.isWaitingForChoice = true;
                const choices: string[] = [];
                const targetLabels: string[] = [];
                for (let i = 1; i < parts.length; i++) {
                    const choiceParts = parts[i].split(':');
                    choices.push(choiceParts[0]);
                    targetLabels.push(choiceParts[1]);
                }
                if (uiModuleChoice) {
                    uiModuleChoice.clearDialog();
                    uiModuleChoice.showChoices(choices);
                    const handleChoice = (event: any) => {
                        const selectedLabel = event.detail;
                        const choiceIndex = choices.indexOf(selectedLabel);
                        if (choiceIndex !== -1) {
                            const target = targetLabels[choiceIndex];
                            if (this.labels[target] !== undefined) {
                                this.currentLineIndex = this.labels[target];
                                this.isWaitingForChoice = false;
                                window.removeEventListener('choiceMade', handleChoice);
                                this.next();
                            }
                        }
                    };
                    window.addEventListener('choiceMade', handleChoice);
                }
                break;
            case 'SAY':
                const speaker = parts[1];
                const content = parts[2] || "";
                const assetModuleSAY = this.kernel.assetManager;
                if (assetModuleSAY) {
                    const internalCharID = this.characterNameMap[speaker] || speaker;
                    this.positionMap.forEach((charID, pos) => {
                        const brightness = (charID === internalCharID) ? 1.0 : 0.6;
                        assetModuleSAY.setSpriteHighlight(pos, brightness);
                    });
                }
                const uiModule = this.kernel.uiModule;
                if (uiModule) {
                    uiModule.showDialog();
                    uiModule.renderText(speaker, content);
                }
                break;
            case 'BG':
                this.isWaitingForAsset = true;
                try {
                    await this.kernel.assetManager.setBG(parts[1]);
                } finally {
                    this.isWaitingForAsset = false;
                }
                break;
            case 'SPRITE':
                if (parts.length !== 4) {
                    console.error(`SPRITE 指令格式錯誤。 '${line}'`);
                    break;
                }
                this.isWaitingForAsset = true;
                try {
                    const charKey = parts[1];
                    const spritePos = parts[2];
                    const imgKey = parts[3];
                    this.positionMap.set(spritePos, charKey);
                    await this.kernel.assetManager.handleSpriteCommand(charKey, spritePos, imgKey);
                } finally {
                    this.isWaitingForAsset = false;
                }
                break;
            case 'SPRITE_CLR':
                if (parts.length !== 2) {
                    console.error(`SPRITE_CLR 指令格式錯誤。 '${line}'`);
                    break;
                }
                const clrPos = parts[1];
                this.positionMap.delete(clrPos);
                this.kernel.assetManager.clearSprite(clrPos);
                break;
            case 'CHARA':
                const subCommand = parts[1];
                const charModule = this.kernel.characterModule;
                if (!charModule) break;
                this.isWaitingForAsset = true;
                try {
                    switch (subCommand) {
                        case 'SHOW':
                            const charImg = parts[2];
                            const charPos = parts[3] as CharacterPosition;
                            const charName = charImg.split('_')[0];
                            this.positionMap.set(charPos, charName);
                            await charModule.show(charImg, charPos, charName);
                            break;
                        case 'HIDE':
                            charModule.hide(parts[2] as CharacterPosition);
                            break;
                        case 'CLEAR':
                            charModule.clear();
                            break;
                    }
                } finally {
                    this.isWaitingForAsset = false;
                }
                break;
            case 'SET':
                this.stateManager.setValue(parts[1], parseInt(parts[2]));
                break;
            case 'BGM':
            case 'SE':
                 this.isWaitingForAsset = true;
                 try {
                    const key = parts[1];
                    const type = command === 'BGM' ? 'music' : 'sound';
                    const success = await this.kernel.assetManager.ensureLoaded(key, type);
                    if (success) {
                        const assetKey = key.split('/').pop() || key;
                        const audioAsset = this.kernel.assetManager.getAsset(assetKey);
                        if (audioAsset instanceof HTMLAudioElement) {
                            if (command === 'BGM') {
                                this.kernel.audio.playBGM(audioAsset, 1.0, true);
                            } else {
                                this.kernel.audio.playSFX(audioAsset.src, 1.0);
                            }
                        }
                    }
                } finally {
                    this.isWaitingForAsset = false;
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
