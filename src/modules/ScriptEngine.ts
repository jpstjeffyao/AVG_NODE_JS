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
    private isWaitingForVideo: boolean = false;

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
        if (this.isWaitingForChoice || this.isWaitingForAsset || this.isWaitingForVideo) return;

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

        // 移除舊的方括號格式音訊指令解析
        // 現在統一使用管道符號格式 (例如: BGM_PLAY|filename|volume|loop)

        const parts = line.split('|');
        const command = parts[0].trim().toUpperCase(); // 指令改為不分大小寫

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
                if (this.kernel.characterModule) { // Use characterModule directly
                    const internalCharID = this.characterNameMap[speaker] || speaker;
                    this.positionMap.forEach((charID, pos) => {
                        const brightness = (charID === internalCharID) ? 1.0 : 0.6;
                        this.kernel.characterModule.setSpriteHighlight(pos as CharacterPosition, brightness);
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
                    // 檢查是否有震動參數 (parts[2])
                    if (parts.length > 2) {
                        const shakeIntensity = parseFloat(parts[2]);
                        if (!isNaN(shakeIntensity) && shakeIntensity > 0) {
                            this.kernel.assetManager.shakeBG(shakeIntensity);
                        }
                    }
                } finally {
                    this.isWaitingForAsset = false;
                }
                break;
            // REMOVED SPRITE command handler as CharacterModule now handles sprite display
            case 'SPRITE_CLR':
                if (parts.length !== 2) {
                    console.error(`SPRITE_CLR 指令格式錯誤。 '${line}'`);
                    break;
                }
                const clrPos = parts[1] as CharacterPosition; // Cast to CharacterPosition
                this.positionMap.delete(clrPos);
                if (this.kernel.characterModule) { // Use characterModule.hide
                    this.kernel.characterModule.hide(clrPos);
                }
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
            case 'CALL_SCRIPT':
                const nextScriptName = parts[1];
                const nextScriptContent = localStorage.getItem(`scripteditor_script_${nextScriptName}`);
                if (nextScriptContent) {
                    const nextLines = nextScriptContent.split('\n');
                    console.log(`[ScriptEngine] Switching to script: ${nextScriptName}`);
                    this.loadScript(nextLines);
                    // loadScript resets currentLineIndex to 0, so the loop will continue from the start of the new script
                } else {
                    console.error(`[ScriptEngine] Script not found in LocalStorage: ${nextScriptName}`);
                }
                break;
            case 'BGM_PLAY': {
                // 語法: BGM_PLAY|檔案名稱|音量|是否循環
                // 範例: BGM_PLAY|001.wav|0.7|true
                const filename = parts[1];
                const volume = parseFloat(parts[2]);
                const loop = parts[3] === 'true';
                const fullPath = `assets/music/${filename}`;

                this.isWaitingForAsset = true;
                try {
                    const success = await this.kernel.assetManager.ensureLoaded(fullPath, 'music');
                    if (success) {
                        const audioAsset = this.kernel.assetManager.getAsset(filename);
                        if (audioAsset instanceof HTMLAudioElement) {
                            this.kernel.audio.playBGM(audioAsset, volume, loop);
                        }
                    }
                } finally {
                    this.isWaitingForAsset = false;
                }
                break;
            }
            case 'BGM_STOP':
                // 語法: BGM_STOP
                // 立即停止背景音樂
                this.kernel.audio.stopBGM();
                break;
            case 'BGM_FADE_OUT': {
                // 語法: BGM_FADE_OUT|秒數
                // 範例: BGM_FADE_OUT|5
                const duration = parseFloat(parts[1]);
                this.kernel.audio.fadeOutBGM(duration);
                break;
            }
            case 'BGM_FADE_IN': {
                // 語法: BGM_FADE_IN|秒數|檔案名稱|目標音量|是否循環
                // 範例: BGM_FADE_IN|3|001.wav|0.6|true
                const duration = parseFloat(parts[1]);
                const filename = parts[2];
                const targetVolume = parseFloat(parts[3]);
                const loop = parts[4] === 'true';
                const fullPath = `assets/music/${filename}`;

                this.kernel.audio.fadeInBGM(duration, fullPath, targetVolume, loop);
                break;
            }
            case 'SFX_PLAY': {
                // 語法: SFX_PLAY|檔案名稱|音量
                // 範例: SFX_PLAY|night_insects.wav|0.5
                const filename = parts[1];
                const volume = parseFloat(parts[2]);
                const fullPath = `assets/sound/${filename}`;

                this.isWaitingForAsset = true;
                try {
                    const success = await this.kernel.assetManager.ensureLoaded(fullPath, 'sound');
                    if (success) {
                        const audioAsset = this.kernel.assetManager.getAsset(filename);
                        if (audioAsset instanceof HTMLAudioElement) {
                            this.kernel.audio.playSFX(audioAsset.src, volume);
                        }
                    }
                } finally {
                    this.isWaitingForAsset = false;
                }
                break;
            }
            case 'IF':
                const variableValue = this.stateManager.getValue(parts[1]);
                const targetIfLabel = parts[4];
                if (variableValue === parseInt(parts[2])) {
                    if (this.labels[targetIfLabel] !== undefined) {
                        this.currentLineIndex = this.labels[targetIfLabel];
                    }
                }
                break;
            case 'MV': { // Play Video with optional volume
                // 語法: MV|檔案名稱|音量(可選)
                // 範例: MV|main.mp4|1.0
                const filename = parts[1];
                const volume = parts.length > 2 ? parseFloat(parts[2]) : 1.0;
                const fullPath = `assets/mov/${filename}`; // 路徑固定在 assets/mov/

                if (this.kernel.uiModule) {
                    this.isWaitingForVideo = true;
                    try {
                        await this.kernel.uiModule.playVideo(fullPath, volume);
                    } finally {
                        this.isWaitingForVideo = false;
                    }
                }
                break;
            }
            default:
                console.error(`Unknown command: ${command}`);
        }
    }

    initialize(): void {
        this.currentLineIndex = 0;
        this.positionMap.clear();
    }

    update(): void {
        // Update logic here if needed
    }

    shutdown(): void {
        // Shutdown logic here if needed
    }
}
