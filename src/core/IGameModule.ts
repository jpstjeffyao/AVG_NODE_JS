export interface IGameModule {
    initialize(): void;
    update(): void;
    shutdown(): void;
}