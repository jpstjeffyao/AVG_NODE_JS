import { IGameModule } from "./IGameModule";

interface Snapshot {
    data: [string, number][];
    flags: string[];
    metadata: { scriptId: string; lineNumber: number; timestamp: number; };
}

export class StateManager implements IGameModule {
    public moduleName: string; // 新增屬性
    private _data: Map<string, number>;
    private _flags: Set<string>;
    private _metadata: { scriptId: string; lineNumber: number; timestamp: number; };

    constructor() {
        this._data = new Map();
        this._flags = new Set();
        this._metadata = { scriptId: '', lineNumber: 0, timestamp: Date.now() };
                this.moduleName = 'StateModule'; // 初始化屬性
    }

    setValue(key: string, value: number): void {
        this._data.set(key, value);
    }

    getValue(key: string): number {
        return this._data.get(key) || 0; // Return 0 if key does not exist
    }

    setFlag(key: string, active: boolean): void {
        if (active) {
            this._flags.add(key);
        } else {
            this._flags.delete(key);
        }
    }

    checkFlag(key: string): boolean {
        return this._flags.has(key);
    }

    createSnapshot(): Snapshot {
        return {
            data: Array.from(this._data.entries()),
            flags: Array.from(this._flags),
            metadata: this._metadata
        };
    }

    loadSnapshot(data: { data: [string, number][]; flags: string[]; metadata: { scriptId: string; lineNumber: number; timestamp: number; }; }): void {
        this._data = new Map(data.data);
        this._flags = new Set(data.flags);
        this._metadata = data.metadata;
    }

    initialize(): void {
        // Initialization logic here
    }

    update(): void {
        // Update logic here
    }

    shutdown(): void {
        // Shutdown logic here
    }
}