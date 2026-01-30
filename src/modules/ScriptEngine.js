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
exports.ScriptEngine = void 0;
/**
 * 腳本引擎，負責解析與執行遊戲腳本指令
 */
var ScriptEngine = /** @class */ (function () {
    function ScriptEngine(stateManager, kernel) {
        this.kernel = kernel;
        this.moduleName = "ScriptEngine";
        this.currentLineIndex = 0;
        this.scriptLines = [];
        this.labels = {};
        this.isWaitingForChoice = false;
        this.isWaitingForAsset = false;
        /**
         * 紀錄立繪位置與角色ID的對應關係。
         * 用於在執行 SAY 指令時，根據說話者名稱決定哪個位置的立繪需要高亮。
         * Key: 位置 (如 'left', 'center')
         * Value: 角色名稱 (如 'Hero')
         */
        this.positionMap = new Map();
        /**
         * 角色名稱對應表（統一腳本角色名與立繪ID）
         * key: 腳本中顯示名稱（如「伊莉莎白」），value: 立繪ID（如「elizabeth」）
         */
        this.characterNameMap = {
            '伊莉莎白': 'elizabeth',
            'elizabeth': 'elizabeth',
            '侍衛隊長': 'Captain',
            'Captain': 'Captain',
            '哥布林隊長': 'Goblin',
            'Goblin': 'Goblin',
            '系統': '', // 系統旁白不對應立繪
        };
        this.stateManager = stateManager;
    }
    /**
     * 載入腳本行並掃描標籤
     */
    ScriptEngine.prototype.loadScript = function (lines) {
        this.scriptLines = lines;
        this.scanLabels();
        this.currentLineIndex = 0; // 重設行號索引
    };
    /**
     * 掃描腳本中的 LABEL 指令並記錄位置
     */
    ScriptEngine.prototype.scanLabels = function () {
        var _this = this;
        this.labels = {};
        this.scriptLines.forEach(function (line, index) {
            if (line.trim().startsWith('#'))
                return;
            var parts = line.split('|');
            if (parts[0] === 'LABEL') {
                _this.labels[parts[1]] = index;
            }
        });
    };
    /**
     * 執行下一行指令
     * 改為非同步方法，等待當前指令執行完畢
     */
    ScriptEngine.prototype.next = function () {
        return __awaiter(this, void 0, void 0, function () {
            var line;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isWaitingForChoice || this.isWaitingForAsset)
                            return [2 /*return*/];
                        if (!(this.currentLineIndex < this.scriptLines.length)) return [3 /*break*/, 2];
                        line = this.scriptLines[this.currentLineIndex];
                        return [4 /*yield*/, this.executeLine(line)];
                    case 1:
                        _a.sent();
                        this.currentLineIndex++;
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 解析並執行單行指令
     * 根據指令標記 (Command Token) 呼叫對應的模組功能。
     * 改為非同步方法，以支援 await 資源載入。
     */
    ScriptEngine.prototype.executeLine = function (line) {
        return __awaiter(this, void 0, void 0, function () {
            var commandRegex, match, command_1, argString, args, bgmKey_1, bgmVol_1, bgmLoop_1, assetMgr_1, parts, command, kernel, modules, _a, targetLabel, uiModuleChoice, choices_1, targetLabels_1, i, choiceParts, handleChoice_1, speaker, content, assetModuleSAY_1, speakerKey_1, uiModule, bgKey, assetModuleBG, charKey, spritePos, imgKey, assetModuleSprite, clrPos, assetModuleClr, subCommand, charModule, _b, charImg, charPos, charName, hidePos, simpleBgmKey_1, audioModuleBGM_1, assetMgrSimple_1, seKey, audioModuleSE, variableValue, targetIfLabel;
            var _this = this;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (line.trim().startsWith('#'))
                            return [2 /*return*/];
                        commandRegex = /^\s*\[([A-Z_]+):\s*(.+)\]\s*$/;
                        match = line.match(commandRegex);
                        if (match) {
                            command_1 = match[1];
                            argString = match[2].replace(/\|/g, ',');
                            args = argString.split(',').map(function (arg) { return arg.trim(); });
                            switch (command_1) {
                                case 'BGM_PLAY':
                                    bgmKey_1 = args[0].replace(/^.*[\\\/]/, '');
                                    bgmVol_1 = parseFloat(args[1]);
                                    bgmLoop_1 = args[2] === 'true';
                                    assetMgr_1 = this.kernel.assetManager;
                                    this.isWaitingForAsset = true;
                                    assetMgr_1.ensureLoaded(bgmKey_1, 'music').then(function (success) {
                                        _this.isWaitingForAsset = false;
                                        if (success) {
                                            var audioAsset = assetMgr_1.getAsset(bgmKey_1);
                                            if (audioAsset instanceof HTMLAudioElement) {
                                                _this.kernel.audio.playBGM(audioAsset, bgmVol_1, bgmLoop_1);
                                            }
                                            else {
                                                // 容錯：若 getAsset 失敗但 ensureLoaded 成功，嘗試直接傳路徑
                                                _this.kernel.audio.playBGM(bgmKey_1, bgmVol_1, bgmLoop_1);
                                            }
                                        }
                                    });
                                    break;
                                case 'BGM_STOP':
                                    this.kernel.audio.stopBGM();
                                    break;
                                case 'BGM_FADE_OUT':
                                    this.kernel.audio.fadeOutBGM(parseFloat(args[0]));
                                    break;
                                case 'BGM_FADE_IN':
                                    this.kernel.audio.fadeInBGM(parseFloat(args[0]), args[1], parseFloat(args[2]), args[3] === 'true');
                                    break;
                                case 'SFX_PLAY':
                                    this.kernel.audio.playSFX(args[0], parseFloat(args[1]));
                                    break;
                                default:
                                    console.error("Unknown audio command: ".concat(command_1));
                            }
                            return [2 /*return*/];
                        }
                        parts = line.split('|');
                        command = parts[0];
                        kernel = (_c = window.GameKernel) === null || _c === void 0 ? void 0 : _c.getInstance();
                        modules = (kernel === null || kernel === void 0 ? void 0 : kernel.modules) || [];
                        _a = command;
                        switch (_a) {
                            case 'LABEL': return [3 /*break*/, 1];
                            case 'GOTO': return [3 /*break*/, 2];
                            case 'CHOICE': return [3 /*break*/, 3];
                            case 'SAY': return [3 /*break*/, 4];
                            case 'BG': return [3 /*break*/, 5];
                            case 'SPRITE': return [3 /*break*/, 10];
                            case 'SPRITE_CLR': return [3 /*break*/, 15];
                            case 'CHARA': return [3 /*break*/, 16];
                            case 'SET': return [3 /*break*/, 25];
                            case 'BGM': return [3 /*break*/, 26];
                            case 'SE': return [3 /*break*/, 27];
                            case 'IF': return [3 /*break*/, 28];
                        }
                        return [3 /*break*/, 29];
                    case 1: 
                    // LABEL 僅作為導覽標記，執行過程中無需邏輯處理
                    return [3 /*break*/, 30];
                    case 2:
                        targetLabel = parts[1];
                        if (this.labels[targetLabel] !== undefined) {
                            // 將當前行數索引移動到標籤所在位置
                            this.currentLineIndex = this.labels[targetLabel];
                        }
                        else {
                            console.error("Label not found: ".concat(targetLabel));
                        }
                        return [3 /*break*/, 30];
                    case 3:
                        uiModuleChoice = modules.find(function (m) { return m.moduleName === "UIModule"; });
                        this.isWaitingForChoice = true;
                        choices_1 = [];
                        targetLabels_1 = [];
                        // 解析選項文字與對應的標籤跳轉目標
                        for (i = 1; i < parts.length; i++) {
                            choiceParts = parts[i].split(':');
                            choices_1.push(choiceParts[0]);
                            targetLabels_1.push(choiceParts[1]);
                        }
                        // 呼叫 UIModule 渲染選項按鈕
                        if (uiModuleChoice) {
                            uiModuleChoice.clearDialog();
                            uiModuleChoice.showChoices(choices_1);
                            handleChoice_1 = function (event) {
                                var selectedLabel = event.detail;
                                var choiceIndex = choices_1.indexOf(selectedLabel);
                                if (choiceIndex !== -1) {
                                    var target = targetLabels_1[choiceIndex];
                                    if (_this.labels[target] !== undefined) {
                                        // 執行跳轉並解除等待狀態
                                        _this.currentLineIndex = _this.labels[target];
                                        _this.isWaitingForChoice = false;
                                        // 清除監聽器以防重複觸發
                                        window.removeEventListener('choiceMade', handleChoice_1);
                                        // 選擇後立即自動執行跳轉後的首行指令
                                        // 選擇後立即自動執行跳轉後的首行指令 (非同步呼叫)
                                        _this.next();
                                    }
                                }
                            };
                            window.addEventListener('choiceMade', handleChoice_1);
                        }
                        return [3 /*break*/, 30];
                    case 4:
                        speaker = parts[1];
                        content = parts[2] || "";
                        console.log("[ScriptEngine] SAY \u6307\u4EE4\u89E3\u6790 - speaker: ".concat(speaker, ", content: ").concat(content));
                        assetModuleSAY_1 = modules.find(function (m) { return m.moduleName === "AssetManager"; });
                        if (assetModuleSAY_1) {
                            speakerKey_1 = this.normalizeCharacterKey(speaker);
                            this.positionMap.forEach(function (charID, pos) {
                                var charKey = _this.normalizeCharacterKey(charID);
                                var brightness = (charKey && speakerKey_1 && charKey === speakerKey_1) ? 1.0 : 0.6;
                                assetModuleSAY_1.setSpriteHighlight(pos, brightness);
                            });
                        }
                        uiModule = modules.find(function (m) { return m.moduleName === "UIModule"; });
                        if (uiModule) {
                            console.log("[ScriptEngine] \u547C\u53EB UIModule.renderText - speaker: ".concat(speaker, ", content: ").concat(content));
                            uiModule.showDialog();
                            uiModule.renderText(speaker, content);
                        }
                        return [3 /*break*/, 30];
                    case 5:
                        bgKey = parts[1];
                        assetModuleBG = modules.find(function (m) { return m.moduleName === "AssetManager"; });
                        if (!assetModuleBG) return [3 /*break*/, 9];
                        // 設定資源載入等待狀態
                        this.isWaitingForAsset = true;
                        _d.label = 6;
                    case 6:
                        _d.trys.push([6, , 8, 9]);
                        // 呼叫非同步的 setBG 並等待完成
                        return [4 /*yield*/, assetModuleBG.setBG(bgKey)];
                    case 7:
                        // 呼叫非同步的 setBG 並等待完成
                        _d.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        this.isWaitingForAsset = false;
                        return [7 /*endfinally*/];
                    case 9: return [3 /*break*/, 30];
                    case 10:
                        // 立繪指令：SPRITE|角色識別碼|放置位置|圖像檔名稱
                        // 範例: SPRITE|Hero|left|hero_happy
                        if (parts.length !== 4) {
                            console.error("SPRITE \u6307\u4EE4\u683C\u5F0F\u932F\u8AA4\u3002\u9810\u671F\u683C\u5F0F: 'SPRITE|\u89D2\u8272Key|\u4F4D\u7F6E|\u5716\u50CFKey'\uFF0C\u4F46\u6536\u5230\u7684\u6307\u4EE4\u662F: '".concat(line, "'"));
                            return [3 /*break*/, 30];
                        }
                        charKey = parts[1];
                        spritePos = parts[2];
                        imgKey = parts[3];
                        console.log("[ScriptEngine] SPRITE \u6307\u4EE4\u89E3\u6790 - charKey: ".concat(charKey, ", position: ").concat(spritePos, ", imgKey: ").concat(imgKey));
                        // 更新內部對照表：讓引擎知道現在 'left' 位置站的是 'Hero'
                        this.positionMap.set(spritePos, charKey);
                        assetModuleSprite = modules.find(function (m) { return m.moduleName === "AssetManager"; });
                        if (!assetModuleSprite) return [3 /*break*/, 14];
                        // 設定資源載入等待狀態
                        this.isWaitingForAsset = true;
                        _d.label = 11;
                    case 11:
                        _d.trys.push([11, , 13, 14]);
                        // 委託 AssetManager 處理圖像載入與 DOM 更新，並等待完成
                        return [4 /*yield*/, assetModuleSprite.handleSpriteCommand(charKey, spritePos, imgKey)];
                    case 12:
                        // 委託 AssetManager 處理圖像載入與 DOM 更新，並等待完成
                        _d.sent();
                        return [3 /*break*/, 14];
                    case 13:
                        this.isWaitingForAsset = false;
                        return [7 /*endfinally*/];
                    case 14: return [3 /*break*/, 30];
                    case 15:
                        // 清除立繪指令：SPRITE_CLR|位置
                        if (parts.length !== 2) {
                            console.error("SPRITE_CLR \u6307\u4EE4\u683C\u5F0F\u932F\u8AA4\u3002\u9810\u671F\u683C\u5F0F: 'SPRITE_CLR|position'\uFF0C\u4F46\u6536\u5230\u7684\u6307\u4EE4\u662F: '".concat(line, "'"));
                            return [3 /*break*/, 30];
                        }
                        clrPos = parts[1];
                        // 從對照表中移除該位置的角色資訊
                        this.positionMap.delete(clrPos);
                        assetModuleClr = modules.find(function (m) { return m.moduleName === "AssetManager"; });
                        if (assetModuleClr && assetModuleClr.clearSprite) {
                            // 通知 AssetManager 移除對應 DOM 元素
                            assetModuleClr.clearSprite(clrPos);
                        }
                        return [3 /*break*/, 30];
                    case 16:
                        subCommand = parts[1];
                        charModule = kernel === null || kernel === void 0 ? void 0 : kernel.characterModule;
                        if (!charModule)
                            return [3 /*break*/, 30];
                        _b = subCommand;
                        switch (_b) {
                            case 'SHOW': return [3 /*break*/, 17];
                            case 'HIDE': return [3 /*break*/, 22];
                            case 'CLEAR': return [3 /*break*/, 23];
                        }
                        return [3 /*break*/, 24];
                    case 17:
                        charImg = parts[2];
                        charPos = parts[3];
                        charName = charImg.split('_')[0];
                        // 更新位置對照表以便高亮處理
                        this.positionMap.set(charPos, charName);
                        // 非同步執行 charModule.show 並等待
                        this.isWaitingForAsset = true;
                        _d.label = 18;
                    case 18:
                        _d.trys.push([18, , 20, 21]);
                        return [4 /*yield*/, charModule.show(charImg, charPos, charName)];
                    case 19:
                        _d.sent();
                        return [3 /*break*/, 21];
                    case 20:
                        this.isWaitingForAsset = false;
                        return [7 /*endfinally*/];
                    case 21: return [3 /*break*/, 24];
                    case 22:
                        hidePos = parts[2];
                        charModule.hide(hidePos);
                        return [3 /*break*/, 24];
                    case 23:
                        charModule.clear();
                        return [3 /*break*/, 24];
                    case 24: return [3 /*break*/, 30];
                    case 25:
                        this.stateManager.setValue(parts[1], parseInt(parts[2]));
                        return [3 /*break*/, 30];
                    case 26:
                        simpleBgmKey_1 = parts[1];
                        audioModuleBGM_1 = modules.find(function (m) { return m.moduleName === "AudioManager"; });
                        assetMgrSimple_1 = modules.find(function (m) { return m.moduleName === "AssetManager"; });
                        if (audioModuleBGM_1 && assetMgrSimple_1) {
                            this.isWaitingForAsset = true;
                            assetMgrSimple_1.ensureLoaded(simpleBgmKey_1, 'music').then(function (success) {
                                _this.isWaitingForAsset = false;
                                if (success) {
                                    var audioAsset = assetMgrSimple_1.getAsset(simpleBgmKey_1);
                                    if (audioAsset instanceof HTMLAudioElement) {
                                        audioModuleBGM_1.playBGM(audioAsset, 1.0, true);
                                    }
                                    else {
                                        audioModuleBGM_1.playBGM(simpleBgmKey_1, 1.0, true);
                                    }
                                }
                            });
                        }
                        return [3 /*break*/, 30];
                    case 27:
                        seKey = parts[1];
                        audioModuleSE = modules.find(function (m) { return m.moduleName === "AudioManager"; });
                        if (audioModuleSE) {
                            audioModuleSE.playSE(seKey);
                        }
                        return [3 /*break*/, 30];
                    case 28:
                        variableValue = this.stateManager.getValue(parts[1]);
                        targetIfLabel = parts[4];
                        if (variableValue === parseInt(parts[2])) {
                            if (this.labels[targetIfLabel] !== undefined) {
                                this.currentLineIndex = this.labels[targetIfLabel];
                            }
                        }
                        return [3 /*break*/, 30];
                    case 29:
                        console.error("Unknown command: ".concat(command));
                        _d.label = 30;
                    case 30: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 將角色名稱標準化（忽略大小寫、空白，並查對對應表）
     */
    ScriptEngine.prototype.normalizeCharacterKey = function (name) {
        if (!name)
            return '';
        var key = name.trim().toLowerCase();
        // 先查對應表，否則回傳原始小寫
        for (var display in this.characterNameMap) {
            if (display.trim().toLowerCase() === key) {
                return this.characterNameMap[display];
            }
        }
        return key;
    };
    ScriptEngine.prototype.initialize = function () {
        this.currentLineIndex = 0;
    };
    ScriptEngine.prototype.update = function () {
        // Update logic here if needed
    };
    ScriptEngine.prototype.shutdown = function () {
        // Shutdown logic here if needed
    };
    return ScriptEngine;
}());
exports.ScriptEngine = ScriptEngine;
