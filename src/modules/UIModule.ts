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

    // 監聽來自 AssetManager 的載入狀態事件，顯示/隱藏 Loading 畫面
    window.addEventListener('assetLoading', (e: any) => {
      this.toggleLoading(e.detail.isLoading);
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
    if (this._menuScreen) {
      this._menuScreen.style.display = "flex";
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
          // 如果插槽內有圖片，且名稱匹配說話者，則高亮 (1.0)，否則變暗 (0.6)
          // 如果對話者名稱為空（例如旁白），則所有立繪都可能變暗或保持原樣，此處設定為變暗
          const isSpeaker = img && img.dataset.name === speakerName;
          const brightness = isSpeaker ? 1.0 : 0.6;
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
    if (!this._container) return;
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
