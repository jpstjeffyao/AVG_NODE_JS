# System Settings Design Document

## 1. Overview
The System Settings module allows players to customize their game experience. Key configurations include audio handling (Master, BGM, SFX) and text presentation (Text message speed). These settings are global and persist across different game sessions and save slots.

## 2. Architecture

### 2.1 ConfigManager (New Core Component)
A new class `ConfigManager` will be responsible for:
-   Defining the `GameSettings` interface.
-   Loading settings from `localStorage` (`avg_game_settings`).
-   Saving settings to `localStorage`.
-   Providing default values.

**Interface:**
```typescript
interface GameSettings {
    masterVolume: number; // 0.0 - 1.0 (Default: 1.0)
    bgmVolume: number;    // 0.0 - 1.0 (Default: 1.0)
    sfxVolume: number;    // 0.0 - 1.0 (Default: 1.0)
    textSpeed: number;    // ms per char (Default: 40, Range: 10-100)
    autoPlaySpeed: number;// ms (Default: 2000)
    isMuted: boolean;     // (Default: false)
}
```

### 2.2 AudioManager Updates
The `AudioManager` currently only supports a single `masterVolume` that acts as a simple multiplier. It needs to be refactored to support a channel-based volume system.

**New Calculation:**
-   `Final BGM Volume` = `masterVolume` * `bgmVolume`
-   `Final SFX Volume` = `masterVolume` * `sfxVolume`

**Methods to Add:**
-   `setMasterVolume(v)`: Updates master volume.
-   `setBGMVolume(v)`: Updates BGM volume.
-   `setSFXVolume(v)`: Updates SFX volume.
-   `updateAudioVolumes()`: Recalculates volume for currently playing BGM and active SFX.

### 2.3 UIModule Updates
The `UIModule` needs to accept a dynamic text speed and render the settings UI.

**Text Speed:**
-   Modify `renderText` to use `ConfigManager.textSpeed` instead of hardcoded `40ms`.

**Settings Menu UI:**
-   Overlay menu similar to Save/Load.
-   **Visual Components:**
    -   **Sliders**: For Master, BGM, and SFX volumes.
    -   **Slider/Buttons**: For Text Speed (e.g., "Fast", "Normal", "Slow" or a granular slider).
    -   **Mute Toggle**: Checkbox.
    -   **Restore Defaults**: Button.
    -   **Close**: Button to save and close.

## 3. Data Flow

1.  **Boot Phase (`GameKernel`)**:
    -   `ConfigManager` loads settings from Storage.
    -   `GameKernel` applies loaded settings to `AudioManager` (volumes) and `UIModule` (text speed).

2.  **Runtime Change**:
    -   Player opens Settings Menu.
    -   Player drags BGM slider.
    -   `UIModule` calls `ConfigManager.updateSetting('bgmVolume', val)`.
    -   `ConfigManager` saves to Storage.
    -   `ConfigManager` notifies `AudioManager` to update volumes immediately.

## 4. UI Layout Mockup

```text
+--------------------------------------------------+
|                  SYSTEM SETTINGS                 |
+--------------------------------------------------+
|                                                  |
|  [VOLUME]                                        |
|  Master:  [========|==] 80%                      |
|  BGM:     [======|====] 60%                      |
|  SFX:     [==========|] 100%                     |
|           [ ] Mute All                           |
|                                                  |
|  [DISPLAY]                                       |
|  Text Speed:  Slow [-----|-----] Fast            |
|                                                  |
|                [Reset Defaults]                  |
|                    [Close]                       |
+--------------------------------------------------+
```

## 5. Implementation Steps
1.  **Core**: Implement `ConfigManager`.
2.  **Audio**: Refactor `AudioManager` loop and volume getters/setters.
3.  **Visuals**: Implement `renderText` speed variable.
4.  **UI Construction**: Build the DOM elements for the menu.
5.  **Integration**: Wire up events.
