import { GameKernel } from './core/GameKernel';
import { IGameModule } from './core/IGameModule';
import { UIModule } from './modules/UIModule';

async function bootstrap() {
    console.log("Bootstrap starting...");
    const kernel = new GameKernel();

    // 將 kernel 實例暴露到 window 物件上
    (window as any).kernel = kernel;

    // 嘗試從 LocalStorage 載入主劇本 (Main Script)
    let initialScript: string[] = [];
    let scriptName: string = "Main"; // Default script name

    const savedScriptsStr = localStorage.getItem('scripteditor_scripts');
    if (savedScriptsStr) {
        try {
            const scripts = JSON.parse(savedScriptsStr);
            const mainScript = scripts.find((s: any) => s.isMain);
            if (mainScript) {
                const content = localStorage.getItem(`scripteditor_script_${mainScript.name}`);
                if (content) {
                    initialScript = content.split('\n')
                        .map((line: string) => line.trim())
                        .filter((line: string) => line.length > 0);
                    scriptName = mainScript.name; // Update script name
                    console.log(`[Bootstrap] Loading main script from LocalStorage: ${mainScript.name}`);
                }
            }
        } catch (e) {
            console.error("[Bootstrap] Failed to parse script list from LocalStorage", e);
        }
    }

    // 如果沒有設定主劇本，則載入預設測試劇本
    if (initialScript.length === 0) {
        console.log("[Bootstrap] No main script found, loading default test script");
        initialScript = [
            "# ========================",
            "# 預設測試劇情",
            "# ========================",
            "[BGM_PLAY: music/FairyTale.mp3, 0.6, true]",
            "BG|bg_07",
            "CHARA|SHOW|elizabeth_neutral_L|left",
            "SAY|伊莉莎白|今日的王座，依然沉重如往昔。",
            "SAY|伊莉莎白|百年的和平，並不是時間自然賜予的禮物。",
            "CHARA|SHOW|Captain_neutral|right",
            "SAY|侍衛隊長|陛下，邊境的巡邏隊回報異常。",
            "SAY|侍衛隊長|城鎮地下道，出現哥布林部隊的蹤跡。",
            "CHARA|SHOW|elizabeth_surprised_L|left",
            "SAY|伊莉莎白|……哥布林？",
            "SAY|伊莉莎白|他們已經多年未曾接近王都了。",
            "[SFX_PLAY: sound/gated-drop-sound-effect-240900.mp3, 0.5]",
            "CHARA|SHOW|elizabeth_neutral_L|left",
            "SAY|伊莉莎白|備馬。",
            "SAY|伊莉莎白|這次，我要親自看看裂痕從哪裡開始。",
            "MV|assets/mov/main.mp4",
            "BG|bg_04",
            "[SFX_PLAY: sound/mid-nights-sound-291477.mp3, 0.4]",
            "CHARA|SHOW|elizabeth_sad_L|left",
            "CHARA|SHOW|Captain_neutral|right",
            "SAY|伊莉莎白|夜晚的城鎮……比白日誠實得多。",
            "SAY|伊莉莎白|恐懼，藏不住。",
            "SAY|侍衛隊長|請您退後，陛下。",
            "SAY|侍衛隊長|地下道的氣味，不屬於人類，也不屬於妖精。",
            "BG|bg_20",
            "[SFX_PLAY: sound/mouse-squeaks-68287.mp3, 0.6]",
            "CHARA|SHOW|elizabeth_surprised_L|left",
            "SAY|伊莉莎白|這裡……曾是補給通道。",
            "SAY|伊莉莎白|如今卻成了怨恨的巢穴。",
            "BG|bg_02",
            "[SFX_PLAY: sound/door-creaking-sound-effect-241381.mp3, 0.6]",
            "CHARA|SHOW|Goblin_neutral|center",
            "SAY|哥布林隊長|……呵。",
            "SAY|哥布林隊長|妖精的女王，居然親自走進籠子裡。",
            "CHARA|SHOW|Captain_angry|right",
            "SAY|侍衛隊長|退下！",
            "SAY|侍衛隊長|我不允許你用那種眼神看陛下。",
            "CHOICE|以王之名審判哥布林:judge_path|嘗試談判，了解仇恨根源:talk_path",
            "LABEL|judge_path",
            "CHARA|SHOW|elizabeth_angry_L|left",
            "SAY|伊莉莎白|仇恨不是免罪的理由。",
            "SAY|伊莉莎白|在我的王國，踐踏邊境者，必須付出代價。",
            "CHARA|SHOW|Goblin_neutral|center",
            "SAY|哥布林隊長|……哈哈。",
            "SAY|哥布林隊長|原來女王，也只是站在高處說話。",
            "[SFX_PLAY: sound/desert-wind-gust-sound-effect-473421.mp3, 0.5]",
            "GOTO|ending",
            "LABEL|talk_path",
            "CHARA|SHOW|elizabeth_sad_L|left",
            "SAY|伊莉莎白|我無法替過去贖罪。",
            "SAY|伊莉莎白|但我可以選擇，不讓仇恨再繁殖。",
            "CHARA|SHOW|Goblin_neutral|center",
            "SAY|哥布林隊長|……",
            "SAY|哥布林隊長|如果這是謊言，我會親手撕碎和平。",
            "CHARA|SHOW|Captain_neutral|right",
            "SAY|侍衛隊長|那就由我來見證。",
            "SAY|侍衛隊長|作為人類，也作為劍。",
            "GOTO|ending",
            "LABEL|ending",
            "[BGM_FADE_OUT: 5]",
            "CHARA|CLEAR",
            "BG|bg_05",
            "SAY|系統|在這一夜，仇恨沒有消失。",
            "SAY|系統|但世界，選擇了暫時不再流血。",
            "SAY|系統|——預設劇本結束。"
        ];
        scriptName = "Default_Test_Script"; // Set default name
    }

    kernel.scriptEngine.loadScript(initialScript, scriptName);

    // 啟動 (這會初始化所有模組，包含顯示 MENU)
    kernel.initializeModules();

    console.log("Game Kernel Booted!");

    // 開啟編輯器按鈕邏輯
    const openEditorBtn = document.getElementById('open-editor-button');
    if (openEditorBtn) {
        openEditorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open('script_editor.html', 'ScriptEditor', 'width=800,height=600');
        });
    }

    // 接收來自編輯器的訊息
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_SCRIPT') {
            const scriptLines = event.data.script.split('\n')
                .map((line: string) => line.trim())
                .filter((line: string) => line.length > 0 && !line.startsWith('#'));
            console.log("Received script update from editor:", scriptLines);

            // Editor scripts are usually anonymous or temp, but we can give them a name
            kernel.loadScript(scriptLines, "EditorScript");
            kernel.initializeModules();
            kernel.start();

            const uiModule = kernel.modules?.find((m: IGameModule) => m.moduleName === "UIModule") as UIModule | undefined;
            if (uiModule) {
                uiModule.hideMenu();
                uiModule.showDialog();
            }
        }
    });
}

window.onload = () => {
    bootstrap().catch(err => console.error("Bootstrap error:", err));
};