import { IGameModule } from '../core/IGameModule';

class AudioManager implements IGameModule {
    initialize(): void {
        console.log('AudioManager initialized');
    }

    update(): void {
        // Update logic for AudioManager if needed
    }

    shutdown(): void {
        console.log('AudioManager shutdown');
    }

    private bgmAudio: HTMLAudioElement;
    private sfxPool: HTMLAudioElement[];
    private masterVolume: number = 1.0;
    private isMuted: boolean = false;

    constructor() {
        this.bgmAudio = new Audio();
        this.sfxPool = Array.from({ length: 10 }, () => new Audio());
    }

    setMasterVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateAudioVolumes();
    }

    toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        this.updateAudioVolumes();
        return this.isMuted;
    }

    private updateAudioVolumes(): void {
        const effectiveVolume = this.isMuted ? 0 : this.masterVolume;
        this.bgmAudio.volume = effectiveVolume;
        this.sfxPool.forEach(audio => {
            if (!audio.paused) {
                audio.volume = effectiveVolume;
            }
        });
    }

    /**
     * 播放背景音樂 (BGM)
     * @param src 音訊檔案路徑
     * @param volume 音量 (0.0 到 1.0)
     * @param loop 是否循環播放
     */
    /**
     * 播放背景音樂 (BGM)
     * @param srcOrElement 音訊檔案路徑或預載入的 Audio 元素
     * @param volume 音量 (0.0 到 1.0)
     * @param loop 是否循環播放
     */
    playBGM(srcOrElement: string | HTMLAudioElement, volume: number, loop: boolean): void {
        const safeVolume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 1.0;
        const safeLoop = typeof loop === 'boolean' ? loop : true;

        if (srcOrElement instanceof HTMLAudioElement) {
            this.bgmAudio.pause();
            this.bgmAudio = srcOrElement;
        } else {
            this.bgmAudio.src = srcOrElement;
        }

        this.bgmAudio.volume = safeVolume * this.masterVolume;
        this.bgmAudio.loop = safeLoop;

        this.bgmAudio.play().catch((err) => {
            console.error(`AudioManager: Failed to play BGM.`, err);
            if (err.name === 'NotSupportedError') {
                console.error("AudioManager: 格式不支援或路徑錯誤 (NotSupportedError)。請檢查資源路徑與 MIME 類型。");
            } else if (err.name === 'NotAllowedError') {
                console.warn("AudioManager: 播放被瀏覽器阻擋 (NotAllowedError)，通常是因為缺乏使用者互動。");
            }
        });
    }

    stopBGM(): void {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
    }

    fadeOutBGM(duration: number): void {
        const step = this.bgmAudio.volume / (duration * 1000 / 50);
        const fadeInterval = setInterval(() => {
            if (this.bgmAudio.volume > step) {
                this.bgmAudio.volume -= step;
            } else {
                this.bgmAudio.volume = 0;
                this.stopBGM();
                clearInterval(fadeInterval);
            }
        }, 50);
    }

    fadeInBGM(duration: number, src: string, targetVolume: number, loop: boolean): void {
        this.bgmAudio.src = src;
        this.bgmAudio.volume = 0;
        this.bgmAudio.loop = loop;
        this.bgmAudio.play().catch(console.error);

        const step = targetVolume / (duration * 1000 / 50);
        const fadeInterval = setInterval(() => {
            if (this.bgmAudio.volume < targetVolume) {
                this.bgmAudio.volume = Math.min(this.bgmAudio.volume + step, targetVolume);
            } else {
                clearInterval(fadeInterval);
            }
        }, 50);
    }

    playSFX(src: string, volume: number): void {
        const availableAudio = this.sfxPool.find(audio => audio.paused);
        if (availableAudio) {
            availableAudio.src = src;
            availableAudio.volume = volume * this.masterVolume;
            availableAudio.play().catch(console.error);
        } else {
            console.warn('No available audio elements in the SFX pool.');
        }
    }
}

export default AudioManager;
