import { GameKernel } from './core/GameKernel';
import { StateManager } from './core/StateManager';
import { ScriptEngine } from './modules/ScriptEngine';
import { UIModule } from './modules/UIModule';
import { AssetManager } from './modules/AssetManager';
import { AudioManager } from './modules/AudioManager';

const gameAssets = [
   { key: 'bg_room', src: 'assets/bg/bg_room.jpg' },
   { key: 'hero', src: 'assets/char/hero.png' },
   { key: 'hero_happy', src: 'assets/char/hero_happy.png' }
];

async function bootstrap() {
   console.log("Bootstrap starting...");
   const kernel = GameKernel.getInstance();

    // 將 kernel 實例暴露到 window 物件上，以便 UIModule 存取
    (window as any).kernel = kernel;

    const stateManager = new StateManager();
    const scriptEngine = new ScriptEngine(stateManager);
    const uiModule = new UIModule();
    const assetManager = new AssetManager();
    const audioManager = new AudioManager();

    kernel.registerModule(stateManager);
    kernel.registerModule(scriptEngine);
    kernel.registerModule(uiModule);
    kernel.registerModule(assetManager);
    kernel.registerModule(audioManager);

   // 預載入遊戲資產
   try {
       await assetManager.preload(gameAssets);
   } catch (e) {
       console.warn("[Bootstrap] Preload failed, but continuing...", e);
   }

   // 載入測試劇本
    scriptEngine.loadScript([
        "BGM|https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "BG|bg_room",
        "SAY|謎之聲|歡迎來到這場實驗。 (聽聽看背景音樂)",
        "SPRITE|hero|char_hero",
        "SAY|主角|這裡是...網頁環境？",
        "CHOICE|去冒險:route_a|留在這裡:route_b",
        "LABEL|route_a",
        "SE|https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "SAY|主角|我選擇去冒險！ (剛才應該有音效)",
        "GOTO|end",
        "LABEL|route_b",
        "SAY|主角|我還是留在這裡好了。",
        "LABEL|end",
        "SAY|謎之聲|實驗結束。"
    ]);

    // 啟動 (這會初始化所有模組，包含顯示 MENU)
    kernel.boot();


    console.log("Game Kernel Booted!");

    // 開啟編輯器按鈕邏輯
    const openEditorBtn = document.getElementById('open-editor-button');
    if (openEditorBtn) {
        openEditorBtn.addEventListener('click', () => {
            window.open('script_editor.html', 'ScriptEditor', 'width=800,height=600');
        });
    }

    // 接收來自編輯器的訊息
    window.addEventListener('message', (event) => {
        // 檢查訊息內容是否有 script
        if (event.data && event.data.type === 'UPDATE_SCRIPT') {
            const scriptLines = event.data.script.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);
            console.log("Received script update from editor:", scriptLines);
            
            // 重新載入並執行新劇本
            kernel.loadScript(scriptLines);
            kernel.start();
            
            // 隱藏 MENU 畫面（如果有 UIModule 提供的話）
            const menu = document.getElementById('menu-screen');
            if (menu) menu.style.display = 'none';
        }
    });
}

window.onload = () => {
    bootstrap().catch(err => console.error("Bootstrap error:", err));
};
