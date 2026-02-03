import { ScriptEngine } from '../src/modules/ScriptEngine';
import { StateManager, GameState } from '../src/core/StateManager';
import { GameKernel } from '../src/core/GameKernel';
import { UIModule } from '../src/modules/UIModule';
import { AssetManager } from '../src/modules/AssetManager';
import AudioManager from '../src/modules/AudioManager';

// Mock Audio and HTMLAudioElement for Node.js/JSDOM environment
beforeAll(() => {
    global.Audio = jest.fn().mockImplementation(() => ({
        volume: 1,
        paused: true,
        play: jest.fn().mockResolvedValue(undefined), // Ensure Audio() constructor play() returns a promise
        pause: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    }));

    // Mock HTMLAudioElement globally for instanceof checks
    Object.defineProperty(global, 'HTMLAudioElement', {
        writable: true,
        value: class {
            src: string = '';
            volume: number = 1;
            loop: boolean = false;
            constructor(src?: string) {
                if (src) this.src = src;
            }
            play = jest.fn().mockResolvedValue(undefined); // Ensure HTMLAudioElement.play() returns a promise
            pause = jest.fn();
            addEventListener = jest.fn();
            removeEventListener = jest.fn();
        },
    });
});

describe('ScriptEngine', () => {
    let stateManager: StateManager;
    let scriptEngine: ScriptEngine;
    let kernel: GameKernel;
    let uiModule: UIModule; // Add uiModule reference
    let assetManager: AssetManager; // Add assetManager reference
    let audioManager: AudioManager; // Add audioManager reference
    let avgUiElement: HTMLElement; // Declare here
    let characterContainer: HTMLElement; // Declare here for CharacterModule
    let speakerDiv: HTMLDivElement;
    let contentDiv: HTMLDivElement;

    beforeEach(() => {
        // Setup a basic DOM for UIModule to find its container
        avgUiElement = document.createElement('div');
        avgUiElement.id = 'avg-ui';
        document.body.appendChild(avgUiElement);
        // Also need elements for speaker and content
        speakerDiv = document.createElement('div');
        speakerDiv.id = 'speaker';
        avgUiElement.appendChild(speakerDiv);
        contentDiv = document.createElement('div');
        contentDiv.id = 'content';
        avgUiElement.appendChild(contentDiv);

        // CharacterModule also needs its container
        characterContainer = document.createElement('div');
        characterContainer.id = 'character-container';
        document.body.appendChild(characterContainer);

        // Mock document.getElementById to return our created elements
        jest.spyOn(document, 'getElementById').mockImplementation((id) => {
            if (id === 'avg-ui') return avgUiElement;
            if (id === 'speaker') return speakerDiv;
            if (id === 'content') return contentDiv;
            if (id === 'character-container') return characterContainer;
            if (id === 'game-root' || id === 'app') return document.body; // Mock game root
            if (id === 'menu-screen') return document.createElement('div'); // Mock a menu-screen if UIModule needs it
            return null;
        });

        kernel = new GameKernel(); // <-- Instantiated after DOM setup and mocks
        stateManager = kernel.stateManager;
        scriptEngine = kernel.scriptEngine;
        uiModule = kernel.uiModule; // Get reference from kernel
        assetManager = kernel.assetManager; // Get reference from kernel
        audioManager = kernel.audio; // Get reference from kernel

        // CharacterModule's initialize depends on DOM, call it here
        kernel.characterModule.initialize();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks(); // Restore document.getElementById
        if (avgUiElement && avgUiElement.parentNode) {
            avgUiElement.parentNode.removeChild(avgUiElement);
        }
        if (characterContainer && characterContainer.parentNode) {
            characterContainer.parentNode.removeChild(characterContainer);
        }
    });

    test('加載劇本並執行 SET 指令', async () => {
        const script = [
            'SET|testKey|42',
        ];

        scriptEngine.loadScript(script);
        await scriptEngine.next(); // 執行 SET 指令

        expect(stateManager.getValue('testKey')).toBe(42);
    });

    test('加載劇本並執行 SAY 指令', async () => {
        const script = [
            'SAY|Hero|Hello World!',
        ];
        const renderTextSpy = jest.spyOn(uiModule, 'renderText');
        const showDialogSpy = jest.spyOn(uiModule, 'showDialog');

        scriptEngine.loadScript(script);
        await scriptEngine.next(); // 執行 SAY 指令

        expect(showDialogSpy).toHaveBeenCalled();
        expect(renderTextSpy).toHaveBeenCalledWith('Hero', 'Hello World!');
    });

    test('IF 指令跳轉', async () => {
        const script = [
            'SET|testKey|42',
            'IF|testKey|42|GOTO|LABEL_JUMP',
            'SAY|ShouldNotBePrinted',
            'LABEL|LABEL_JUMP',
            'SAY|Hero|Jumped!',
        ];
        const renderTextSpy = jest.spyOn(uiModule, 'renderText');

        scriptEngine.loadScript(script);
        await scriptEngine.next(); // SET
        await scriptEngine.next(); // IF, then GOTO
        await scriptEngine.next(); // SAY "Jumped!"

        expect(renderTextSpy).toHaveBeenCalledWith('Hero', 'Jumped!'); // Assuming default character if not specified
        expect(renderTextSpy).not.toHaveBeenCalledWith('Hero', 'ShouldNotBePrinted');
    });

    test('BG 指令設置背景', async () => {
        const script = ['BG|bg_room'];
        const setBGSpy = jest.spyOn(assetManager, 'setBG').mockResolvedValue(undefined);

        scriptEngine.loadScript(script);
        await scriptEngine.next();

        expect(setBGSpy).toHaveBeenCalledWith('bg_room');
    });

    // REMOVED SPRITE test case

    test('BGM_PLAY 指令播放背景音樂', async () => {
        const script = ['BGM_PLAY|FairyTale.mp3|0.7|true'];
        const ensureLoadedSpy = jest.spyOn(assetManager, 'ensureLoaded').mockResolvedValue(true);
        const getAssetSpy = jest.spyOn(assetManager, 'getAsset').mockReturnValue(new (global as any).HTMLAudioElement('assets/music/FairyTale.mp3'));
        const playBGM = jest.spyOn(audioManager, 'playBGM');

        scriptEngine.loadScript(script);
        await scriptEngine.next();

        expect(ensureLoadedSpy).toHaveBeenCalledWith('assets/music/FairyTale.mp3', 'music');
        expect(getAssetSpy).toHaveBeenCalledWith('FairyTale.mp3');
        expect(playBGM).toHaveBeenCalledWith(expect.any(HTMLAudioElement), 0.7, true);
    });

    test('BGM_STOP 指令停止背景音樂', async () => {
        const script = ['BGM_STOP'];
        const stopBGM = jest.spyOn(audioManager, 'stopBGM');

        scriptEngine.loadScript(script);
        await scriptEngine.next();

        expect(stopBGM).toHaveBeenCalled();
    });

    test('BGM_FADE_OUT 指令淡出背景音樂', async () => {
        const script = ['BGM_FADE_OUT|5'];
        const fadeOutBGM = jest.spyOn(audioManager, 'fadeOutBGM');

        scriptEngine.loadScript(script);
        await scriptEngine.next();

        expect(fadeOutBGM).toHaveBeenCalledWith(5);
    });

    test('BGM_FADE_IN 指令淡入背景音樂', async () => {
        const script = ['BGM_FADE_IN|3|001.wav|0.6|true'];
        const fadeInBGM = jest.spyOn(audioManager, 'fadeInBGM');

        scriptEngine.loadScript(script);
        await scriptEngine.next();

        expect(fadeInBGM).toHaveBeenCalledWith(3, 'assets/music/001.wav', 0.6, true);
    });

    test('SFX_PLAY 指令播放音效', async () => {
        const script = ['SFX_PLAY|night_insects.wav|0.5'];
        const ensureLoadedSpy = jest.spyOn(assetManager, 'ensureLoaded').mockResolvedValue(true);
        const getAssetSpy = jest.spyOn(assetManager, 'getAsset').mockReturnValue(new (global as any).HTMLAudioElement('assets/sound/night_insects.wav'));
        const playSFX = jest.spyOn(audioManager, 'playSFX');

        scriptEngine.loadScript(script);
        await scriptEngine.next();

        expect(ensureLoadedSpy).toHaveBeenCalledWith('assets/sound/night_insects.wav', 'sound');
        expect(getAssetSpy).toHaveBeenCalledWith('night_insects.wav');
        expect(playSFX).toHaveBeenCalledWith(expect.any(String), 0.5);
    });

    test('MV 指令播放影片', async () => {
        const script = ['MV|assets/mov/main.mp4']; // Updated path
        const playVideoSpy = jest.spyOn(uiModule, 'playVideo').mockResolvedValue(undefined);

        scriptEngine.loadScript(script);
        await scriptEngine.next();

        expect(playVideoSpy).toHaveBeenCalledWith('assets/mov/main.mp4', 1); // Updated to expect volume
        expect(scriptEngine["isWaitingForVideo"]).toBe(false); // Should be false after awaiting
    });

    test('CHOICE 指令顯示選項並等待選擇', async () => {
        const script = [
            'SAY|Hero|Choose!',
            'CHOICE|Option A:labelA|Option B:labelB',
            'LABEL|labelA',
            'SAY|Hero|You chose A.',
            'LABEL|labelB',
            'SAY|Hero|You chose B.',
        ];
        const showChoicesSpy = jest.spyOn(uiModule, 'showChoices');
        const clearDialogSpy = jest.spyOn(uiModule, 'clearDialog');
        const renderTextSpy = jest.spyOn(uiModule, 'renderText');

        scriptEngine.loadScript(script);
        await scriptEngine.next(); // SAY
        await scriptEngine.next(); // CHOICE - this should block

        expect(clearDialogSpy).toHaveBeenCalled();
        expect(showChoicesSpy).toHaveBeenCalledWith(['Option A', 'Option B']);
        expect(scriptEngine["isWaitingForChoice"]).toBe(true);

        // Simulate choice made
        window.dispatchEvent(new CustomEvent('choiceMade', { detail: 'Option A' }));
        await new Promise(process.nextTick); // Allow promise resolution

        expect(scriptEngine["isWaitingForChoice"]).toBe(false);
        // ScriptEngine should now be at 'SAY|Hero|You chose A.'
        await scriptEngine.next();
        expect(renderTextSpy).toHaveBeenCalledWith('Hero', 'You chose A.');
    });

    test('next() should skip empty lines and comments', async () => {
        const script = [
            '# This is a comment',
            '',
            '    ',
            'SAY|Hero|After comments',
        ];
        const renderTextSpy = jest.spyOn(uiModule, 'renderText');

        scriptEngine.loadScript(script);
        await scriptEngine.next();

        expect(renderTextSpy).toHaveBeenCalledWith('Hero', 'After comments');
    });

    test('Script ends, state changes to STATE_WAIT_END_INTERACTION', async () => {
        const script = ['SAY|Hero|The End.'];
        scriptEngine.loadScript(script);
        await scriptEngine.next(); // SAY
        await scriptEngine.next(); // After SAY, script should end

        expect(stateManager.getState()).toBe(GameState.STATE_WAIT_END_INTERACTION);
    });
});