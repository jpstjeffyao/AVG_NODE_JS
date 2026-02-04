import { IGameModule } from './IGameModule';

/**
 * 遊戲設定介面
 */
export interface GameSettings {
    masterVolume: number;  // 主音量 0.0 - 1.0 (預設: 1.0)
    bgmVolume: number;     // BGM 音量 0.0 - 1.0 (預設: 1.0)
    sfxVolume: number;     // SFX 音量 0.0 - 1.0 (預設: 1.0)
    textSpeed: number;     // 文字速度 (毫秒/字元, 預設: 40, 範圍: 10-100)
    autoPlaySpeed: number; // 自動播放速度 (毫秒, 預設: 2000)
    isMuted: boolean;      // 是否靜音 (預設: false)
}

/**
 * 設定管理模組
 * 負責載入、儲存與管理全域遊戲設定
 */
export class ConfigManager implements IGameModule {
    moduleName = "ConfigManager";
    private static readonly STORAGE_KEY = 'avg_game_settings';
    private settings: GameSettings;

    /**
     * 預設設定值
     */
    private readonly DEFAULT_SETTINGS: GameSettings = {
        masterVolume: 1.0,
        bgmVolume: 1.0,
        sfxVolume: 1.0,
        textSpeed: 40,
        autoPlaySpeed: 2000,
        isMuted: false
    };

    constructor() {
        this.settings = { ...this.DEFAULT_SETTINGS };
    }

    /**
     * 初始化：從 LocalStorage 載入設定
     */
    initialize(): void {
        this.loadSettings();
        console.log('[ConfigManager] Settings loaded:', this.settings);
    }

    update(): void {
        // ConfigManager 不需要每幀更新
    }

    shutdown(): void {
        this.saveSettings();
        console.log('[ConfigManager] Settings saved on shutdown');
    }

    /**
     * 從 LocalStorage 載入設定
     */
    private loadSettings(): void {
        try {
            const stored = localStorage.getItem(ConfigManager.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as Partial<GameSettings>;
                // 合併載入的設定與預設值，確保所有欄位都存在
                this.settings = { ...this.DEFAULT_SETTINGS, ...parsed };
            }
        } catch (error) {
            console.error('[ConfigManager] Failed to load settings:', error);
            this.settings = { ...this.DEFAULT_SETTINGS };
        }
    }

    /**
     * 儲存設定到 LocalStorage
     */
    public saveSettings(): void {
        try {
            const json = JSON.stringify(this.settings);
            localStorage.setItem(ConfigManager.STORAGE_KEY, json);
            console.log('[ConfigManager] Settings saved');
        } catch (error) {
            console.error('[ConfigManager] Failed to save settings:', error);
        }
    }

    /**
     * 取得當前設定
     */
    public getSettings(): GameSettings {
        return { ...this.settings };
    }

    /**
     * 更新單一設定值
     */
    public updateSetting<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void {
        this.settings[key] = value;
        this.saveSettings();
        console.log(`[ConfigManager] Updated ${key} to ${value}`);
    }

    /**
     * 重置為預設設定
     */
    public resetToDefaults(): void {
        this.settings = { ...this.DEFAULT_SETTINGS };
        this.saveSettings();
        console.log('[ConfigManager] Settings reset to defaults');
    }

    /**
     * 取得特定設定值
     */
    public getSetting<K extends keyof GameSettings>(key: K): GameSettings[K] {
        return this.settings[key];
    }
}
