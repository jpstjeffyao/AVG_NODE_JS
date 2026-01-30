"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AudioManager = /** @class */ (function () {
    function AudioManager() {
        this.masterVolume = 1.0;
        this.isMuted = false;
        this.bgmAudio = new Audio();
        this.sfxPool = Array.from({ length: 10 }, function () { return new Audio(); });
    }
    AudioManager.prototype.initialize = function () {
        console.log('AudioManager initialized');
    };
    AudioManager.prototype.update = function () {
        // Update logic for AudioManager if needed
    };
    AudioManager.prototype.shutdown = function () {
        console.log('AudioManager shutdown');
    };
    AudioManager.prototype.setMasterVolume = function (volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateAudioVolumes();
    };
    AudioManager.prototype.toggleMute = function () {
        this.isMuted = !this.isMuted;
        this.updateAudioVolumes();
        return this.isMuted;
    };
    AudioManager.prototype.updateAudioVolumes = function () {
        var effectiveVolume = this.isMuted ? 0 : this.masterVolume;
        this.bgmAudio.volume = effectiveVolume;
        this.sfxPool.forEach(function (audio) {
            if (!audio.paused) {
                audio.volume = effectiveVolume;
            }
        });
    };
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
    AudioManager.prototype.playBGM = function (srcOrElement, volume, loop) {
        var safeVolume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 1.0;
        var safeLoop = typeof loop === 'boolean' ? loop : true;
        if (srcOrElement instanceof HTMLAudioElement) {
            this.bgmAudio.pause();
            this.bgmAudio = srcOrElement;
        }
        else {
            this.bgmAudio.src = srcOrElement;
        }
        this.bgmAudio.volume = safeVolume * this.masterVolume;
        this.bgmAudio.loop = safeLoop;
        this.bgmAudio.play().catch(function (err) {
            console.error("AudioManager: Failed to play BGM.", err);
            if (err.name === 'NotSupportedError') {
                console.error("AudioManager: 格式不支援或路徑錯誤 (NotSupportedError)。請檢查資源路徑與 MIME 類型。");
            }
            else if (err.name === 'NotAllowedError') {
                console.warn("AudioManager: 播放被瀏覽器阻擋 (NotAllowedError)，通常是因為缺乏使用者互動。");
            }
        });
    };
    AudioManager.prototype.stopBGM = function () {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
    };
    AudioManager.prototype.fadeOutBGM = function (duration) {
        var _this = this;
        var step = this.bgmAudio.volume / (duration * 1000 / 50);
        var fadeInterval = setInterval(function () {
            if (_this.bgmAudio.volume > step) {
                _this.bgmAudio.volume -= step;
            }
            else {
                _this.bgmAudio.volume = 0;
                _this.stopBGM();
                clearInterval(fadeInterval);
            }
        }, 50);
    };
    AudioManager.prototype.fadeInBGM = function (duration, src, targetVolume, loop) {
        var _this = this;
        this.bgmAudio.src = src;
        this.bgmAudio.volume = 0;
        this.bgmAudio.loop = loop;
        this.bgmAudio.play().catch(console.error);
        var step = targetVolume / (duration * 1000 / 50);
        var fadeInterval = setInterval(function () {
            if (_this.bgmAudio.volume < targetVolume) {
                _this.bgmAudio.volume = Math.min(_this.bgmAudio.volume + step, targetVolume);
            }
            else {
                clearInterval(fadeInterval);
            }
        }, 50);
    };
    AudioManager.prototype.playSFX = function (src, volume) {
        var availableAudio = this.sfxPool.find(function (audio) { return audio.paused; });
        if (availableAudio) {
            availableAudio.src = src;
            availableAudio.volume = volume * this.masterVolume;
            availableAudio.play().catch(console.error);
        }
        else {
            console.warn('No available audio elements in the SFX pool.');
        }
    };
    return AudioManager;
}());
exports.default = AudioManager;
