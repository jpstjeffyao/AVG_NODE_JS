"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var GameKernel_1 = require("../src/core/GameKernel");
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
describe('GameKernel', function () {
    beforeEach(function () {
        // @ts-ignore
        GameKernel_1.GameKernel.instance = undefined;
        // @ts-ignore
        GameKernel_1.GameKernel.getInstance().modules = [];
    });
    test('should be a singleton', function () {
        var instance1 = GameKernel_1.GameKernel.getInstance();
        var instance2 = GameKernel_1.GameKernel.getInstance();
        expect(instance1).toBe(instance2);
    });
    test('should register and boot modules', function () {
        var kernel = GameKernel_1.GameKernel.getInstance();
        var initCalled = false;
        var mockModule = {
            initialize: function () { initCalled = true; },
            update: function () { },
            shutdown: function () { }
        };
        kernel.registerModule(mockModule);
        kernel.boot();
        expect(initCalled).toBe(true);
    });
    test('should run without errors even if modules throw during update', function () {
        var kernel = GameKernel_1.GameKernel.getInstance();
        var consoleSpy = jest.spyOn(console, 'error').mockImplementation(function () { });
        var badModule = {
            initialize: function () { },
            update: function () { throw new Error('update error'); },
            shutdown: function () { }
        };
        kernel.registerModule(badModule);
        expect(function () {
            kernel.update();
        }).not.toThrow();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Module update error:'), expect.any(Error));
        consoleSpy.mockRestore();
    });
    test('should run without errors even if modules throw during boot', function () {
        var kernel = GameKernel_1.GameKernel.getInstance();
        var consoleSpy = jest.spyOn(console, 'error').mockImplementation(function () { });
        var badModule = {
            initialize: function () { throw new Error('boot error'); },
            update: function () { },
            shutdown: function () { }
        };
        kernel.registerModule(badModule);
        expect(function () {
            kernel.boot();
        }).not.toThrow();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Module initialization error:'), expect.any(Error));
        consoleSpy.mockRestore();
    });
    test('onUserClick should check if window and ScriptEngine exist', function () { return __awaiter(void 0, void 0, void 0, function () {
        var kernel, mockNext, mockScriptEngine;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    kernel = GameKernel_1.GameKernel.getInstance();
                    mockNext = jest.fn().mockResolvedValue(undefined);
                    mockScriptEngine = {
                        moduleName: "ScriptEngine",
                        next: mockNext
                    };
                    kernel.registerModule(mockScriptEngine);
                    return [4 /*yield*/, kernel.onUserClick()];
                case 1:
                    _a.sent();
                    expect(mockNext).toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
});
