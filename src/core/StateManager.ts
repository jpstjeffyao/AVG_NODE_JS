import { IGameModule } from "./IGameModule";
import { GameKernel } from "./GameKernel";

export enum GameState {
    STATE_TITLE = "STATE_TITLE",
    STATE_PLAYING = "STATE_PLAYING",
    STATE_WAIT_CHOICE = "STATE_WAIT_CHOICE",
    STATE_WAIT_END_INTERACTION = "STATE_WAIT_END_INTERACTION",
    STATE_FADING_OUT = "STATE_FADING_OUT"
}

/**
 * Interface definition for game save data
 */
export interface SaveData {
    timestamp: number;
    scriptName: string;
    lineIndex: number;
    variables: [string, number][]; // Serialized Map
    bgm: { src: string; volume: number; loop: boolean; } | null;
    background: string | null;
    characters: [string, string][]; // Serialized Map: position -> characterID
}

/**
 * Return type for save slot metadata
 */
export interface SaveSlotInfo {
    slot: number;
    timestamp: number;
    summary: string; // e.g., "Chapter 1 - 2023/10/27 10:00"
}

export class StateManager implements IGameModule {
    public moduleName: string = "StateManager";
    private _data: Map<string, number>;
    private _flags: Set<string>;
    private _metadata: { scriptId: string; lineNumber: number; timestamp: number; };
    private _currentState: GameState = GameState.STATE_TITLE;

    constructor() {
        this._data = new Map();
        this._flags = new Set();
        this._metadata = { scriptId: '', lineNumber: 0, timestamp: Date.now() };
    }

    initialize(): void {
        console.log("[StateManager] initialized.");
    }

    update(): void { }
    shutdown(): void { }

    // --- State Management ---

    setState(state: GameState): void {
        const oldState = this._currentState;
        this._currentState = state;
        console.log(`[StateManager] State changed: ${oldState} -> ${state}`);
    }

    getState(): GameState {
        return this._currentState;
    }

    // --- Variable Management ---

    setValue(key: string, value: number): void {
        this._data.set(key, value);
        console.log(`[StateManager] Set variable: ${key} = ${value}`);
    }

    getValue(key: string): number {
        return this._data.get(key) || 0;
    }

    // --- Flag Management (Existing API adaptation) ---
    // Keeping existing methods for compatibility, though variables map can handle flags ideally.

    setFlag(key: string, active: boolean): void {
        if (active) {
            this._flags.add(key);
            // Sync with variables for consistency if needed, strictly separated for now based on original code
        } else {
            this._flags.delete(key);
        }
    }

    checkFlag(key: string): boolean {
        return this._flags.has(key);
    }

    /**
     * Get current variables for saving
     */
    getSnapshot(): { data: [string, number][] } {
        return {
            data: Array.from(this._data.entries())
        };
    }

    // --- Save / Load System ---

    /**
     * Saves the game to a specific slot.
     * @param slot Slot number (e.g., 1)
     * @param data The gathered game data to save
     */
    saveGame(slot: number, data: SaveData): void {
        const key = `avg_save_${slot}`;
        try {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
            console.log(`[StateManager] Game saved to slot ${slot}`);
        } catch (e) {
            console.error(`[StateManager] Failed to save game to slot ${slot}:`, e);
        }
    }

    /**
     * Loads game data from a specific slot.
     * @param slot Slot number
     * @returns SaveData or null if not found/error
     */
    loadGame(slot: number): SaveData | null {
        const key = `avg_save_${slot}`;
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        try {
            const data: SaveData = JSON.parse(raw);
            return data;
        } catch (e) {
            console.error(`[StateManager] Failed to parse save data from slot ${slot}:`, e);
            return null;
        }
    }

    /**
     * Gets a list of populated save slots with basic info.
     */
    listSaves(): SaveSlotInfo[] {
        const list: SaveSlotInfo[] = [];
        // Check slots 1 to 20
        for (let i = 1; i <= 20; i++) {
            const key = `avg_save_${i}`;
            const raw = localStorage.getItem(key);
            if (raw) {
                try {
                    const data: SaveData = JSON.parse(raw);
                    const date = new Date(data.timestamp);
                    const timeStr = date.toLocaleString();
                    const summary = `Script: ${data.scriptName || 'Unknown'} (L${data.lineIndex})`;

                    list.push({
                        slot: i,
                        timestamp: data.timestamp,
                        summary: `${summary} - ${timeStr}`
                    });
                } catch (e) {
                    // Ignore corrupted slots
                }
            }
        }
        return list;
    }

    /**
     * Restores variables from loaded data.
     */
    restoreVariables(entries: [string, number][]): void {
        this._data = new Map(entries);
        console.log("[StateManager] Variables restored.");
    }
}