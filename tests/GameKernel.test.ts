import { GameKernel } from '@core/GameKernel';
import { IGameModule } from '@core/IGameModule';
import { GameState } from '@core/StateManager';

// Mock Audio for Node.js environment
beforeAll(() => {
    global.Audio = jest.fn().mockImplementation(() => ({
        volume: 1,
        paused: true,
        play: jest.fn(),
        pause: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    }));
});
describe('GameKernel', () => {
    let kernel: GameKernel;

    beforeEach(() => {
        kernel = new GameKernel();
    });

    test('should register modules', () => {
        let initCalled = false;
        
        const mockModule: IGameModule = {
            moduleName: "MockModule", // Added for IGameModule interface
            initialize: () => { initCalled = true; },
            update: () => {},
            shutdown: () => {}
        };
        
        kernel.registerModule(mockModule);
        expect(kernel.modules).toContain(mockModule);
    });

    test('should initialize modules', () => {
        let initCalled = false;
        
        const mockModule: IGameModule = {
            moduleName: "MockModule",
            initialize: () => { initCalled = true; },
            update: () => {},
            shutdown: () => {}
        };
        
        kernel.registerModule(mockModule);
        kernel.initializeModules();
        
        expect(initCalled).toBe(true);
    });

    test('should run without errors even if modules throw during update', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const badModule: IGameModule = {
            moduleName: "BadModule",
            initialize: () => {},
            update: () => { throw new Error('update error'); },
            shutdown: () => {}
        };
        
        kernel.registerModule(badModule);
        
        expect(() => {
            kernel.update();
        }).not.toThrow();
        
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Module update error:'),
            expect.any(Error)
        );
        
        consoleSpy.mockRestore();
    });

    test('should run without errors even if modules throw during initialize', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const badModule: IGameModule = {
            moduleName: "BadModule",
            initialize: () => { throw new Error('initialize error'); },
            update: () => {},
            shutdown: () => {}
        };
        
        kernel.registerModule(badModule);
        
        expect(() => {
            kernel.initializeModules();
        }).not.toThrow();
        
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Error initializing module BadModule:'), // Updated message based on GameKernel.ts
            expect.any(Error)
        );
        
        consoleSpy.mockRestore();
    });

    test('onUserClick should call scriptEngine.next() if not in WAIT_END_INTERACTION or FADING_OUT state', async () => {
        // Mock state to be PLAYING
        kernel.stateManager.setState(GameState.STATE_PLAYING);
        const mockNext = jest.fn().mockResolvedValue(undefined);
        
        // Mock ScriptEngine inside kernel instance
        kernel.scriptEngine.next = mockNext;
        
        await kernel.onUserClick();
        expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('onUserClick should trigger fadeOut and avg_fade_complete event if in WAIT_END_INTERACTION state', async () => {
        kernel.stateManager.setState(GameState.STATE_WAIT_END_INTERACTION);
        
        // Mock UIModule.fadeOut
        const mockFadeOut = jest.fn().mockResolvedValue(undefined);
        kernel.uiModule.fadeOut = mockFadeOut;

        const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

        await kernel.onUserClick();

        expect(mockFadeOut).toHaveBeenCalledTimes(1);
        expect(kernel.stateManager.getState()).toBe(GameState.STATE_FADING_OUT);
        expect(dispatchEventSpy).toHaveBeenCalledWith(new CustomEvent('avg_fade_complete'));
        dispatchEventSpy.mockRestore();
    });

    test('onUserClick should not call scriptEngine.next() if in FADING_OUT state', async () => {
        kernel.stateManager.setState(GameState.STATE_FADING_OUT);
        const mockNext = jest.fn().mockResolvedValue(undefined);
        kernel.scriptEngine.next = mockNext;

        await kernel.onUserClick();
        expect(mockNext).not.toHaveBeenCalled();
    });

    test('startGame should set state to PLAYING and call scriptEngine.next()', async () => {
        kernel.stateManager.setState(GameState.STATE_TITLE);
        const mockNext = jest.fn().mockResolvedValue(undefined);
        kernel.scriptEngine.next = mockNext;

        await kernel.startGame();

        expect(kernel.stateManager.getState()).toBe("STATE_PLAYING");
        expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('loadScript should call scriptEngine.loadScript()', () => {
        const mockLoadScript = jest.fn();
        kernel.scriptEngine.loadScript = mockLoadScript;
        const testScript = ["SAY|Test|Hello"];

        kernel.loadScript(testScript);

        expect(mockLoadScript).toHaveBeenCalledWith(testScript);
    });

    test('start should call startGame', async () => {
        const mockStartGame = jest.fn().mockResolvedValue(undefined);
        kernel.startGame = mockStartGame;

        await kernel.start();
        expect(mockStartGame).toHaveBeenCalledTimes(1);
    });
});

