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
exports.CharacterModule = void 0;
/**
 * CharacterModule 負責管理遊戲中的立繪（角色圖像）顯示與切換
 */
var CharacterModule = /** @class */ (function () {
    function CharacterModule(assetManager) {
        this.moduleName = "CharacterModule";
        this.container = null;
        this.activeCharacters = new Map();
        this.assetManager = assetManager;
    }
    /**
     * 初始化模組，取得立繪容器元素
     */
    CharacterModule.prototype.setup = function () {
        this.container = document.querySelector("#character-container");
        if (!this.container) {
            // Fallback to spriteLayer if the dedicated container doesn't exist
            this.container = document.querySelector("#sprite-layer");
        }
        if (!this.container) {
            console.error("Neither '#character-container' nor '#sprite-layer' found in the DOM.");
        }
    };
    /**
     * 符合 IGameModule 介面的初始化方法
     */
    CharacterModule.prototype.initialize = function () {
        this.setup();
    };
    /**
     * 每幀更新邏輯 (暫無)
     */
    CharacterModule.prototype.update = function () {
        // No update logic for now
    };
    /**
     * 關閉模組，清理資源
     */
    CharacterModule.prototype.shutdown = function () {
        this.clear();
    };
    /**
     * 顯示或替換指定位置的立繪，委託 AssetManager 處理載入與渲染
     * @param characterId 圖像識別碼
     * @param position 顯示位置
     * @param name 角色名稱（用於高亮）
     */
    CharacterModule.prototype.show = function (characterId_1, position_1) {
        return __awaiter(this, arguments, void 0, function (characterId, position, name) {
            if (name === void 0) { name = ""; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.assetManager.handleSpriteCommand(name, position, characterId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 隱藏指定位置的立繪
     * @param position 顯示位置
     */
    CharacterModule.prototype.hide = function (position) {
        var img = this.activeCharacters.get(position);
        if (img) {
            img.remove();
            this.activeCharacters.delete(position);
        }
    };
    /**
     * 清除所有位置的立繪
     */
    CharacterModule.prototype.clear = function () {
        this.activeCharacters.forEach(function (img) {
            img.remove();
        });
        this.activeCharacters.clear();
    };
    return CharacterModule;
}());
exports.CharacterModule = CharacterModule;
