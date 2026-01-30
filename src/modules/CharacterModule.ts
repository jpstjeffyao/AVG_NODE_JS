import { IGameModule } from "../core/IGameModule";

/**
 * 定義立繪顯示位置
 */
export type CharacterPosition = "left" | "right" | "center";

/**
 * CharacterModule 負責管理遊戲中的立繪（角色圖像）顯示與切換
 */
export class CharacterModule implements IGameModule {
    private container: HTMLElement | null = null;
    private activeCharacters: Map<CharacterPosition, HTMLImageElement> = new Map();

    /**
     * 初始化模組，取得立繪容器元素
     */
    public setup(): void {
        this.container = document.querySelector("#character-container");
        if (!this.container) {
            throw new Error("'#character-container' not found in the DOM.");
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
     * 顯示或替換指定位置的立繪
     * @param characterId 角色標記
     * @param expression 表情標記
     * @param position 顯示位置
     */
    public show(characterId: string, expression: string, position: CharacterPosition): void {
        const src = `/assets/char/${characterId}_${expression}.png`;
        let img = this.activeCharacters.get(position);

        if (img) {
            // 如果該位置已有立繪，更新 src
            img.src = src;
        } else {
            // 否則建立新的 img 元素
            img = document.createElement("img");
            img.src = src;
            this.container?.appendChild(img);
            this.activeCharacters.set(position, img);
        }

        // 設定 CSS Class
        img.classList.remove("chara-left", "chara-right", "chara-center");
        img.classList.add(`chara-${position}`);
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
