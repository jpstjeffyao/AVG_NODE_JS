import { StateManager } from '../src/core/StateManager';

describe('StateManager', () => {
    let stateManager: StateManager;

    beforeEach(() => {
        stateManager = new StateManager();
    });

    test('基本存取測試', () => {
        stateManager.setValue('testKey', 42);
        expect(stateManager.getValue('testKey')).toBe(42);
        expect(stateManager.getValue('nonExistentKey')).toBe(0);
    });

    test('旗標測試', () => {
        stateManager.setFlag('testFlag', true);
        expect(stateManager.checkFlag('testFlag')).toBe(true);
        stateManager.setFlag('testFlag', false);
        expect(stateManager.checkFlag('testFlag')).toBe(false);
    });

    test('快照與還原測試 (Persistence)', () => {
        stateManager.setValue('key1', 100);
        stateManager.setFlag('flag1', true);
        const snapshot = stateManager.createSnapshot();

        const newStateManager = new StateManager();
        newStateManager.loadSnapshot(snapshot);

        expect(newStateManager.getValue('key1')).toBe(100);
        expect(newStateManager.checkFlag('flag1')).toBe(true);
    });

    test('介面相容性', () => {
        expect(stateManager).toHaveProperty('initialize');
        expect(stateManager).toHaveProperty('update');
        expect(stateManager).toHaveProperty('shutdown');
        expect(stateManager).toHaveProperty('moduleName', 'StateModule');
    });
});