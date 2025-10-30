export interface IProcessModel {
    name: {
        get(): string;
    };
    id: {
        get(): string;
    };
    status: {
        get(): string;
        set(value: string): void;
        bind(callback: () => void): void;
    };
}
export interface IProcessItem {
    Model: IProcessModel;
}
export interface IMonitoringFile {
    ConfigFile?: {
        pm2Processes: IProcessItem[];
    };
    pm2Processes?: IProcessItem[];
}
