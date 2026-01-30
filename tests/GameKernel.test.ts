import { GameKernel } from '../src/core/GameKernel';
import { IGameModule } from '../src/core/IGameModule';

describe('GameKernel', () => {
    beforeEach(() => {
        // @ts-ignore
        GameKernel.instance = undefined;
        // @ts-ignore
        GameKernel.getInstance().modules = [];
    });

    test('should be a singleton', () => {
        const instance1 = GameKernel.getInstance();
        const instance2 = GameKernel.getInstance();
        expect(instance1).toBe(instance2);
    });

    test('should register and boot modules', () => {
        const kernel = GameKernel.getInstance();
        let initCalled = false;
        
        const mockModule: IGameModule = {
            initialize: () => { initCalled = true; },
            update: () => {},
            shutdown: () => {}
        };
        
        kernel.registerModule(mockModule);
        kernel.boot();
        
        expect(initCalled).toBe(true);
    });

    test('should run without errors even if modules throw during update', () => {
        const kernel = GameKernel.getInstance();
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const badModule: IGameModule = {
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

    test('should run without errors even if modules throw during boot', () => {
        const kernel = GameKernel.getInstance();
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const badModule: IGameModule = {
            initialize: () => { throw new Error('boot error'); },
            update: () => {},
            shutdown: () => {}
        };
        
        kernel.registerModule(badModule);
        
        expect(() => {
            kernel.boot();
        }).not.toThrow();
        
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Module initialization error:'),
            expect.any(Error)
        );
        
        consoleSpy.mockRestore();
    });

    test('onUserClick should check if window and ScriptEngine exist', () => {
        const kernel = GameKernel.getInstance();
        
        // Mock window.ScriptEngine
        const mockNext = jest.fn();
        const mockScriptEngine = {
            getInstance: () => ({
                next: mockNext
            })
        };

        // In node environment, window is undefined by default. 
        // Our code has a check 'typeof window !== "undefined"'
        
        // Let's temporarily mock window
        const originalWindow = global.window;
        (global as any).window = { ScriptEngine: mockScriptEngine };
        
        kernel.onUserClick();
        expect(mockNext).toHaveBeenCalled();
        
        (global as any).window = originalWindow;
    });
});
