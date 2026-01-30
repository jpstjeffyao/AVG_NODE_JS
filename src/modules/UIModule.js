"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIModule = void 0;
/**
 * UI 模組，負責對話視窗、選項選單及選單畫面的顯示與互動
 */
var UIModule = /** @class */ (function () {
    function UIModule() {
        this.moduleName = "UIModule";
        this._container = null; // 對話 UI 容器
        this._menuScreen = null; // MENU 畫面容器
        this._dialogContainer = null; // 同 _container，供內部更清晰引用
        this._isTyping = false;
        this._typingTimer = null;
        this._fullText = "";
        this._loadingOverlay = null;
        /**
         * 處理全螢幕點擊事件，用於推進遊戲腳本或跳過打字動畫
         */
        this.handleDocumentClick = function () {
            var _a, _b;
            (_b = (_a = window.GameKernel) === null || _a === void 0 ? void 0 : _a.getInstance()) === null || _b === void 0 ? void 0 : _b.onUserClick();
        };
        /**
         * 處理空白鍵事件，行為與 handleDocumentClick 一致
         */
        this.handleDocumentSpaceKey = function (event) {
            var _a, _b;
            // 僅於主視窗啟用，不影響 script_editor.html
            if (window.location.pathname.includes('script_editor.html'))
                return;
            if (event.code === 'Space') {
                var target = event.target;
                var isInput = target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable ||
                    target.classList.contains('script-editor');
                if (!isInput) {
                    event.preventDefault(); // 防止頁面滾動
                    (_b = (_a = window.GameKernel) === null || _a === void 0 ? void 0 : _a.getInstance()) === null || _b === void 0 ? void 0 : _b.onUserClick();
                }
            }
        };
    }
    Object.defineProperty(UIModule.prototype, "isTyping", {
        /**
         * 外部查詢目前是否正在執行打字機文字渲染
         */
        get: function () {
            return this._isTyping;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * 初始化 UI 模組：綁定 DOM 元素與事件監聽器
     */
    UIModule.prototype.initialize = function () {
        var _this = this;
        // 取得主要的畫面容器元素
        this._menuScreen = document.getElementById("menu-screen");
        this._dialogContainer = document.getElementById("avg-ui");
        this._container = this._dialogContainer;
        // 確保 UI 容器在立繪層 (z-index: 1) 之上
        if (this._dialogContainer) {
            this._dialogContainer.style.zIndex = '100';
        }
        // 綁定主選單 (Title Screen) 的按鈕事件
        var btnNewGame = document.getElementById("btn-new-game");
        var btnLoadGame = document.getElementById("btn-load-game");
        var btnSettings = document.getElementById("btn-settings");
        if (btnNewGame)
            btnNewGame.addEventListener("click", function () { return _this.onNewGameClick(); });
        if (btnLoadGame)
            btnLoadGame.addEventListener("click", function () { return _this.onLoadGameClick(); });
        if (btnSettings)
            btnSettings.addEventListener("click", function () { return _this.onSettingsClick(); });
        // 設定初始視覺狀態：進入頁面時先顯示主選單，對話框預設隱藏
        this.showMenu();
        this.hideDialog();
        // 監聽全螢幕點擊，這是 AVG 推進劇情的核心互動方式
        document.addEventListener("click", this.handleDocumentClick);
        document.addEventListener("keydown", this.handleDocumentSpaceKey);
        // 監聽來自 AssetManager 的載入狀態事件，顯示/隱藏 Loading 畫面
        window.addEventListener('assetLoading', function (e) {
            _this.toggleLoading(e.detail.isLoading);
        });
    };
    /**
     * 顯示或隱藏 Loading 提示
     */
    UIModule.prototype.toggleLoading = function (show) {
        if (show) {
            if (!this._loadingOverlay) {
                this._loadingOverlay = document.createElement('div');
                this._loadingOverlay.id = 'loading-overlay';
                this._loadingOverlay.style.position = 'fixed';
                this._loadingOverlay.style.top = '0';
                this._loadingOverlay.style.left = '0';
                this._loadingOverlay.style.width = '100%';
                this._loadingOverlay.style.height = '100%';
                this._loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
                this._loadingOverlay.style.color = 'white';
                this._loadingOverlay.style.display = 'flex';
                this._loadingOverlay.style.justifyContent = 'center';
                this._loadingOverlay.style.alignItems = 'center';
                this._loadingOverlay.style.zIndex = '9999';
                this._loadingOverlay.innerHTML = '<div>Loading...</div>';
                document.body.appendChild(this._loadingOverlay);
            }
            this._loadingOverlay.style.display = 'flex';
        }
        else {
            if (this._loadingOverlay) {
                this._loadingOverlay.style.display = 'none';
            }
        }
    };
    /**
     * 顯示 MENU 畫面
     */
    UIModule.prototype.showMenu = function () {
        console.log("[UIModule] showMenu called");
        if (this._menuScreen) {
            this._menuScreen.style.display = "flex";
        }
        // 顯示選單時，除了清除內容，也要確保打字機計時器被清除
        this.clear();
        if (this._typingTimer !== null) {
            window.clearInterval(this._typingTimer);
            this._typingTimer = null;
            this._isTyping = false;
            console.log("[UIModule] showMenu: typingTimer stopped");
        }
    };
    /**
     * 隱藏 MENU 畫面
     */
    UIModule.prototype.hideMenu = function () {
        if (this._menuScreen) {
            this._menuScreen.style.display = "none";
        }
    };
    /**
     * 顯示對話 UI
     */
    UIModule.prototype.showDialog = function () {
        if (this._dialogContainer) {
            this._dialogContainer.style.display = "flex";
        }
    };
    /**
     * 隱藏對話 UI
     */
    UIModule.prototype.hideDialog = function () {
        if (this._dialogContainer) {
            this._dialogContainer.style.display = "none";
        }
    };
    /**
     * 點擊「開始遊戲」
     */
    UIModule.prototype.onNewGameClick = function () {
        var _a;
        console.log("UIModule: New Game Clicked");
        this.hideMenu();
        this.showDialog();
        // 透過暴露在 window 的 kernel 啟動遊戲
        var kernel = (_a = window.GameKernel) === null || _a === void 0 ? void 0 : _a.getInstance();
        if (kernel) {
            kernel.startGame();
        }
    };
    /**
     * 點擊「繼續遊戲」
     */
    UIModule.prototype.onLoadGameClick = function () {
        console.log("UIModule: Load Game Clicked - Not Implemented");
        alert("繼續遊戲功能尚未實作！");
    };
    /**
     * 點擊「系統設定」
     */
    UIModule.prototype.onSettingsClick = function () {
        console.log("UIModule: Settings Clicked - Not Implemented");
        alert("系統設定功能尚未實作！");
    };
    /**
     * 渲染對話文字，並啟動打字機效果。同時會觸發說話者立繪高亮邏輯。
     * @param name 說話者名稱 (會顯示在名稱框)
     * @param content 對話文字內容
     */
    UIModule.prototype.renderText = function (name, content) {
        var _this = this;
        if (!this._container)
            return;
        // 如果上一次打字尚未完成，先清除舊的計時器
        if (this._typingTimer !== null) {
            window.clearInterval(this._typingTimer);
            this._typingTimer = null;
        }
        // 取得名稱框與內容框元素
        var nameBox = this._container.querySelector("#speaker");
        var contentBox = this._container.querySelector("#content");
        if (nameBox) {
            nameBox.textContent = name;
        }
        // 當有人說話時，通知畫面更新立繪亮度，突顯當前發言者
        this.updateSpriteHighlights(name);
        if (contentBox) {
            this._fullText = content;
            contentBox.textContent = ""; // 先清空文字
            this._isTyping = true;
            var currentIndex_1 = 0;
            // 啟動打字機效果計時器
            this._typingTimer = window.setInterval(function () {
                if (currentIndex_1 < _this._fullText.length) {
                    contentBox.textContent += _this._fullText[currentIndex_1];
                    currentIndex_1++;
                }
                else {
                    // 全部文字顯示完畢
                    _this.completeTyping();
                }
            }, 40); // 每一格字元間隔 40 毫秒
        }
    };
    /**
     * 根據說話者名稱，高亮對應位置的立繪，其餘變暗
     * @param speakerName 當前說話者
     */
    UIModule.prototype.updateSpriteHighlights = function (speakerName) {
        var _a;
        var kernel = (_a = window.GameKernel) === null || _a === void 0 ? void 0 : _a.getInstance();
        var assetModule = kernel === null || kernel === void 0 ? void 0 : kernel.modules.find(function (m) { return m.moduleName === "AssetManager"; });
        if (assetModule) {
            // 遍歷所有位置，檢查是否有該角色的立繪
            ['left', 'center', 'right'].forEach(function (pos) {
                var _a;
                var slot = assetModule.spriteSlots[pos];
                if (slot) {
                    var img = slot.querySelector('img');
                    var brightness = 1.0;
                    if (speakerName && speakerName.trim() !== "") {
                        // 有明確說話者時，非說話者變暗 (0.6)
                        // 立繪亮度比對也需支援名稱對應與標準化
                        var isSpeaker = false;
                        if (img && img.dataset.name) {
                            // 取得 ScriptEngine 的 normalizeCharacterKey 方法
                            var kernel_1 = (_a = window.GameKernel) === null || _a === void 0 ? void 0 : _a.getInstance();
                            var scriptEngine = kernel_1 === null || kernel_1 === void 0 ? void 0 : kernel_1.scriptEngine;
                            if (scriptEngine && typeof scriptEngine.normalizeCharacterKey === 'function') {
                                var imgKey = scriptEngine.normalizeCharacterKey(img.dataset.name);
                                var speakerKey = scriptEngine.normalizeCharacterKey(speakerName);
                                isSpeaker = (imgKey && speakerKey && imgKey === speakerKey);
                            }
                            else {
                                isSpeaker = img.dataset.name === speakerName;
                            }
                        }
                        brightness = isSpeaker ? 1.0 : 0.6;
                    }
                    else {
                        // 若 speakerName 為空（旁白），則所有角色亮度設為 1.0
                        brightness = 1.0;
                    }
                    assetModule.setSpriteHighlight(pos, brightness);
                }
            });
        }
    };
    /**
     * 立即完成打字效果（用於玩家在文字渲染中途點擊畫面時跳過動畫）
     */
    UIModule.prototype.completeTyping = function () {
        if (!this._isTyping)
            return;
        // 停止計時器
        if (this._typingTimer !== null) {
            window.clearInterval(this._typingTimer);
            this._typingTimer = null;
        }
        // 補完所有文字內容
        if (this._container) {
            var contentBox = this._container.querySelector("#content");
            if (contentBox) {
                contentBox.textContent = this._fullText;
            }
        }
        this._isTyping = false;
    };
    /**
     * 在畫面中央顯示分支選項按鈕
     * @param choices 選項文字陣列 (例如 ['走左邊', '走右邊'])
     */
    UIModule.prototype.showChoices = function (choices) {
        if (!this._container)
            return;
        // 動態建立存放按鈕的容器，並置中顯示
        var choiceContainer = document.createElement("div");
        choiceContainer.id = "choice-container";
        choiceContainer.style.position = "absolute";
        choiceContainer.style.top = "50%";
        choiceContainer.style.left = "50%";
        choiceContainer.style.transform = "translate(-50%, -50%)";
        choiceContainer.style.display = "flex";
        choiceContainer.style.flexDirection = "column";
        choiceContainer.style.gap = "10px";
        choiceContainer.style.zIndex = "1000";
        choices.forEach(function (label) {
            var button = document.createElement("button");
            button.innerText = label;
            button.className = "choice-button";
            button.style.padding = "10px 20px";
            button.style.fontSize = "18px";
            button.style.cursor = "pointer";
            button.addEventListener("click", function (e) {
                // 防止事件冒泡到全螢幕點擊
                e.stopPropagation();
                // 觸發自定義事件，傳遞選擇的標籤
                var event = new CustomEvent("choiceMade", { detail: label });
                window.dispatchEvent(event);
                // 移除所有選項按鈕
                choiceContainer.remove();
            });
            choiceContainer.appendChild(button);
        });
        this._container.appendChild(choiceContainer);
    };
    UIModule.prototype.showOptions = function (choices) {
        // 預留：未實作
        return Promise.resolve(0);
    };
    UIModule.prototype.clear = function () {
        console.log("[UIModule] clear called");
        if (!this._container) {
            console.warn("[UIModule] clear: _container is null");
            return;
        }
        var nameBox = this._container.querySelector("#speaker");
        var contentBox = this._container.querySelector("#content");
        console.log("[UIModule] clear: elements found", { nameBox: !!nameBox, contentBox: !!contentBox });
        if (nameBox) {
            nameBox.textContent = "";
        }
        if (contentBox) {
            contentBox.textContent = "";
        }
    };
    /**
     * 清除對話視窗內容（角色名稱與對話文字），但不隱藏容器
     */
    UIModule.prototype.clearDialog = function () {
        if (!this._container) {
            console.warn("[UIModule] clearDialog: _container is null");
            return;
        }
        var nameBox = this._container.querySelector("#speaker");
        var contentBox = this._container.querySelector("#content");
        if (nameBox) {
            nameBox.textContent = "";
        }
        if (contentBox) {
            contentBox.textContent = "";
        }
    };
    UIModule.prototype.update = function () { };
    UIModule.prototype.shutdown = function () { };
    /**
     * 釋放資源：移除事件監聽器
     */
    UIModule.prototype.dispose = function () {
        document.removeEventListener("click", this.handleDocumentClick);
        document.removeEventListener("keydown", this.handleDocumentSpaceKey);
    };
    return UIModule;
}());
exports.UIModule = UIModule;
// 將 UIModule 加入全域變數或適當的模組管理系統
// 以便在其他地方可以取得實例
window.UIModule = UIModule;
