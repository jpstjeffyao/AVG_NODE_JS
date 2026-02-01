import { IGameModule } from "../core/IGameModule";
import { AssetManager } from "./AssetManager";

/**
 * 定義立繪顯示位置
 */
export type CharacterPosition = "left" | "right" | "center";

/**
 * CharacterModule 負責管理遊戲中的立繪（角色圖像）顯示與切換
 */
export class CharacterModule implements IGameModule {
    public moduleName: string = "CharacterModule";
    // REMOVE: private container: HTMLElement | null = null; // No longer needed directly
    private activeCharacters: Map<CharacterPosition, HTMLImageElement> = new Map();
    private assetManager: AssetManager;

    // ADDED: 立繪層容器和插槽
    private spriteLayer!: HTMLDivElement; // 立繪層容器
    private spriteSlots: { [key: string]: HTMLDivElement } = {}; // 立繪插槽

    constructor(assetManager: AssetManager) {
        this.assetManager = assetManager;
    }

    /**
     * 符合 IGameModule 介面的初始化方法。
     * 設定立繪容器元素並建立插槽。
     */
    public initialize(): void { // Refactored from setup()
        const root = document.getElementById('game-root') || document.getElementById('app') || document.body;

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
        this.spriteLayer.style.justifyContent = 'space-between';
        this.spriteLayer.style.alignItems = 'flex-end';
        this.spriteLayer.style.pointerEvents = 'none'; // 確保玩家點擊時能穿透此層
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
            slot.style.transition = 'filter 0.3s ease'; // 加入亮度切換動畫效果
            this.spriteLayer.appendChild(slot);
            this.spriteSlots[pos] = slot;
        });
    }

    // REMOVE: public setup(): void { ... } // No longer needed, logic moved to initialize()

    /**
     * 每幀更新邏輯 (暫無)
     */
    public update(): void {
        // No update logic for now
    }

    /**
     * 關閉模組，清理資源
     */
    public shutdown(): void {
        this.clear();
        if (this.spriteLayer) this.spriteLayer.remove(); // REMOVE spriteLayer from DOM
    }

    /**
     * 顯示或替換指定位置的立繪。
     * @param characterId 圖像識別碼 (在 AssetManager 快取中的 Key)
     * @param position 顯示位置
     * @param name 角色名稱（用於高亮）
     */
    public async show(characterId: string, position: CharacterPosition, name: string = ""): Promise<void> {
        const slot = this.spriteSlots[position];
        if (!slot) {
            console.error(`[CharacterModule] show 錯誤：指定了無效的位置。預期為 'left', 'center', 'right'，但收到了 '${position}'。`);
            return;
        }

        // 確保資源已載入
        const success = await this.assetManager.ensureLoaded(characterId, 'char');
        if (success) {
            const imgAsset = this.assetManager.getAsset(characterId);
            if (imgAsset instanceof HTMLImageElement) {
                // 移除舊的圖片內容，確保一個插槽只有一個角色
                slot.innerHTML = '';

                const img = document.createElement('img');
                img.src = imgAsset.src;
                img.dataset.name = name; // 將角色名稱存在 dataset 中
                img.style.maxHeight = '90%';
                img.style.maxWidth = '100%';
                img.style.objectFit = 'contain';
                slot.appendChild(img);

                // 更新 activeCharacters map
                this.activeCharacters.set(position, img);
                
                // 當設置新的立繪時，重設為全亮狀態
                this.setSpriteHighlight(position, 1.0);
            } else {
                console.error(`[CharacterModule] 無法載入立繪資源: ${characterId}。`);
            }
        }
    }

    /**
     * 隱藏指定位置的立繪
     * @param position 顯示位置
     */
    public hide(position: CharacterPosition): void {
        const img = this.activeCharacters.get(position);
        if (img) {
            img.remove();
            this.activeCharacters.delete(position);
        }
    }

    /**
     * 清除所有位置的立繪
     */
    public clear(): void {
        this.activeCharacters.forEach((img) => {
            img.remove();
        });
        this.activeCharacters.clear();
    }

    /**
     * 設定立繪亮度（用於說話者高亮）
     * @param position 位置
     * @param brightness 亮度值 (1.0 或 0.6)
     */
    public setSpriteHighlight(position: CharacterPosition, brightness: number): void {
        const slot = this.spriteSlots[position];
        if (slot) {
            slot.style.filter = `brightness(${brightness})`;
        }
    }
}
