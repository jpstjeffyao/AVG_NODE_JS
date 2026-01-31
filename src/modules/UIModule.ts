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
  private _fadeOverlay: HTMLElement | null = null;

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
        (window as any).GameKernel?.getInstance()?.onUserClick();
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

    // 監聽淡出完成事件，自動回到主選單
    window.addEventListener('avg_fade_complete', async () => {
      console.log("[UIModule] Received avg_fade_complete event");
      const kernel = (window as any).GameKernel?.getInstance();
      if (kernel) {
        // 僅於劇情結束並完成淡出（STATE_FADING_OUT）時觸發
        if (kernel.stateManager.getState() === "STATE_FADING_OUT") {
          kernel.stateManager.setState("STATE_TITLE");
          this.hideDialog();

          // 確保背景更換回主畫面圖片
          const assetModule = kernel.modules.find((m: any) => m.moduleName === "AssetManager");
          if (assetModule) {
            await assetModule.setBG("Main");
          }

          // 確保背景層可見

          const bgLayer = assetModule?.getBGLayer();
          if (bgLayer) {
            bgLayer.style.display = 'block';
            bgLayer.style.opacity = '1';
          }
          
          this.showMenu();
          
          // 移除淡出遮罩（若存在）
          if (this._fadeOverlay) {
            this._fadeOverlay.style.display = 'none';
            this._fadeOverlay.style.opacity = '0';
          }
        }
      }
    });
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
            const isSpeaker = img && img.dataset.name === speakerName;
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
   * 執行畫面淡出效果
   * @param duration 動畫持續時間 (毫秒)
   * @returns Promise 當動畫完成時 resolve
   */
  public fadeOut(duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      if (!this._fadeOverlay) {
        this._fadeOverlay = document.createElement('div');
        this._fadeOverlay.id = 'fade-overlay';
        this._fadeOverlay.style.position = 'fixed';
        this._fadeOverlay.style.top = '0';
        this._fadeOverlay.style.left = '0';
        this._fadeOverlay.style.width = '100%';
        this._fadeOverlay.style.height = '100%';
        this._fadeOverlay.style.backgroundColor = 'black';
        this._fadeOverlay.style.pointerEvents = 'none';
        this._fadeOverlay.style.zIndex = '10000';
        document.body.appendChild(this._fadeOverlay);
      }

      let opacity = 0;
      this._fadeOverlay.style.display = 'block';
      this._fadeOverlay.style.opacity = '0';

      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (this._fadeOverlay) {
          this._fadeOverlay.style.opacity = progress.toString();
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

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
