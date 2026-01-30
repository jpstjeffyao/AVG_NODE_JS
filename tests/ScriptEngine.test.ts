import { ScriptEngine } from '@modules/ScriptEngine';
import { StateManager } from '@core/StateManager';
import { GameKernel } from '@core/GameKernel';

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

describe('ScriptEngine', () => {
    let stateManager: StateManager;
    let scriptEngine: ScriptEngine;
    let kernel: GameKernel;

    beforeEach(() => {
        stateManager = new StateManager();
        // Mock window.GameKernel for ScriptEngine
        (global as any).window = {
            GameKernel: {
                getInstance: () => GameKernel.getInstance()
            }
        };
        kernel = GameKernel.getInstance();
        scriptEngine = new ScriptEngine(stateManager, kernel);
    });

    afterEach(() => {
        delete (global as any).window;
    });

    test('加載劇本並執行指令', () => {
        const script = [
            'SET|testKey|42',
            'SAY|Hello World!'
        ];

        scriptEngine.loadScript(script);
        scriptEngine.next(); // 執行 SET 指令
        scriptEngine.next(); // 執行 SAY 指令

        expect(stateManager.getValue('testKey')).toBe(42);
    });

    test('IF 指令跳轉', () => {
        const script = [
            'SET|testKey|42',
            'IF|testKey|42|GOTO|4',
            'SAY|This should not be printed',
            'SAY|Jumped!',
        ];

        scriptEngine.loadScript(script);
        scriptEngine.next(); // 執行 SET 指令
        scriptEngine.next(); // 執行 IF 指令，應該跳轉
        scriptEngine.next(); // 執行 SAY 指令，應該打印 'Jumped!'

        expect(stateManager.getValue('testKey')).toBe(42);
    });
});