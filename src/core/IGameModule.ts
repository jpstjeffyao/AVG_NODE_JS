export interface IGameModule {
    moduleName?: string; // Make it optional as not all modules might strictly need it
    initialize(): void;
    update(): void;
    shutdown(): void;
    
    // UI-specific methods, made optional
    hideMenu?(): void;
    showDialog?(): void;
    playVideo?(videoPath: string): Promise<void>;
}