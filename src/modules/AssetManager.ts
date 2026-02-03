import { IGameModule } from '../core/IGameModule';

/**
 * 資產管理器，負責載入與顯示背景、立繪等影像資源
 */
export class AssetManager implements IGameModule {
    public moduleName: string = "AssetManager";
    private cache: Map<string, HTMLImageElement | HTMLAudioElement> = new Map();
    private bgLayer!: HTMLDivElement;

    // REMOVED: private spriteLayer!: HTMLDivElement;
    // REMOVED: private spriteSlots: { [key: string]: HTMLDivElement } = {};


    // 自動資源載入時嘗試的副檔名清單，提升腳本編寫的容錯率
    private supportedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.mp3', '.wav', '.ogg', '.gif'];
    // 指令類型與資源目錄的映射關係
    private typeSubDirs: { [key: string]: string } = {
        'bg': '/bg/',
        'char': '/char/',
        'music': '/music/',
        'sound': '/sound/',
    };

    constructor() { }

    /**
     * 批次預載入資產
     */
    async preload(assets: { key: string, src: string }[]): Promise<void> {
        const promises = assets.map(asset => this.load(asset.key, asset.src));
        await Promise.all(promises);
    }

    /**
     * 載入資源並快取
     */
    async load(key: string, url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            let element: HTMLImageElement | HTMLAudioElement;
            if (url.match(/\.(png|jpg|jpeg|webp|gif)$/)) {
                element = new Image();
                (element as HTMLImageElement).src = url;
                element.onload = () => {
                    this.cache.set(key, element as HTMLImageElement);
                    resolve();
                };
                element.onerror = (ev: any) => {
                    const errorMsg = `[AssetManager] 圖片載入失敗: ${url}，可能原因: 404/500/MIME錯誤`;
                    console.error(errorMsg, ev);
                    reject(new Error(errorMsg));
                };
            } else if (url.match(/\.(mp3|wav|ogg)$/)) {
                element = new Audio();
                (element as HTMLAudioElement).src = url;
                element.oncanplaythrough = () => {
                    this.cache.set(key, element as HTMLAudioElement);
                    resolve();
                };
                element.onerror = (ev: any) => {
                    const errorMsg = `[AssetManager] 音訊載入失敗: ${url}，可能原因: 404/500/MIME錯誤`;
                    console.error(errorMsg, ev);
                    reject(new Error(errorMsg));
                };
            } else {
                const errorMsg = `[AssetManager] 不支援的資源類型: ${url}`;
                console.error(errorMsg);
                reject(new Error(errorMsg));
            }
        });
    }

    /**
     * 初始化資產層級
     */
    /**
     * 初始化遊戲畫面的基礎層級 (背景與立繪層)
     * 並動態建立立繪插槽以便後續放置角色圖片。
     */
    initialize(): void {
        const root = document.getElementById('game-root') || document.getElementById('app') || document.body;

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
    }

    /**
     * 從快取中獲取資源
     * @param key 資源識別碼
     */
    public getAsset(key: string): HTMLImageElement | HTMLAudioElement | undefined {
        return this.cache.get(key);
    }

    /**
     * 取得背景層的 DOM 元素
     */
    public getBGLayer(): HTMLDivElement {
        return this.bgLayer;
    }

    /**
     * 檢查資源快取，若無則嘗試從多個預期副檔名中載入資源。
     * 此設計允許腳本只需寫檔名 (如 'bg_room')，系統會自動嘗試 .png, .jpg 等。
     * @param key 資源原始名稱 (不含副檔名)
     * @param type 資源類型 ('bg' 或 'char')，用於決定搜尋路徑
     * @returns 載入成功與否的非同步結果
     */
    async ensureLoaded(key: string, type: string): Promise<boolean> {
        const assetCacheKey = key.includes('/') ? key.split('/').pop() || key : key;
        if (this.cache.has(assetCacheKey)) return true;

        this.dispatchLoading(true);

        // Case 1: Key is a full path
        if (key.includes('/')) {
            const pathWithoutAssets = key.startsWith('assets/') ? key.substring('assets/'.length) : key;
            const url = `/${pathWithoutAssets}`;
            console.log(`[AssetManager] 嘗試載入資源 URL (直接路徑): ${url}`);
            try {
                await this.load(assetCacheKey, url);
                this.dispatchLoading(false);
                return true;
            } catch (e) {
                this.dispatchLoading(false);
                console.error(`[AssetManager] 無法載入直接路徑資源: ${key}`);
                return false;
            }
        }

        // Case 2: Key is a filename, search in subdir
        const subDir = this.typeSubDirs[type] || `/${type}/`;
        for (const ext of this.supportedExtensions) {
            const url = `${subDir}${key}${ext}`;
            console.log(`[AssetManager] 嘗試載入資源 URL (猜測路徑): ${url}`);
            try {
                await this.load(key, url);
                this.dispatchLoading(false);
                return true;
            } catch (e) {
                // Try next extension
                continue;
            }
        }

        console.error(`[AssetManager] 無法在 ${subDir} 找到資源: ${key}`);
        this.dispatchLoading(false);
        return false;
    }

    /**
     * 發送全域載入狀態事件，供 UIModule 顯示 Loading 遮罩。
     */
    private dispatchLoading(isLoading: boolean): void {
        const event = new CustomEvent('assetLoading', { detail: { isLoading } });
        window.dispatchEvent(event);
    }

    private currentBG: string | null = null; // Track current BG

    /**
     * 設定背景影像：從快取取得圖片並套用到背景層。
     * 改為非同步方法，確保資源載入後才執行顯示。
     * @param key 資源識別碼
     */
    async setBG(key: string): Promise<void> {
        // 確保資源已載入
        const success = await this.ensureLoaded(key, 'bg');
        if (success) {
            const img = this.cache.get(key);
            if (img) {
                this.bgLayer.style.backgroundImage = `url(${img.src})`;
                this.currentBG = key; // Save current BG key
            }
        }
    }

    /**
     * Get current background key
     */
    public getCurrentBG(): string | null {
        return this.currentBG;
    }

    /**
     * 執行背景震動效果
     * @param intensity 震動強度 (0.0 ~ 1.0)，預設 0.5。系統會將其映射為像素位移。
     */
    public shakeBG(intensity: number = 0.5): void {
        if (!this.bgLayer) return;

        // 將 0.0 ~ 1.0 映射為 0px ~ 20px (可調整)
        const pixelIntensity = Math.floor(intensity * 40) + "px";

        // 設定 CSS 變數
        this.bgLayer.style.setProperty('--shake-intensity', pixelIntensity);

        // 移除 class 以便重新觸發動畫 (如果連續呼叫)
        this.bgLayer.classList.remove('shaking');

        // 強制 reflow
        void this.bgLayer.offsetWidth;

        // 加入 class 觸發動畫
        this.bgLayer.classList.add('shaking');

        // 動畫結束後移除 class (0.3s 與 CSS 定義一致)
        setTimeout(() => {
            if (this.bgLayer) {
                this.bgLayer.classList.remove('shaking');
                this.bgLayer.style.removeProperty('--shake-intensity');
            }
        }, 300);
    }

    /**
     * 處理由 ScriptEngine 解析後的立繪指令。
     * 負責資源的非同步確保載入與最終的 DOM 渲染。
     * @param charKey 角色識別碼 (用於 SAY 高亮判斷)
     * @param position 放置位置
     * @param imgKey 圖像識別碼 (用於路徑檢索)
     */
    update(): void { }

    shutdown(): void {
        if (this.bgLayer) this.bgLayer.remove();
        this.cache.clear();
    }
}
