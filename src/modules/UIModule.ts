import { IGameModule } from '../core/IGameModule';

/**
 * UI 模組，負責對話視窗、選項選單及選單畫面的顯示與互動
 */
export class UIModule implements IGameModule {
  moduleName = "UIModule";
  private _container: HTMLElement | null = null; // 對話 UI 容器
  private _menuScreen: HTMLElement | null = null; // MENU 畫面容器
  private _dialogContainer: HTMLElement | null = null; // 同 _container，供內部更清晰引用
  private _isTyping: boolean = false;
  private _typingTimer: number | null = null;
  private _fullText: string = "";
  private _loadingOverlay: HTMLElement | null = null;
  private _isScriptEnd: boolean = false;

  /**
   * 外部查詢目前是否正在執行打字機文字渲染
   */
  public get isTyping(): boolean {
    return this._isTyping;
  }

  /**
   * 處理全螢幕點擊事件，用於推進遊戲腳本或跳過打字動畫
   */
  private handleDocumentClick = (): void => {
    if (this._isScriptEnd) {
      this.triggerPostScriptFlow();
      return;
    }
    (window as any).GameKernel?.getInstance()?.onUserClick();
  };

  /**
   * 處理空白鍵事件，行為與 handleDocumentClick 一致
   */
  private handleDocumentSpaceKey = (event: KeyboardEvent): void => {
    // 僅於主視窗啟用，不影響 script_editor.html
    if (window.location.pathname.includes('script_editor.html')) return;

    if (event.code === 'Space') {
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' ||
                     target.tagName === 'TEXTAREA' ||
                     target.isContentEditable ||
                     target.classList.contains('script-editor');
      
      if (!isInput) {
        event.preventDefault(); // 防止頁面滾動
        if (this._isScriptEnd) {
          this.triggerPostScriptFlow();
        } else {
          (window as any).GameKernel?.getInstance()?.onUserClick();
        }
      }
    }
  };

  /**
   * 初始化 UI 模組：綁定 DOM 元素與事件監聽器
   */
  initialize(): void {
    // 取得主要的畫面容器元素
    this._menuScreen = document.getElementById("menu-screen");
    this._dialogContainer = document.getElementById("avg-ui");
    this._container = this._dialogContainer;

    // 確保 UI 容器在立繪層 (z-index: 1) 之上
    if (this._dialogContainer) {
      this._dialogContainer.style.zIndex = '100';
    }

    // 綁定主選單 (Title Screen) 的按鈕事件
    const btnNewGame = document.getElementById("btn-new-game");
    const btnLoadGame = document.getElementById("btn-load-game");
    const btnSettings = document.getElementById("btn-settings");

    if (btnNewGame) btnNewGame.addEventListener("click", () => this.onNewGameClick());
    if (btnLoadGame) btnLoadGame.addEventListener("click", () => this.onLoadGameClick());
    if (btnSettings) btnSettings.addEventListener("click", () => this.onSettingsClick());

    // 設定初始視覺狀態：進入頁面時先顯示主選單，對話框預設隱藏
    this.showMenu();
    this.hideDialog();

    // 監聽全螢幕點擊，這是 AVG 推進劇情的核心互動方式
    document.addEventListener("click", this.handleDocumentClick);
    document.addEventListener("keydown", this.handleDocumentSpaceKey);

    // 監聽來自 AssetManager 的載入狀態事件，顯示/隱藏 Loading 畫面
    window.addEventListener('assetLoading', (e: any) => {
      this.toggleLoading(e.detail.isLoading);
    });

    // 監聽劇情結束觸發事件，執行淡出效果
    window.addEventListener('postScriptFlowTriggered', () => {
      this.performFadeOut();
    });

    // 監聽淡出結束事件，自動返回主選單並重設狀態
    window.addEventListener('fadeOutComplete', () => {
      this.returnToMainMenu();
    });
  }

  /**
   * 進入劇情結束狀態，等待玩家觸發後續流程
   */
  public enterScriptEndState(): void {
    console.log("[UIModule] 進入 ScriptEnd 狀態，等待玩家推進...");
    this._isScriptEnd = true;
  }

  /**
   * 觸發劇情結束後的流程（如淡出效果）
   */
  private triggerPostScriptFlow(): void {
    console.log("[UIModule] 玩家觸發劇情結束後流程");
    // 這裡觸發後續流程，例如自定義事件
    window.dispatchEvent(new CustomEvent("postScriptFlowTriggered"));
    
    // 依據規格，淡出效果與返回主選單邏輯將於後續子任務處理
    // 本任務僅實作監聽與觸發
  }

  /**
   * 執行畫面淡出（漸暗）效果
   * 動畫時間約 1.5~2 秒，結束後 dispatch 'fadeOutComplete'
   */
  private performFadeOut(): void {
    console.log("[UIModule] 開始執行淡出效果...");

    // 建立全螢幕黑色遮罩
    const overlay = document.createElement('div');
    overlay.id = 'fade-out-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'black';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 2s ease-in-out';
    overlay.style.zIndex = '10000'; // 確保在最上層
    overlay.style.pointerEvents = 'none'; // 避免阻擋後續可能的點擊，雖然已經結束

    document.body.appendChild(overlay);

    // 強制重繪以觸發 CSS Transition
    overlay.offsetHeight;

    // 開始淡出
    overlay.style.opacity = '1';

    // 監聽動畫結束
    const onTransitionEnd = () => {
      overlay.removeEventListener('transitionend', onTransitionEnd);
      console.log("[UIModule] 淡出效果完成");
      
      // 通知主流程
      window.dispatchEvent(new CustomEvent("fadeOutComplete"));

      // 延遲移除遮罩，確保畫面切換完成後再消失
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.remove();
        }
      }, 500);
    };

    overlay.addEventListener('transitionend', onTransitionEnd);
  }

  /**
   * 自動返回主選單並重設相關模組狀態
   */
  private returnToMainMenu(): void {
    console.log("[UIModule] 收到 fadeOutComplete，執行返回主選單流程...");

    // 1. 隱藏對話框，顯示主選單
    this.hideDialog();
    this.showMenu();

    // 2. 重設 UI 本身狀態
    this._isScriptEnd = false;

    // 3. 重設其他核心模組狀態 (透過 GameKernel)
    const kernel = (window as any).GameKernel?.getInstance();
    if (kernel) {
      // 重設腳本引擎狀態，避免殘留在結束狀態
      if (kernel.scriptEngine) {
        kernel.scriptEngine.initialize();
      }
      
      // 清除立繪與背景 (視需求，通常返回主選單應清空畫面)
      if (kernel.assetManager) {
        kernel.assetManager.clearAllVisuals();
      }
      
      if (kernel.characterModule) {
        kernel.characterModule.clear();
      }
    }
  }

  /**
   * 顯示或隱藏 Loading 提示
   */
  private toggleLoading(show: boolean): void {
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
    } else {
      if (this._loadingOverlay) {
        this._loadingOverlay.style.display = 'none';
      }
    }
  }

  /**
   * 顯示 MENU 畫面
   */
  public showMenu(): void {
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
  }

  /**
   * 隱藏 MENU 畫面
   */
  public hideMenu(): void {
    if (this._menuScreen) {
      this._menuScreen.style.display = "none";
    }
  }

  /**
   * 顯示對話 UI
   */
  public showDialog(): void {
    if (this._dialogContainer) {
      this._dialogContainer.style.display = "flex";
    }
  }

  /**
   * 隱藏對話 UI
   */
  public hideDialog(): void {
    if (this._dialogContainer) {
      this._dialogContainer.style.display = "none";
    }
  }

  /**
   * 點擊「開始遊戲」
   */
  private onNewGameClick(): void {
      console.log("UIModule: New Game Clicked");
      this.hideMenu();
      this.showDialog();

      // 重設 UI 狀態
      this._isScriptEnd = false;

      // 透過暴露在 window 的 kernel 啟動遊戲
      const kernel = (window as any).GameKernel?.getInstance();
      if (kernel) {
          kernel.startGame();
      }
  }

  /**
   * 點擊「繼續遊戲」
   */
  private onLoadGameClick(): void {
    console.log("UIModule: Load Game Clicked - Not Implemented");
    alert("繼續遊戲功能尚未實作！");
  }

  /**
   * 點擊「系統設定」
   */
  private onSettingsClick(): void {
    console.log("UIModule: Settings Clicked - Not Implemented");
    alert("系統設定功能尚未實作！");
  }

  /**
   * 渲染對話文字，並啟動打字機效果。同時會觸發說話者立繪高亮邏輯。
   * @param name 說話者名稱 (會顯示在名稱框)
   * @param content 對話文字內容
   */
  renderText(name: string, content: string): void {
    if (!this._container) return;

    // 如果上一次打字尚未完成，先清除舊的計時器
    if (this._typingTimer !== null) {
      window.clearInterval(this._typingTimer);
      this._typingTimer = null;
    }

    // 取得名稱框與內容框元素
    const nameBox = this._container.querySelector("#speaker");
    const contentBox = this._container.querySelector("#content") as HTMLElement;

    if (nameBox) {
      nameBox.textContent = name;
    }

    // 當有人說話時，通知畫面更新立繪亮度，突顯當前發言者
    this.updateSpriteHighlights(name);

    if (contentBox) {
      this._fullText = content;
      contentBox.textContent = ""; // 先清空文字
      this._isTyping = true;

      let currentIndex = 0;
      // 啟動打字機效果計時器
      this._typingTimer = window.setInterval(() => {
        if (currentIndex < this._fullText.length) {
          contentBox.textContent += this._fullText[currentIndex];
          currentIndex++;
        } else {
          // 全部文字顯示完畢
          this.completeTyping();
        }
      }, 40); // 每一格字元間隔 40 毫秒
    }
  }

  /**
   * 根據說話者名稱，高亮對應位置的立繪，其餘變暗
   * @param speakerName 當前說話者
   */
  private updateSpriteHighlights(speakerName: string): void {
    const kernel = (window as any).GameKernel?.getInstance();
    const assetModule = kernel?.modules.find((m: any) => m.moduleName === "AssetManager");

    if (assetModule) {
      // 遍歷所有位置，檢查是否有該角色的立繪
      ['left', 'center', 'right'].forEach(pos => {
        const slot = (assetModule as any).spriteSlots[pos];
        if (slot) {
          const img = slot.querySelector('img');
          
          let brightness = 1.0;
          if (speakerName && speakerName.trim() !== "") {
            // 有明確說話者時，非說話者變暗 (0.6)
            // 立繪亮度比對也需支援名稱對應與標準化
            let isSpeaker = false;
            if (img && img.dataset.name) {
              // 取得 ScriptEngine 的 normalizeCharacterKey 方法
              const kernel = (window as any).GameKernel?.getInstance();
              const scriptEngine = kernel?.scriptEngine;
              if (scriptEngine && typeof scriptEngine.normalizeCharacterKey === 'function') {
                const imgKey = scriptEngine.normalizeCharacterKey(img.dataset.name);
                const speakerKey = scriptEngine.normalizeCharacterKey(speakerName);
                isSpeaker = (imgKey && speakerKey && imgKey === speakerKey);
              } else {
                isSpeaker = img.dataset.name === speakerName;
              }
            }
            brightness = isSpeaker ? 1.0 : 0.6;
          } else {
            // 若 speakerName 為空（旁白），則所有角色亮度設為 1.0
            brightness = 1.0;
          }
          
          assetModule.setSpriteHighlight(pos, brightness);
        }
      });
    }
  }

  /**
   * 立即完成打字效果（用於玩家在文字渲染中途點擊畫面時跳過動畫）
   */
  public completeTyping(): void {
    if (!this._isTyping) return;

    // 停止計時器
    if (this._typingTimer !== null) {
      window.clearInterval(this._typingTimer);
      this._typingTimer = null;
    }

    // 補完所有文字內容
    if (this._container) {
      const contentBox = this._container.querySelector("#content");
      if (contentBox) {
        contentBox.textContent = this._fullText;
      }
    }

    this._isTyping = false;
  }

  /**
   * 在畫面中央顯示分支選項按鈕
   * @param choices 選項文字陣列 (例如 ['走左邊', '走右邊'])
   */
  showChoices(choices: string[]): void {
    if (!this._container) return;

    // 動態建立存放按鈕的容器，並置中顯示
    const choiceContainer = document.createElement("div");
    choiceContainer.id = "choice-container";
    choiceContainer.style.position = "absolute";
    choiceContainer.style.top = "50%";
    choiceContainer.style.left = "50%";
    choiceContainer.style.transform = "translate(-50%, -50%)";
    choiceContainer.style.display = "flex";
    choiceContainer.style.flexDirection = "column";
    choiceContainer.style.gap = "10px";
    choiceContainer.style.zIndex = "1000";

    choices.forEach((label) => {
      const button = document.createElement("button");
      button.innerText = label;
      button.className = "choice-button";
      button.style.padding = "10px 20px";
      button.style.fontSize = "18px";
      button.style.cursor = "pointer";

      button.addEventListener("click", (e) => {
        // 防止事件冒泡到全螢幕點擊
        e.stopPropagation();

        // 觸發自定義事件，傳遞選擇的標籤
        const event = new CustomEvent("choiceMade", { detail: label });
        window.dispatchEvent(event);

        // 移除所有選項按鈕
        choiceContainer.remove();
      });

      choiceContainer.appendChild(button);
    });

    this._container.appendChild(choiceContainer);
  }

  showOptions(choices: string[]): Promise<number> {
    // 預留：未實作
    return Promise.resolve(0);
  }

  clear(): void {
    console.log("[UIModule] clear called");
    if (!this._container) {
      console.warn("[UIModule] clear: _container is null");
      return;
    }
    const nameBox = this._container.querySelector("#speaker");
    const contentBox = this._container.querySelector("#content");
    console.log("[UIModule] clear: elements found", { nameBox: !!nameBox, contentBox: !!contentBox });
    if (nameBox) {
      nameBox.textContent = "";
    }
    if (contentBox) {
      contentBox.textContent = "";
    }
  }

  /**
   * 清除對話視窗內容（角色名稱與對話文字），但不隱藏容器
   */
  clearDialog(): void {
    if (!this._container) {
      console.warn("[UIModule] clearDialog: _container is null");
      return;
    }
    const nameBox = this._container.querySelector("#speaker");
    const contentBox = this._container.querySelector("#content");
    if (nameBox) {
      nameBox.textContent = "";
    }
    if (contentBox) {
      contentBox.textContent = "";
    }
  }

  update(): void {}
  shutdown(): void {}

  /**
   * 釋放資源：移除事件監聽器
   */
  dispose(): void {
    document.removeEventListener("click", this.handleDocumentClick);
    document.removeEventListener("keydown", this.handleDocumentSpaceKey);
  }
}

// 在全域範圍加入類型定義
declare global {
  interface Window {
    GameKernel?: any;
    UIModule?: any;
  }
}

// 將 UIModule 加入全域變數或適當的模組管理系統
// 以便在其他地方可以取得實例
(window as any).UIModule = UIModule;
