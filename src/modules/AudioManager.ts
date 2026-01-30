import { IGameModule } from "../core/IGameModule";

/**
 * 音效管理模組
 * 負責 背景音樂 (BGM) 與 音效 (SE) 的播放與管理
 */
export class AudioManager implements IGameModule {
    public moduleName = "AudioManager";
    
    // 背景音樂播放器
    private _bgm: HTMLAudioElement;
    // 標記是否已解鎖音訊 (瀏覽器安全性限制，需使用者互動後才能播放音訊)
    private _isUnlocked: boolean = false;
    // 儲存待播放的 BGM URL，待解鎖後播放
    private _pendingBgmUrl: string | null = null;

    constructor() {
        this._bgm = new Audio();
        this._bgm.loop = true;
    }

    /**
     * 初始化模組
     */
    public initialize(): void {
        console.log("[AudioManager] Initializing...");
        
        // 監聽第一次點擊以解鎖音訊
        const unlock = () => {
            if (this._isUnlocked) return;
            
            console.log("[AudioManager] User interaction detected, attempting to unlock audio...");
            
            // 嘗試播放目前的 bgm (可能已經設定了 src)
            this._bgm.play().then(() => {
                this._isUnlocked = true;
                console.log("[AudioManager] Audio unlocked successfully.");
                
                // 如果有待播放的 BGM 且與目前播放的不同，則切換
                if (this._pendingBgmUrl) {
                    console.log(`[AudioManager] Playing pending BGM: ${this._pendingBgmUrl}`);
                    this.playBGM(this._pendingBgmUrl);
                    this._pendingBgmUrl = null;
                }

                document.removeEventListener("click", unlock);
                document.removeEventListener("keydown", unlock);
                document.removeEventListener("touchstart", unlock);
            }).catch(err => {
                console.warn("[AudioManager] Unlock failed, still waiting for interaction.", err);
            });
        };

        document.addEventListener("click", unlock);
        document.addEventListener("keydown", unlock);
        document.addEventListener("touchstart", unlock);
    }

    /**
     * 播放背景音樂 (BGM)
     * @param url 音訊檔案路徑
     */
    public playBGM(url: string): void {
        console.log(`[AudioManager] Request to play BGM: ${url}`);
        
        // 儲存最後一次請求的 BGM，確保解鎖後播放的是最新的
        this._pendingBgmUrl = url;

        if (!this._isUnlocked) {
            console.warn("[AudioManager] Audio not unlocked yet. BGM will play after user interaction.");
            // 預先設定 src，這樣 unlock 時可以直接 play
            if (this._bgm.src !== url) {
                this._bgm.src = url;
                this._bgm.load();
            }
            return;
        }

        // 如果已經在播放相同的 URL，就不重新播放
        if (this._bgm.src.endsWith(url) && !this._bgm.paused) {
            console.log("[AudioManager] BGM is already playing.");
            return;
        }

        this._bgm.pause();
        this._bgm.src = url;
        this._bgm.load();

        // 嘗試播放
        this._bgm.play().then(() => {
            this._pendingBgmUrl = null;
        }).catch(err => {
            if (err.name === "NotAllowedError") {
                console.warn("[AudioManager] BGM play failed (NotAllowedError).");
                this._isUnlocked = false; // 重置狀態
            } else {
                console.error("[AudioManager] BGM play error:", err);
            }
        });
    }

    /**
     * 播放一次性音效 (SE)
     * @param url 音訊檔案路徑
     */
    public playSE(url: string): void {
        console.log(`[AudioManager] Playing SE: ${url}`);
        const se = new Audio(url);
        se.play().catch(err => {
            console.warn("[AudioManager] SE play failed (waiting for interaction):", err);
        });
    }

    public update(): void {
        // 音訊更新邏輯（目前不需要）
    }

    public shutdown(): void {
        if (this._bgm) {
            this._bgm.pause();
            this._bgm.src = "";
        }
    }
}
