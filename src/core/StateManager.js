"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = void 0;
var StateManager = /** @class */ (function () {
    function StateManager() {
        this._data = new Map();
        this._flags = new Set();
        this._metadata = { scriptId: '', lineNumber: 0, timestamp: Date.now() };
        this.moduleName = 'StateModule'; // 初始化屬性
    }
    StateManager.prototype.setValue = function (key, value) {
        this._data.set(key, value);
    };
    StateManager.prototype.getValue = function (key) {
        return this._data.get(key) || 0; // Return 0 if key does not exist
    };
    StateManager.prototype.setFlag = function (key, active) {
        if (active) {
            this._flags.add(key);
        }
        else {
            this._flags.delete(key);
        }
    };
    StateManager.prototype.checkFlag = function (key) {
        return this._flags.has(key);
    };
    StateManager.prototype.createSnapshot = function () {
        return {
            data: Array.from(this._data.entries()),
            flags: Array.from(this._flags),
            metadata: this._metadata
        };
    };
    StateManager.prototype.loadSnapshot = function (data) {
        this._data = new Map(data.data);
        this._flags = new Set(data.flags);
        this._metadata = data.metadata;
    };
    StateManager.prototype.initialize = function () {
        // Initialization logic here
    };
    StateManager.prototype.update = function () {
        // Update logic here
    };
    StateManager.prototype.shutdown = function () {
        // Shutdown logic here
    };
    return StateManager;
}());
exports.StateManager = StateManager;
