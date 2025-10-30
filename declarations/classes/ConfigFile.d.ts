import { FileSystem } from "spinal-core-connectorjs";
import { ConfigFileModel } from "../models/ConfigFileModel";
export declare class ConfigFile {
    private static instance;
    private configFileModel;
    private conn;
    private constructor();
    static getInstance(): ConfigFile;
    getConfigFileModel(): ConfigFileModel | null;
    getValidatedModel(): ConfigFileModel;
    init(conn: FileSystem, filePath: string, organName: string, organType: string, port: number): Promise<ConfigFileModel>;
    private _loadOrMakeConfigFile;
    isInitialized(): boolean;
    updateMetrics(metrics: any): void;
    updateProcesses(processes: any[]): void;
    updateMetricsWithProcesses(metrics: any, processes: any[]): void;
    watchRestartCommands(callback: (command: any) => void): void;
    watchStopCommands(callback: (command: any) => void): void;
    watchStartCommands(callback: (command: any) => void): void;
    watchRefreshCommands(callback: () => void): void;
    updateCommandStatus(commandType: string, status: string, error?: string): void;
    getProcesses(): any[];
    getMetrics(): any;
}
declare const _default: ConfigFile;
export default _default;
