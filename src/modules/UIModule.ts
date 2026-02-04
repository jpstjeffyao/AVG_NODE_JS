import { IGameModule } from '../core/IGameModule';
import { GameKernel } from '../core/GameKernel';
import { GameState } from '../core/StateManager';

/**
 * UI 模組，負責對話視窗、選項選單及選單畫面的顯示與互動
 */
export class UIModule implements IGameModule {
  moduleName = "UIModule";
  private readonly kernel: GameKernel;
  private _container: HTMLElement | null = null; // 對話 UI 容器
  private _menuScreen: HTMLElement | null = null; // MENU 畫面容器
  private _dialogContainer: HTMLElement | null = null; // 同 _container，供內部更清晰引用
  private _isTyping: boolean = false;
  private _typingTimer: number | null = null;
  private _fullText: string = "";
  private _loadingOverlay: HTMLElement | null = null;
  private _fadeOverlay: HTMLElement | null = null;
  private _autoPlayEnabled: boolean = false; // 自動播放開關
  private _autoPlayTimer: number | null = null; // 自動播放計時器

  constructor(kernel: GameKernel) {
    this.kernel = kernel;
  }

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
    // 取消自動前進計時器（使用者手動點擊時）
    this.cancelAutoAdvance();
    this.kernel?.onUserClick();
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
        this.kernel?.onUserClick();
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

    if (btnNewGame) btnNewGame.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onNewGameClick();
    });
    if (btnLoadGame) btnLoadGame.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onLoadGameClick();
    });
    if (btnSettings) btnSettings.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onSettingsClick();
    });

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
      if (this.kernel) {
        // 僅於劇情結束並完成淡出（STATE_FADING_OUT）時觸發
        if (this.kernel.stateManager.getState() === "STATE_FADING_OUT") {
          this.kernel.stateManager.setState(GameState.STATE_TITLE);
          this.hideDialog();

          // 確保背景更換回主畫面圖片
          const assetModule = this.kernel.assetManager;
          if (assetModule) {
            await assetModule.setBG("Main");
          }

          // 確保背景層可見

          const bgLayer = assetModule?.getBGLayer();
          if (bgLayer) {
            bgLayer.style.display = 'block';
            bgLayer.style.opacity = '1';
          }

          // NEW: Clear character sprites when returning to title screen
          if (this.kernel.characterModule) {
            console.log("[UIModule] Calling characterModule.clear()."); // NEW LOG
            this.kernel.characterModule.clear();
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
    console.log("[UIModule] showMenu() called. Displaying #menu-screen.");
    if (this._menuScreen) {
      this._menuScreen.style.display = "flex";
      this.hideSystemButtons(); // Hide system buttons (Save/Load) on title screen
      // NEW LOG: Confirming style application
      console.log(`[UIModule] #menu-screen display set to: ${this._menuScreen.style.display}`);
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
      this.showSystemButtons(); // Show system buttons in-game
    }
  }

  /**
   * 隱藏對話 UI
   */
  public hideDialog(): void {
    if (this._dialogContainer) {
      console.log("[UIModule] hideDialog() called. Hiding #avg-ui.");
      this._dialogContainer.style.display = "none";
    }
  }

  /**
   * 點擊「開始遊戲」
   */
  private onNewGameClick(): void {
    this.hideMenu();
    this.showDialog();

    // 透過暴露在 window 的 kernel 啟動遊戲
    const kernel = this.kernel;
    if (kernel) {
      kernel.startGame();
    }
  }

  /**
   * 點擊「繼續遊戲」
   */
  private onLoadGameClick(): void {
    this.showSaveLoadMenu('load');
  }

  /**
   * 點擊「系統設定」
   */
  private onSettingsClick(): void {
    this.showSettingsMenu();
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

    if (contentBox) {
      this._fullText = content;
      contentBox.textContent = ""; // 先清空文字
      this._isTyping = true;

      let currentIndex = 0;
      // 從 ConfigManager 讀取文字速度
      const textSpeed = this.kernel.configManager?.getSetting('textSpeed') || 40;
      // 啟動打字機效果計時器
      this._typingTimer = window.setInterval(() => {
        if (currentIndex < this._fullText.length) {
          contentBox.textContent += this._fullText[currentIndex];
          currentIndex++;
        } else {
          // 全部文字顯示完畢
          this.completeTyping();
        }
      }, textSpeed); // 使用設定的文字速度
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

    // 如果自動播放已啟用，設定計時器自動前進
    if (this._autoPlayEnabled) {
      this.scheduleAutoAdvance();
    }
  }

  /**
   * 排程自動前進（在文字顯示完成後）
   */
  private scheduleAutoAdvance(): void {
    // 清除舊的計時器
    if (this._autoPlayTimer !== null) {
      window.clearTimeout(this._autoPlayTimer);
    }

    // 取得自動播放延遲時間
    const delay = this.kernel.configManager?.getSetting('autoPlaySpeed') || 2000;

    // 設定新的計時器
    this._autoPlayTimer = window.setTimeout(() => {
      this.kernel?.onUserClick();
    }, delay);
  }

  /**
   * 取消自動前進計時器
   */
  private cancelAutoAdvance(): void {
    if (this._autoPlayTimer !== null) {
      window.clearTimeout(this._autoPlayTimer);
      this._autoPlayTimer = null;
    }
  }

  /**
   * 切換自動播放模式
   */
  public toggleAutoPlay(): void {
    this._autoPlayEnabled = !this._autoPlayEnabled;

    if (!this._autoPlayEnabled) {
      this.cancelAutoAdvance();
    } else if (!this._isTyping) {
      // 如果當前沒有在打字且剛啟用，立即排程
      this.scheduleAutoAdvance();
    }

    // 更新按鈕樣式
    this.updateAutoPlayButton();
    console.log(`[UIModule] Auto-play ${this._autoPlayEnabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 更新自動播放按鈕的視覺狀態
   */
  private updateAutoPlayButton(): void {
    const container = document.getElementById('system-btn-container');
    if (!container) return;

    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn.textContent === 'Auto') {
        btn.style.backgroundColor = this._autoPlayEnabled ? 'rgba(76,175,80,0.7)' : 'rgba(0,0,0,0.5)';
        btn.style.border = this._autoPlayEnabled ? '1px solid #4CAF50' : '1px solid #666';
      }
    });
  }

  /**
   * 播放全螢幕影片
   * @param videoPath 影片檔案路徑
   * @returns Promise 當影片播放結束時 resolve
   */
  public playVideo(videoPath: string, volume: number = 1.0): Promise<void> {
    return new Promise((resolve) => {
      const videoElement = document.createElement('video');
      videoElement.src = videoPath;
      videoElement.autoplay = true;
      videoElement.controls = false; // 不顯示控制器，讓影片自動播放並佔據全螢幕
      videoElement.preload = 'auto'; // 預加載影片
      videoElement.volume = Math.max(0, Math.min(1, volume)); // Set volume, clamped between 0 and 1

      // 設定全螢幕樣式，並確保在所有內容之上
      videoElement.style.position = 'fixed';
      videoElement.style.top = '0';
      videoElement.style.left = '0';
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.zIndex = '10001'; // 比 fadeOverlay (z-index: 10000) 更高
      videoElement.style.objectFit = 'cover'; // 確保影片填滿整個螢幕，可能會裁剪
      videoElement.style.backgroundColor = 'black'; // 影片載入前或結束後的背景

      let skipHandled = false; // Flag to prevent double resolution

      const cleanup = () => {
        if (videoElement.parentNode) {
          videoElement.parentNode.removeChild(videoElement);
        }
        document.removeEventListener('click', skipVideo);
        document.removeEventListener('keydown', skipVideo);
      };

      const doResolve = () => {
        if (!skipHandled) {
          skipHandled = true;
          cleanup();
          resolve();
        }
      };

      // Event listener for natural end of video
      videoElement.addEventListener('ended', doResolve);

      // Event listener for skip by click/keydown
      const skipVideo = (event: Event) => {
        // Prevent default behavior for keydown (e.g., space scrolling)
        if (event instanceof KeyboardEvent && event.code === 'Space') {
          event.preventDefault();
        }
        // Only skip if not already handled by natural end
        if (!skipHandled) {
          console.log("[UIModule] Video skipped by user interaction.");
          videoElement.pause(); // Pause if playing
          doResolve();
        }
      };

      document.addEventListener('click', skipVideo);
      document.addEventListener('keydown', skipVideo);

      // 監聽影片載入失敗事件
      videoElement.addEventListener('error', (e) => {
        console.error(`Error playing video ${videoPath}:`, e);
        doResolve(); // Resolve even on error to unblock script
      });

      document.body.appendChild(videoElement);
    });
  }
  /**
   * 在畫面中央顯示分支選項按鈕
   * @param choices 選項文字陣列 (例如 ['走左邊', '走右邊'])
   */
  showChoices(choices: string[]): void {
    // 確保 UI 已初始化
    if (!this._container) return;

    // NEW: Hide the entire dialog container when showing choices
    this.hideDialog();

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

    // 將選項容器加入到 game-root (確保在最上層且不受 avg-ui 隱藏影響)
    const gameRoot = document.getElementById("game-root") || document.body;
    gameRoot.appendChild(choiceContainer);
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

  update(): void { }
  shutdown(): void { }

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

  /**
   * Show Save/Load Menu
   * @param mode 'save' or 'load'
   */
  public showSaveLoadMenu(mode: 'save' | 'load'): void {
    // Create or get menu container
    let menu = document.getElementById('save-load-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'save-load-menu';
      menu.style.position = 'fixed';
      menu.style.top = '0';
      menu.style.left = '0';
      menu.style.width = '100%';
      menu.style.height = '100%';
      menu.style.backgroundColor = 'rgba(0,0,0,0.8)';
      menu.style.zIndex = '20000';
      menu.style.display = 'flex';
      menu.style.flexDirection = 'column';
      menu.style.alignItems = 'center';
      menu.style.justifyContent = 'center';
      menu.style.color = 'white';
      document.body.appendChild(menu);
    }

    menu.innerHTML = ''; // Clear content
    menu.style.display = 'flex';

    // Title
    const title = document.createElement('h2');
    title.textContent = mode === 'save' ? '儲存遊戲' : '載入遊戲';
    title.style.marginBottom = '20px';
    menu.appendChild(title);

    // Close Button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '關閉';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '20px';
    closeBtn.style.right = '20px';
    closeBtn.style.padding = '10px 20px';
    closeBtn.onclick = () => {
      menu!.style.display = 'none';
    };
    menu.appendChild(closeBtn);

    // Slot List Container
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '10px';
    list.style.maxHeight = '70%';
    list.style.overflowY = 'auto';
    list.style.width = '60%';
    menu.appendChild(list);

    // Get saved slots info
    const saves = this.kernel.stateManager.listSaves();
    const savesMap = new Map(saves.map(s => [s.slot, s]));

    // Render Slots 1-10
    for (let i = 1; i <= 10; i++) {
      const slotInfo = savesMap.get(i);
      const item = document.createElement('div');
      item.style.border = '1px solid #444';
      item.style.padding = '15px';
      item.style.backgroundColor = '#222';
      item.style.cursor = 'pointer';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';

      const infoText = slotInfo ? slotInfo.summary : '---- 空白存檔 ----';

      item.innerHTML = `
                <span style="font-weight:bold; margin-right: 15px;">SLOT ${i}</span>
                <span>${infoText}</span>
            `;

      item.onclick = async () => {
        if (mode === 'save') {
          if (confirm(`確定要儲存到 SLOT ${i} 嗎？`)) {
            this.kernel.saveGame(i);
            this.showSaveLoadMenu('save'); // Refresh list
          }
        } else {
          if (slotInfo) {
            if (confirm(`確定要讀取 SLOT ${i} 嗎？`)) {
              await this.kernel.loadGame(i);
              menu!.style.display = 'none'; // Close menu
              this.hideMenu(); // Hide title screen if on title
            }
          }
        }
      };

      list.appendChild(item);
    }
  }

  /**
   * Ensure in-game system buttons exist
   */
  public showSystemButtons(): void {
    let container = document.getElementById('system-btn-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'system-btn-container';
      container.style.position = 'fixed';
      container.style.top = '10px';
      container.style.right = '10px';
      container.style.zIndex = '10002';
      container.style.display = 'flex';
      container.style.gap = '5px';
      document.body.appendChild(container);

      const createBtn = (text: string, onClick: () => void) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.padding = '5px 10px';
        btn.style.backgroundColor = 'rgba(0,0,0,0.5)';
        btn.style.color = 'white';
        btn.style.border = '1px solid #666';
        btn.style.cursor = 'pointer';
        btn.onclick = (e) => {
          e.stopPropagation(); // Prevent advancing script
          onClick();
        };
        container!.appendChild(btn);
      };

      createBtn('Save', () => this.showSaveLoadMenu('save'));
      createBtn('Load', () => this.showSaveLoadMenu('load'));
      createBtn('Auto', () => this.toggleAutoPlay());
    }
    container.style.display = 'flex';
  }

  /**
   * Hide system buttons (e.g. for title screen)
   */
  public hideSystemButtons(): void {
    const container = document.getElementById('system-btn-container');
    if (container) container.style.display = 'none';
  }

  /**
   * Show Settings Menu
   * 顯示系統設定選單，包含音量與文字速度控制
   */
  public showSettingsMenu(): void {
    const config = this.kernel.configManager;
    if (!config) {
      console.error('[UIModule] ConfigManager not available');
      return;
    }

    const settings = config.getSettings();

    // Create or get menu container
    let menu = document.getElementById('settings-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'settings-menu';
      menu.style.position = 'fixed';
      menu.style.top = '0';
      menu.style.left = '0';
      menu.style.width = '100%';
      menu.style.height = '100%';
      menu.style.backgroundColor = 'rgba(0,0,0,0.85)';
      menu.style.zIndex = '20000';
      menu.style.display = 'flex';
      menu.style.flexDirection = 'column';
      menu.style.alignItems = 'center';
      menu.style.justifyContent = 'center';
      menu.style.color = 'white';
      document.body.appendChild(menu);
    }

    menu.innerHTML = ''; // Clear content
    menu.style.display = 'flex';

    // Title
    const title = document.createElement('h2');
    title.textContent = 'システム設定 (System Settings)';
    title.style.marginBottom = '30px';
    menu.appendChild(title);

    // Settings Container
    const container = document.createElement('div');
    container.style.width = '500px';
    container.style.padding = '20px';
    container.style.backgroundColor = 'rgba(30,30,30,0.9)';
    container.style.borderRadius = '10px';
    menu.appendChild(container);

    // Helper function to create slider control
    const createSlider = (label: string, value: number, onChange: (val: number) => void) => {
      const row = document.createElement('div');
      row.style.marginBottom = '20px';

      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      labelEl.style.display = 'block';
      labelEl.style.marginBottom = '8px';
      labelEl.style.fontSize = '16px';
      row.appendChild(labelEl);

      const sliderRow = document.createElement('div');
      sliderRow.style.display = 'flex';
      sliderRow.style.alignItems = 'center';
      sliderRow.style.gap = '10px';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.value = (value * 100).toString();
      slider.style.flex = '1';
      slider.style.cursor = 'pointer';

      const valueDisplay = document.createElement('span');
      valueDisplay.textContent = `${Math.round(value * 100)}%`;
      valueDisplay.style.minWidth = '50px';
      valueDisplay.style.textAlign = 'right';

      slider.oninput = (e) => {
        const val = parseInt((e.target as HTMLInputElement).value) / 100;
        valueDisplay.textContent = `${Math.round(val * 100)}%`;
        onChange(val);
      };

      sliderRow.appendChild(slider);
      sliderRow.appendChild(valueDisplay);
      row.appendChild(sliderRow);

      return row;
    };

    // Master Volume
    container.appendChild(createSlider('主音量 (Master Volume)', settings.masterVolume, (val) => {
      config.updateSetting('masterVolume', val);
      this.kernel.audio?.setMasterVolume(val);
    }));

    // BGM Volume
    container.appendChild(createSlider('背景音樂音量 (BGM Volume)', settings.bgmVolume, (val) => {
      config.updateSetting('bgmVolume', val);
      this.kernel.audio?.setBGMVolume(val);
    }));

    // SFX Volume
    container.appendChild(createSlider('音效音量 (SFX Volume)', settings.sfxVolume, (val) => {
      config.updateSetting('sfxVolume', val);
      this.kernel.audio?.setSFXVolume(val);
    }));

    // Divider
    const divider = document.createElement('hr');
    divider.style.border = 'none';
    divider.style.borderTop = '1px solid #555';
    divider.style.margin = '20px 0';
    container.appendChild(divider);

    // Text Speed
    const textSpeedRow = document.createElement('div');
    textSpeedRow.style.marginBottom = '20px';

    const textSpeedLabel = document.createElement('label');
    textSpeedLabel.textContent = '文字速度 (Text Speed)';
    textSpeedLabel.style.display = 'block';
    textSpeedLabel.style.marginBottom = '8px';
    textSpeedLabel.style.fontSize = '16px';
    textSpeedRow.appendChild(textSpeedLabel);

    const speedButtons = document.createElement('div');
    speedButtons.style.display = 'flex';
    speedButtons.style.gap = '10px';

    const speeds = [
      { label: '慢 (Slow)', value: 80 },
      { label: '普通 (Normal)', value: 40 },
      { label: '快 (Fast)', value: 20 }
    ];

    speeds.forEach(({ label, value }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.flex = '1';
      btn.style.padding = '10px';
      btn.style.cursor = 'pointer';
      btn.style.border = settings.textSpeed === value ? '2px solid #4CAF50' : '2px solid #666';
      btn.style.backgroundColor = settings.textSpeed === value ? '#4CAF50' : '#444';
      btn.style.color = 'white';
      btn.style.borderRadius = '5px';

      btn.onclick = () => {
        config.updateSetting('textSpeed', value);
        // Refresh menu to update button states
        this.showSettingsMenu();
      };

      speedButtons.appendChild(btn);
    });

    textSpeedRow.appendChild(speedButtons);
    container.appendChild(textSpeedRow);

    // Action Buttons
    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.gap = '10px';
    buttonRow.style.marginTop = '30px';

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '重設為預設值 (Reset Defaults)';
    resetBtn.style.flex = '1';
    resetBtn.style.padding = '12px';
    resetBtn.style.cursor = 'pointer';
    resetBtn.style.border = '1px solid #FF5722';
    resetBtn.style.backgroundColor = '#FF5722';
    resetBtn.style.color = 'white';
    resetBtn.style.borderRadius = '5px';
    resetBtn.onclick = () => {
      if (confirm('確定要重設所有設定為預設值？')) {
        config.resetToDefaults();
        const defaultSettings = config.getSettings();
        this.kernel.audio?.setMasterVolume(defaultSettings.masterVolume);
        this.kernel.audio?.setBGMVolume(defaultSettings.bgmVolume);
        this.kernel.audio?.setSFXVolume(defaultSettings.sfxVolume);
        this.showSettingsMenu(); // Refresh menu
      }
    };

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '關閉 (Close)';
    closeBtn.style.flex = '1';
    closeBtn.style.padding = '12px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.border = '1px solid #2196F3';
    closeBtn.style.backgroundColor = '#2196F3';
    closeBtn.style.color = 'white';
    closeBtn.style.borderRadius = '5px';
    closeBtn.onclick = () => {
      menu!.style.display = 'none';
    };

    buttonRow.appendChild(resetBtn);
    buttonRow.appendChild(closeBtn);
    container.appendChild(buttonRow);
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
