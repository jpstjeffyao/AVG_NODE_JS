import { IGameModule } from '../core/IGameModule';

/**
 * 資產管理器，負責載入與顯示背景、立繪等影像資源
 */
export class AssetManager implements IGameModule {
    public moduleName: string = "AssetManager";
    private cache: Map<string, HTMLImageElement | HTMLAudioElement> = new Map();
    private bgLayer!: HTMLDivElement;
    private spriteLayer!: HTMLDivElement;
    
    // 儲存立繪容器 DOM 參考，對應位置如 'left', 'center', 'right'
    private spriteSlots: { [key: string]: HTMLDivElement } = {};

    // 自動資源載入時嘗試的副檔名清單，提升腳本編寫的容錯率
    private supportedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.mp3', '.wav', '.ogg', '.gif'];
    // 指令類型與資源目錄的映射關係
    private typeSubDirs: { [key: string]: string } = {
        'bg': '/assets/bg/',
        'char': '/assets/char/',
        'music': '/assets/music/',
        'sound': '/assets/sound/',
    };

    constructor() {}

    /**
     * 批次預載入資產
     */
    async preload(assets: { key: string, src: string }[]): Promise<void> {
        const promises = assets.map(asset => this.load(asset.key, asset.src));
        await Promise.all(promises);
        console.log(`[AssetManager] Preloaded ${this.cache.size} assets successfully.`);
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
        ['left', 'center', 'right'].forEach(pos => {
            const slot = document.createElement('div');
            slot.dataset.position = pos;
            slot.style.width = '33%'; // 每個插槽佔據 1/3 寬度
            slot.style.height = '100%';
            slot.style.display = 'flex';
            slot.style.justifyContent = 'center';
            slot.style.alignItems = 'flex-end';
            // 加入亮度切換動畫效果，讓說話者變換時更平滑
            slot.style.transition = 'filter 0.3s ease';
            this.spriteLayer.appendChild(slot);
            this.spriteSlots[pos] = slot;
        });
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
            const url = `/${key}`;
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
            }
        }
    }

    /**
     * 處理由 ScriptEngine 解析後的立繪指令。
     * 負責資源的非同步確保載入與最終的 DOM 渲染。
     * @param charKey 角色識別碼 (用於 SAY 高亮判斷)
     * @param position 放置位置
     * @param imgKey 圖像識別碼 (用於路徑檢索)
     */
    async handleSpriteCommand(charKey: string, position: string, imgKey: string): Promise<void> {
        console.log(`[AssetManager] handleSpriteCommand - charKey: ${charKey}, position: ${position}, imgKey: ${imgKey}`);
        // 根據 圖像Key 生成完整資源路徑 (assets/char/{圖像Key}.png)
        // 使用 ensureLoaded 處理多種副檔名與路徑拼接
        const success = await this.ensureLoaded(imgKey, 'char');
        if (success) {
            this.setSprite(imgKey, position, charKey);
        }
    }

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
    setSprite(key: string, position: string = 'center', name: string = ''): void {
        console.log(`[AssetManager] setSprite - key: ${key}, position: ${position}, name: ${name}`);
        const slot = this.spriteSlots[position];
        if (!slot) {
            console.error(`[AssetManager] setSprite 錯誤：指定了無效的位置。預期為 'left', 'center', 'right'，但收到了 '${position}'。完整的指令參數為: key=${key}, name=${name}`);
            return;
        }

        // 移除舊的圖片內容，確保一個插槽只有一個角色
        slot.innerHTML = '';
        console.log(`[AssetManager] setSprite - 找到 slot:`, slot);

        const imgAsset = this.cache.get(key);
        if (imgAsset) {
            const img = document.createElement('img');
            img.src = imgAsset.src;
            // 將角色名稱存在 dataset 中，這是實現「說話者高亮」的關鍵
            img.dataset.name = name;
            img.style.maxHeight = '90%';
            img.style.maxWidth = '100%';
            img.style.objectFit = 'contain';
            slot.appendChild(img);
            console.log("圖片已插入插槽", img);
        } else {
            // 防呆處理：若直接呼叫此函式但快取沒圖，則重新嘗試載入
            this.ensureLoaded(key, 'char').then(success => {
                if (success) this.setSprite(key, position, name);
            });
        }
    }

    /**
     * 清除特定位置的立繪
     */
    clearSprite(position: string): void {
        const slot = this.spriteSlots[position];
        if (slot) {
            slot.innerHTML = '';
        }
    }

    /**
     * 設定立繪亮度（用於說話者高亮）
     * @param position 位置
     * @param brightness 亮度值 (1.0 或 0.6)
     */
    setSpriteHighlight(position: string, brightness: number): void {
        const slot = this.spriteSlots[position];
        if (slot) {
            slot.style.filter = `brightness(${brightness})`;
        }
    }

    update(): void {}

    shutdown(): void {
        if (this.bgLayer) this.bgLayer.remove();
        if (this.spriteLayer) this.spriteLayer.remove();
        this.cache.clear();
    }
}
