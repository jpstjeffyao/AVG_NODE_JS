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
    private container: HTMLElement | null = null;
    private activeCharacters: Map<CharacterPosition, HTMLImageElement> = new Map();
    private assetManager: AssetManager;

    constructor(assetManager: AssetManager) {
        this.assetManager = assetManager;
    }

    /**
     * 初始化模組，取得立繪容器元素
     */
    public setup(): void {
        this.container = document.querySelector("#character-container");
        if (!this.container) {
            // Fallback to spriteLayer if the dedicated container doesn't exist
            this.container = document.querySelector("#sprite-layer");
        }
        if (!this.container) {
            console.error("Neither '#character-container' nor '#sprite-layer' found in the DOM.");
        }
    }

    /**
     * 符合 IGameModule 介面的初始化方法
     */
    public initialize(): void {
        this.setup();
    }

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
    }

    /**
     * 顯示或替換指定位置的立繪，委託 AssetManager 處理載入與渲染
     * @param characterId 圖像識別碼
     * @param position 顯示位置
     * @param name 角色名稱（用於高亮）
     */
    public async show(characterId: string, position: CharacterPosition, name: string = ""): Promise<void> {
        await this.assetManager.handleSpriteCommand(name, position, characterId);
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
}
