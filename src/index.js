"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var GameKernel_1 = require("./core/GameKernel");
var gameAssets = [
    { key: 'bg_room', src: 'assets/bg/bg_room.jpg' },
    { key: 'hero', src: 'assets/char/hero.png' },
    { key: 'hero_happy', src: 'assets/char/hero_happy.png' }
];
function bootstrap() {
    return __awaiter(this, void 0, void 0, function () {
        var kernel, e_1, openEditorBtn;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Bootstrap starting...");
                    kernel = GameKernel_1.GameKernel.getInstance();
                    // 將 kernel 實例暴露到 window 物件上
                    window.kernel = kernel;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, kernel.assetManager.preload(gameAssets)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    console.warn("[Bootstrap] Preload failed, but continuing...", e_1);
                    return [3 /*break*/, 4];
                case 4:
                    // 載入測試劇本
                    kernel.scriptEngine.loadScript([
                        "# =========================",
                        "# 主選單後的正式劇情開始",
                        "# =========================",
                        "[BGM_PLAY: FairyTale.mp3, 0.6, true]",
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
                        "SFX_PLAY|assets/sound/gated-drop-sound-effect-240900.mp3|0.5",
                        "CHARA|SHOW|elizabeth_neutral_L|left",
                        "SAY|伊莉莎白|備馬。",
                        "SAY|伊莉莎白|這次，我要親自看看裂痕從哪裡開始。",
                        "# =========================",
                        "# 夜晚的城鎮",
                        "# =========================",
                        "BG|bg_04",
                        "SFX_PLAY|assets/sound/mid-nights-sound-291477.mp3|0.4",
                        "CHARA|SHOW|elizabeth_sad_L|left",
                        "CHARA|SHOW|Captain_neutral|right",
                        "SAY|伊莉莎白|夜晚的城鎮……比白日誠實得多。",
                        "SAY|伊莉莎白|恐懼，藏不住。",
                        "SAY|侍衛隊長|請您退後，陛下。",
                        "SAY|侍衛隊長|地下道的氣味，不屬於人類，也不屬於妖精。",
                        "# =========================",
                        "# 地下道 → 地牢",
                        "# =========================",
                        "BG|bg_20",
                        "SFX_PLAY|assets/sound/mouse-squeaks-68287.mp3|0.6",
                        "CHARA|SHOW|elizabeth_surprised_L|left",
                        "SAY|伊莉莎白|這裡……曾是補給通道。",
                        "SAY|伊莉莎白|如今卻成了怨恨的巢穴。",
                        "BG|bg_02",
                        "SFX_PLAY|assets/sound/door-creaking-sound-effect-241381.mp3|0.6",
                        "CHARA|SHOW|Goblin_neutral|center",
                        "SAY|哥布林隊長|……呵。",
                        "SAY|哥布林隊長|妖精的女王，居然親自走進籠子裡。",
                        "CHARA|SHOW|Captain_angry|right",
                        "SAY|侍衛隊長|退下！",
                        "SAY|侍衛隊長|我不允許你用那種眼神看陛下。",
                        "# =========================",
                        "# 三者對峙",
                        "# =========================",
                        "CHARA|SHOW|elizabeth_neutral_L|left",
                        "SAY|伊莉莎白|你就是這支部隊的隊長。",
                        "SAY|伊莉莎白|你的眼神……不是掠奪者的飢餓。",
                        "SAY|伊莉莎白|而是記憶。",
                        "CHARA|SHOW|Goblin_surprised|center",
                        "SAY|哥布林隊長|記憶？",
                        "SAY|哥布林隊長|那是人類屠村時留下的聲音！",
                        "CHARA|SHOW|Captain_sad|right",
                        "SAY|侍衛隊長|……",
                        "SAY|侍衛隊長|那不是我，但我無法否認，那是人類。",
                        "# =========================",
                        "# 選擇：王的裁決",
                        "# =========================",
                        "CHOICE|以王之名審判哥布林:judge_path|嘗試談判，了解仇恨根源:talk_path",
                        "# =========================",
                        "# 分支 A：審判",
                        "# =========================",
                        "LABEL|judge_path",
                        "CHARA|SHOW|elizabeth_angry_L|left",
                        "SAY|伊莉莎白|仇恨不是免罪的理由。",
                        "SAY|伊莉莎白|在我的王國，踐踏邊境者，必須付出代價。",
                        "CHARA|SHOW|Goblin_neutral|center",
                        "SAY|哥布林隊長|……哈哈。",
                        "SAY|哥布林隊長|原來女王，也只是站在高處說話。",
                        "SFX_PLAY|assets/sound/desert-wind-gust-sound-effect-473421.mp3|0.5",
                        "GOTO|ending",
                        "# =========================",
                        "# 分支 B：談判",
                        "# =========================",
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
                        "# =========================",
                        "# 結局收束",
                        "# =========================",
                        "LABEL|ending",
                        "BGM_FADE_OUT|5",
                        "CHARA|CLEAR",
                        "BG|bg_05",
                        "SAY|系統|在這一夜，仇恨沒有消失。",
                        "SAY|系統|但世界，選擇了暫時不再流血。",
                        "SAY|系統|——劇情範本結束。"
                    ]);
                    // 啟動 (這會初始化所有模組，包含顯示 MENU)
                    kernel.boot();
                    console.log("Game Kernel Booted!");
                    openEditorBtn = document.getElementById('open-editor-button');
                    if (openEditorBtn) {
                        openEditorBtn.addEventListener('click', function () {
                            window.open('script_editor.html', 'ScriptEditor', 'width=800,height=600');
                        });
                    }
                    // 接收來自編輯器的訊息
                    window.addEventListener('message', function (event) {
                        var _a;
                        // 檢查訊息內容是否有 script
                        if (event.data && event.data.type === 'UPDATE_SCRIPT') {
                            var scriptLines = event.data.script.split('\n')
                                .map(function (line) { return line.trim(); })
                                .filter(function (line) { return line.length > 0 && !line.startsWith('#'); });
                            console.log("Received script update from editor:", scriptLines);
                            // 重新載入並執行新劇本
                            kernel.loadScript(scriptLines);
                            kernel.boot();
                            kernel.start();
                            // 透過 UIModule 隱藏選單與顯示對話框
                            var uiModule = (_a = kernel.modules) === null || _a === void 0 ? void 0 : _a.find(function (m) { return m.moduleName === "UIModule"; });
                            if (uiModule) {
                                uiModule.hideMenu();
                                uiModule.showDialog();
                            }
                            else {
                                var menu = document.getElementById('menu-screen');
                                if (menu)
                                    menu.style.display = 'none';
                            }
                        }
                    });
                    return [2 /*return*/];
            }
        });
    });
}
window.onload = function () {
    bootstrap().catch(function (err) { return console.error("Bootstrap error:", err); });
};
