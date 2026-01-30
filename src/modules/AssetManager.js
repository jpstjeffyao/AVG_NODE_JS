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
exports.AssetManager = void 0;
/**
 * 資產管理器，負責載入與顯示背景、立繪等影像資源
 */
var AssetManager = /** @class */ (function () {
    function AssetManager() {
        this.moduleName = "AssetManager";
        this.cache = new Map();
        // 儲存立繪容器 DOM 參考，對應位置如 'left', 'center', 'right'
        this.spriteSlots = {};
        // 自動資源載入時嘗試的副檔名清單，提升腳本編寫的容錯率
        this.supportedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.mp3', '.wav', '.ogg', '.gif'];
        // 指令類型與資源目錄的映射關係
        this.typeSubDirs = {
            'bg': '/assets/bg/',
            'char': '/assets/char/',
            'music': '/assets/music/',
            'sound': '/assets/sound/',
        };
    }
    /**
     * 批次預載入資產
     */
    AssetManager.prototype.preload = function (assets) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = assets.map(function (asset) { return _this.load(asset.key, asset.src); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        console.log("[AssetManager] Preloaded ".concat(this.cache.size, " assets successfully."));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 載入資源並快取
     */
    AssetManager.prototype.load = function (key, url) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var element;
                        if (url.match(/\.(png|jpg|jpeg|webp|gif)$/)) {
                            element = new Image();
                            element.src = url;
                            element.onload = function () {
                                _this.cache.set(key, element);
                                resolve();
                            };
                            element.onerror = function (ev) {
                                var errorMsg = "[AssetManager] \u5716\u7247\u8F09\u5165\u5931\u6557: ".concat(url, "\uFF0C\u53EF\u80FD\u539F\u56E0: 404/500/MIME\u932F\u8AA4");
                                console.error(errorMsg, ev);
                                reject(new Error(errorMsg));
                            };
                        }
                        else if (url.match(/\.(mp3|wav|ogg)$/)) {
                            element = new Audio();
                            element.src = url;
                            element.oncanplaythrough = function () {
                                _this.cache.set(key, element);
                                resolve();
                            };
                            element.onerror = function (ev) {
                                var errorMsg = "[AssetManager] \u97F3\u8A0A\u8F09\u5165\u5931\u6557: ".concat(url, "\uFF0C\u53EF\u80FD\u539F\u56E0: 404/500/MIME\u932F\u8AA4");
                                console.error(errorMsg, ev);
                                reject(new Error(errorMsg));
                            };
                        }
                        else {
                            var errorMsg = "[AssetManager] \u4E0D\u652F\u63F4\u7684\u8CC7\u6E90\u985E\u578B: ".concat(url);
                            console.error(errorMsg);
                            reject(new Error(errorMsg));
                        }
                    })];
            });
        });
    };
    /**
     * 初始化資產層級
     */
    /**
     * 初始化遊戲畫面的基礎層級 (背景與立繪層)
     * 並動態建立立繪插槽以便後續放置角色圖片。
     */
    AssetManager.prototype.initialize = function () {
        var _this = this;
        var root = document.getElementById('game-root') || document.getElementById('app') || document.body;
        // 建立背景層：最底層，用於顯示場景圖片
        this.bgLayer = document.createElement('div');
        this.bgLayer.id = 'bg-layer';
        this.bgLayer.style.position = 'absolute';
        this.bgLayer.style.top = '0';
        this.bgLayer.style.left = '0';
        this.bgLayer.style.width = '100%';
        this.bgLayer.style.height = '100%';
        this.bgLayer.style.zIndex = '0';
        this.bgLayer.style.backgroundSize = 'cover';
        this.bgLayer.style.backgroundPosition = 'center';
        root.appendChild(this.bgLayer);
        // 建立立繪層：位於背景之上，對話框之下
        this.spriteLayer = document.createElement('div');
        this.spriteLayer.id = 'sprite-layer';
        this.spriteLayer.style.position = 'absolute';
        this.spriteLayer.style.top = '0';
        this.spriteLayer.style.left = '0';
        this.spriteLayer.style.width = '100%';
        this.spriteLayer.style.height = '100%';
        this.spriteLayer.style.zIndex = '1';
        this.spriteLayer.style.display = 'flex';
        // 使用 flex 佈局均分空間給左、中、右三個插槽
        this.spriteLayer.style.justifyContent = 'space-between';
        this.spriteLayer.style.alignItems = 'flex-end';
        // pointer-events 設定為 none，確保玩家點擊時能穿透此層觸發遊戲推進邏輯
        this.spriteLayer.style.pointerEvents = 'none';
        root.appendChild(this.spriteLayer);
        // 動態建立三個立繪插槽 (左、中、右)
        ['left', 'center', 'right'].forEach(function (pos) {
            var slot = document.createElement('div');
            slot.dataset.position = pos;
            slot.style.width = '33%'; // 每個插槽佔據 1/3 寬度
            slot.style.height = '100%';
            slot.style.display = 'flex';
            slot.style.justifyContent = 'center';
            slot.style.alignItems = 'flex-end';
            // 加入亮度切換動畫效果，讓說話者變換時更平滑
            slot.style.transition = 'filter 0.3s ease';
            _this.spriteLayer.appendChild(slot);
            _this.spriteSlots[pos] = slot;
        });
    };
    /**
     * 從快取中獲取資源
     * @param key 資源識別碼
     */
    AssetManager.prototype.getAsset = function (key) {
        return this.cache.get(key);
    };
    /**
     * 檢查資源快取，若無則嘗試從多個預期副檔名中載入資源。
     * 此設計允許腳本只需寫檔名 (如 'bg_room')，系統會自動嘗試 .png, .jpg 等。
     * @param key 資源原始名稱 (不含副檔名)
     * @param type 資源類型 ('bg' 或 'char')，用於決定搜尋路徑
     * @returns 載入成功與否的非同步結果
     */
    AssetManager.prototype.ensureLoaded = function (key, type) {
        return __awaiter(this, void 0, void 0, function () {
            var subDir, url, e_1, _i, _a, ext, url, e_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.cache.has(key))
                            return [2 /*return*/, true];
                        subDir = this.typeSubDirs[type] || "/".concat(type, "/");
                        // 顯示 Loading
                        this.dispatchLoading(true);
                        if (!/\.[a-z0-9]+$/i.test(key)) return [3 /*break*/, 4];
                        url = "".concat(subDir).concat(key);
                        console.log("[AssetManager] \u76F4\u63A5\u8F09\u5165\u8CC7\u6E90 URL: ".concat(url));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.load(key, url)];
                    case 2:
                        _b.sent();
                        this.dispatchLoading(false);
                        return [2 /*return*/, true];
                    case 3:
                        e_1 = _b.sent();
                        console.error("[AssetManager] \u76F4\u63A5\u8F09\u5165\u5931\u6557: ".concat(url));
                        this.dispatchLoading(false);
                        return [2 /*return*/, false];
                    case 4:
                        _i = 0, _a = this.supportedExtensions;
                        _b.label = 5;
                    case 5:
                        if (!(_i < _a.length)) return [3 /*break*/, 10];
                        ext = _a[_i];
                        url = "".concat(subDir).concat(key).concat(ext);
                        console.log("[AssetManager] \u5617\u8A66\u8F09\u5165\u8CC7\u6E90 URL: ".concat(url));
                        _b.label = 6;
                    case 6:
                        _b.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, this.load(key, url)];
                    case 7:
                        _b.sent();
                        this.dispatchLoading(false);
                        return [2 /*return*/, true];
                    case 8:
                        e_2 = _b.sent();
                        return [3 /*break*/, 9];
                    case 9:
                        _i++;
                        return [3 /*break*/, 5];
                    case 10:
                        console.error("[AssetManager] \u7121\u6CD5\u5728 ".concat(subDir, " \u627E\u5230\u8CC7\u6E90: ").concat(key));
                        // 顯示預設資源（圖片或音訊）
                        if (type === 'bg') {
                            if (this.bgLayer)
                                this.bgLayer.style.backgroundImage = 'url(/assets/bg/default_bg.png)';
                        }
                        else if (type === 'char') {
                            // 可選：插入預設立繪
                        }
                        else if (type === 'music' || type === 'sound') {
                            // 可選：播放預設音效
                        }
                        this.dispatchLoading(false);
                        return [2 /*return*/, false];
                }
            });
        });
    };
    /**
     * 發送全域載入狀態事件，供 UIModule 顯示 Loading 遮罩。
     */
    AssetManager.prototype.dispatchLoading = function (isLoading) {
        var event = new CustomEvent('assetLoading', { detail: { isLoading: isLoading } });
        window.dispatchEvent(event);
    };
    /**
     * 設定背景影像：從快取取得圖片並套用到背景層。
     * 改為非同步方法，確保資源載入後才執行顯示。
     * @param key 資源識別碼
     */
    AssetManager.prototype.setBG = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var success, img;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureLoaded(key, 'bg')];
                    case 1:
                        success = _a.sent();
                        if (success) {
                            img = this.cache.get(key);
                            if (img) {
                                this.bgLayer.style.backgroundImage = "url(".concat(img.src, ")");
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 處理由 ScriptEngine 解析後的立繪指令。
     * 負責資源的非同步確保載入與最終的 DOM 渲染。
     * @param charKey 角色識別碼 (用於 SAY 高亮判斷)
     * @param position 放置位置
     * @param imgKey 圖像識別碼 (用於路徑檢索)
     */
    AssetManager.prototype.handleSpriteCommand = function (charKey, position, imgKey) {
        return __awaiter(this, void 0, void 0, function () {
            var success;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[AssetManager] handleSpriteCommand - charKey: ".concat(charKey, ", position: ").concat(position, ", imgKey: ").concat(imgKey));
                        return [4 /*yield*/, this.ensureLoaded(imgKey, 'char')];
                    case 1:
                        success = _a.sent();
                        if (success) {
                            this.setSprite(imgKey, position, charKey);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 設定特定位置的立繪
     * @param key 資源識別碼
     * @param position 位置 ('left', 'center', 'right')
     * @param name 角色名稱（用於標記）
     */
    /**
     * 在特定插槽渲染立繪圖片。
     * @param key 圖片在快取中的 Key
     * @param position 插槽位置
     * @param name 綁定到 DOM 的角色名稱 (用於後續尋找對話者並高亮)
     */
    AssetManager.prototype.setSprite = function (key, position, name) {
        var _this = this;
        if (position === void 0) { position = 'center'; }
        if (name === void 0) { name = ''; }
        console.log("[AssetManager] setSprite - key: ".concat(key, ", position: ").concat(position, ", name: ").concat(name));
        var slot = this.spriteSlots[position];
        if (!slot) {
            console.error("[AssetManager] setSprite \u932F\u8AA4\uFF1A\u6307\u5B9A\u4E86\u7121\u6548\u7684\u4F4D\u7F6E\u3002\u9810\u671F\u70BA 'left', 'center', 'right'\uFF0C\u4F46\u6536\u5230\u4E86 '".concat(position, "'\u3002\u5B8C\u6574\u7684\u6307\u4EE4\u53C3\u6578\u70BA: key=").concat(key, ", name=").concat(name));
            return;
        }
        // 移除舊的圖片內容，確保一個插槽只有一個角色
        slot.innerHTML = '';
        console.log("[AssetManager] setSprite - \u627E\u5230 slot:", slot);
        var imgAsset = this.cache.get(key);
        if (imgAsset) {
            var img = document.createElement('img');
            img.src = imgAsset.src;
            // 將角色名稱存在 dataset 中，這是實現「說話者高亮」的關鍵
            img.dataset.name = name;
            img.style.maxHeight = '90%';
            img.style.maxWidth = '100%';
            img.style.objectFit = 'contain';
            slot.appendChild(img);
            console.log("圖片已插入插槽", img);
        }
        else {
            // 防呆處理：若直接呼叫此函式但快取沒圖，則重新嘗試載入
            this.ensureLoaded(key, 'char').then(function (success) {
                if (success)
                    _this.setSprite(key, position, name);
            });
        }
    };
    /**
     * 清除特定位置的立繪
     */
    AssetManager.prototype.clearSprite = function (position) {
        var slot = this.spriteSlots[position];
        if (slot) {
            slot.innerHTML = '';
        }
    };
    /**
     * 設定立繪亮度（用於說話者高亮）
     * @param position 位置
     * @param brightness 亮度值 (1.0 或 0.6)
     */
    AssetManager.prototype.setSpriteHighlight = function (position, brightness) {
        var slot = this.spriteSlots[position];
        if (slot) {
            slot.style.filter = "brightness(".concat(brightness, ")");
        }
    };
    AssetManager.prototype.update = function () { };
    AssetManager.prototype.shutdown = function () {
        if (this.bgLayer)
            this.bgLayer.remove();
        if (this.spriteLayer)
            this.spriteLayer.remove();
        this.cache.clear();
    };
    return AssetManager;
}());
exports.AssetManager = AssetManager;
