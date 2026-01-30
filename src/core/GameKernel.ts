import { CharacterModule } from '../modules/CharacterModule';

export class GameKernel {
    private static instance: GameKernel;

    public characterModule: CharacterModule;
    public modules: any[] = [];

    private constructor() {
        this.characterModule = new CharacterModule();
        this.registerModule(this.characterModule);
    }

    public static getInstance(): GameKernel {
        if (!GameKernel.instance) {
            GameKernel.instance = new GameKernel();
        }
        return GameKernel.instance;
    }

    public registerModule(module: any): void {
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

    public boot(): void {
        for (const module of this.modules) {
            if (module && typeof module.initialize === 'function') {
                try {
                    module.initialize();
                } catch (error) {
                    console.error('Module initialization error:', error);
                }
            }
        }
    }

    /**
     * 當使用者點擊畫面時觸發
     * 處理打字機加速或執行下一行指令
     */
    public async onUserClick(): Promise<void> {
        const uiModule = this.modules.find(m => m.moduleName === "UIModule");
        if (uiModule && uiModule.isTyping) {
            uiModule.completeTyping();
            return;
        }

        const scriptEngine = this.modules.find(m => m.moduleName === "ScriptEngine");
        if (scriptEngine) {
            // 等待腳本引擎執行下一行
            await scriptEngine.next();
        }
    }

    /**
     * 開始遊戲：觸發 ScriptEngine 的 next() 以載入第一條指令
     */
    public async startGame(): Promise<void> {
        const scriptEngine = this.modules.find(m => m.moduleName === "ScriptEngine");
        if (scriptEngine) {
            // 等待腳本引擎執行下一行
            await scriptEngine.next();
        }
    }

    public loadScript(script: string[]): void {
        const scriptEngine = this.modules.find(m => m.moduleName === "ScriptEngine");
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

if (typeof window !== 'undefined') {
    (window as any).GameKernel = GameKernel;
}
