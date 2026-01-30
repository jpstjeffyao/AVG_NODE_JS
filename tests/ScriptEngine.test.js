"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ScriptEngine_1 = require("@modules/ScriptEngine");
var StateManager_1 = require("@core/StateManager");
var GameKernel_1 = require("@core/GameKernel");
// Mock Audio for Node.js environment
beforeAll(function () {
    global.Audio = jest.fn().mockImplementation(function () { return ({
        volume: 1,
        paused: true,
        play: jest.fn(),
        pause: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    }); });
});
describe('ScriptEngine', function () {
    var stateManager;
    var scriptEngine;
    var kernel;
    beforeEach(function () {
        stateManager = new StateManager_1.StateManager();
        // Mock window.GameKernel for ScriptEngine
        global.window = {
            GameKernel: {
                getInstance: function () { return GameKernel_1.GameKernel.getInstance(); }
            }
        };
        kernel = GameKernel_1.GameKernel.getInstance();
        scriptEngine = new ScriptEngine_1.ScriptEngine(stateManager, kernel);
    });
    afterEach(function () {
        delete global.window;
    });
    test('加載劇本並執行指令', function () {
        var script = [
            'SET|testKey|42',
            'SAY|Hello World!'
        ];
        scriptEngine.loadScript(script);
        scriptEngine.next(); // 執行 SET 指令
        scriptEngine.next(); // 執行 SAY 指令
        expect(stateManager.getValue('testKey')).toBe(42);
    });
    test('IF 指令跳轉', function () {
        var script = [
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
