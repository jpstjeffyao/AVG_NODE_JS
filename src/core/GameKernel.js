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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameKernel = void 0;
var CharacterModule_1 = require("../modules/CharacterModule");
var AssetManager_1 = require("../modules/AssetManager");
var AudioManager_1 = __importDefault(require("../modules/AudioManager"));
var StateManager_1 = require("./StateManager");
var ScriptEngine_1 = require("../modules/ScriptEngine");
var UIModule_1 = require("../modules/UIModule");
var GameKernel = /** @class */ (function () {
    function GameKernel() {
        this.modules = [];
        // 1. 核心管理器
        this.assetManager = new AssetManager_1.AssetManager();
        this.stateManager = new StateManager_1.StateManager();
        // 2. 功能模組
        this.characterModule = new CharacterModule_1.CharacterModule(this.assetManager);
        this.audio = new AudioManager_1.default();
        this.scriptEngine = new ScriptEngine_1.ScriptEngine(this.stateManager, this);
        this.uiModule = new UIModule_1.UIModule();
        // 3. 註冊模組
        this.registerModule(this.assetManager);
        this.registerModule(this.stateManager);
        this.registerModule(this.characterModule);
        this.registerModule(this.audio);
        this.registerModule(this.scriptEngine);
        this.registerModule(this.uiModule);
    }
    GameKernel.getInstance = function () {
        if (!GameKernel.instance) {
            GameKernel.instance = new GameKernel();
        }
        return GameKernel.instance;
    };
    GameKernel.prototype.registerModule = function (module) {
        this.modules.push(module);
    };
    GameKernel.prototype.update = function () {
        for (var _i = 0, _a = this.modules; _i < _a.length; _i++) {
            var module_1 = _a[_i];
            try {
                module_1.update();
            }
            catch (error) {
                console.error('Module update error:', error);
            }
        }
    };
    GameKernel.prototype.boot = function () {
        for (var _i = 0, _a = this.modules; _i < _a.length; _i++) {
            var module_2 = _a[_i];
            if (module_2 === this.audio) {
                this.audio.shutdown();
            }
            if (module_2 === this.audio) {
                this.audio.update();
            }
            if (module_2 && typeof module_2.initialize === 'function') {
                try {
                    module_2.initialize();
                }
                catch (error) {
                    console.error('Module initialization error:', error);
                }
            }
        }
    };
    /**
     * 當使用者點擊畫面時觸發
     * 處理打字機加速或執行下一行指令
     */
    GameKernel.prototype.onUserClick = function () {
        return __awaiter(this, void 0, void 0, function () {
            var uiModule, scriptEngine;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uiModule = this.modules.find(function (m) { return m.moduleName === "UIModule"; });
                        if (uiModule && uiModule.isTyping) {
                            uiModule.completeTyping();
                            return [2 /*return*/];
                        }
                        scriptEngine = this.modules.find(function (m) { return m.moduleName === "ScriptEngine"; });
                        if (!scriptEngine) return [3 /*break*/, 2];
                        // 等待腳本引擎執行下一行
                        return [4 /*yield*/, scriptEngine.next()];
                    case 1:
                        // 等待腳本引擎執行下一行
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 開始遊戲：觸發 ScriptEngine 的 next() 以載入第一條指令
     */
    GameKernel.prototype.startGame = function () {
        return __awaiter(this, void 0, void 0, function () {
            var scriptEngine;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        scriptEngine = this.modules.find(function (m) { return m.moduleName === "ScriptEngine"; });
                        if (!scriptEngine) return [3 /*break*/, 2];
                        // 等待腳本引擎執行下一行
                        return [4 /*yield*/, scriptEngine.next()];
                    case 1:
                        // 等待腳本引擎執行下一行
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    GameKernel.prototype.loadScript = function (script) {
        var scriptEngine = this.modules.find(function (m) { return m.moduleName === "ScriptEngine"; });
        if (scriptEngine) {
            scriptEngine.loadScript(script);
        }
    };
    /**
     * 啟動核心
     */
    GameKernel.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.startGame()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return GameKernel;
}());
exports.GameKernel = GameKernel;
if (typeof window !== 'undefined') {
    window.GameKernel = GameKernel;
}
