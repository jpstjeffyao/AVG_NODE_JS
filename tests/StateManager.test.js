"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StateManager_1 = require("../src/core/StateManager");
describe('StateManager', function () {
    var stateManager;
    beforeEach(function () {
        stateManager = new StateManager_1.StateManager();
    });
    test('基本存取測試', function () {
        stateManager.setValue('testKey', 42);
        expect(stateManager.getValue('testKey')).toBe(42);
        expect(stateManager.getValue('nonExistentKey')).toBe(0);
    });
    test('旗標測試', function () {
        stateManager.setFlag('testFlag', true);
        expect(stateManager.checkFlag('testFlag')).toBe(true);
        stateManager.setFlag('testFlag', false);
        expect(stateManager.checkFlag('testFlag')).toBe(false);
    });
    test('快照與還原測試 (Persistence)', function () {
        stateManager.setValue('key1', 100);
        stateManager.setFlag('flag1', true);
        var snapshot = stateManager.createSnapshot();
        var newStateManager = new StateManager_1.StateManager();
        newStateManager.loadSnapshot(snapshot);
        expect(newStateManager.getValue('key1')).toBe(100);
        expect(newStateManager.checkFlag('flag1')).toBe(true);
    });
    test('介面相容性', function () {
        expect(stateManager).toHaveProperty('initialize');
        expect(stateManager).toHaveProperty('update');
        expect(stateManager).toHaveProperty('shutdown');
        expect(stateManager).toHaveProperty('moduleName', 'StateModule');
    });
});
