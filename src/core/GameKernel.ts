import { CharacterModule } from '../modules/CharacterModule';
import { AssetManager } from '../modules/AssetManager';
import AudioManager from '../modules/AudioManager';
import { StateManager, GameState } from './StateManager';
import { ScriptEngine } from '../modules/ScriptEngine';
import { UIModule } from '../modules/UIModule';
import { IGameModule } from './IGameModule';

export class GameKernel {
    public assetManager: AssetManager;
    public characterModule: CharacterModule;
    public stateManager: StateManager;
    public scriptEngine: ScriptEngine;
    public uiModule: UIModule;
    public audio: AudioManager;
    public modules: IGameModule[] = [];

    public constructor() {
        // 1. 核心管理器
        this.assetManager = new AssetManager();
        this.stateManager = new StateManager();
        
        // 2. 功能模組
        this.characterModule = new CharacterModule(this.assetManager);
        this.audio = new AudioManager();
        this.scriptEngine = new ScriptEngine(this.stateManager, this);
        this.uiModule = new UIModule(this);

        // 3. 註冊模組
        this.registerModule(this.assetManager);
        this.registerModule(this.stateManager);
        this.registerModule(this.characterModule);
        this.registerModule(this.audio);
        this.registerModule(this.scriptEngine);
        this.registerModule(this.uiModule);
    }

    public registerModule(module: IGameModule): void {
        this.modules.push(module);
    }

    public update(): void {
        for (const module of this.modules) {
            try {
                module.update();
            } catch (error) {
                console.error('Module update error:', error);
            }
        }
    }

    public initializeModules(): void {
        for (const module of this.modules) {
            if (module && typeof module.initialize === 'function') {
                try {
                    module.initialize();
                } catch (error) {
                    console.error(`Error initializing module ${module.moduleName || '(unknown)'}:`, error);
                }
            }
        }
    }

    /**
     * 當使用者點擊畫面時觸發
     * 處理打字機加速或執行下一行指令
     */
    public async onUserClick(): Promise<void> {
        if (this.stateManager.getState() === GameState.STATE_TITLE) {
            return;
        }

        // 檢查是否處於等待結束互動狀態
        if (this.stateManager.getState() === GameState.STATE_WAIT_END_INTERACTION) {
            this.stateManager.setState(GameState.STATE_FADING_OUT);
            const uiModule = this.uiModule;
            if (uiModule) {
                await uiModule.fadeOut(2000); // 2秒淡出
                console.log("[GameKernel] Fade out complete, notifying main flow...");
                // 這裡根據指示，僅需實作淡出動畫與觸發機制，不需處理返回主選單。
                // 但我們會在這裡發送一個事件或日誌，代表通知主流程。
                window.dispatchEvent(new CustomEvent('avg_fade_complete'));
            }
            return;
        }

        // 若正在淡出中，忽略點擊
        if (this.stateManager.getState() === GameState.STATE_FADING_OUT) {
            return;
        }

        const uiModule = this.uiModule;
        const scriptEngine = this.scriptEngine;
        if (scriptEngine) {
            // 等待腳本引擎執行下一行
            await scriptEngine.next();
        }
    }

    /**
     * 開始遊戲：觸發 ScriptEngine 的 next() 以載入第一條指令
     */
    public async startGame(): Promise<void> {
        this.stateManager.setState(GameState.STATE_PLAYING);
        const scriptEngine = this.scriptEngine;
        if (scriptEngine) {
            // 重置腳本引擎狀態 (行號歸零、清除暫存狀態)
            scriptEngine.initialize();
            // 等待腳本引擎執行下一行
            await scriptEngine.next();
        }
    }

    public loadScript(script: string[]): void {
        const scriptEngine = this.scriptEngine;
        if (scriptEngine) {
            scriptEngine.loadScript(script);
        }
    }

    /**
     * 啟動核心
     */
    public async start(): Promise<void> {
        await this.startGame();
    }
}

