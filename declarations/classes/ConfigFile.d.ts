import { ConfigFileModel } from "../models/ConfigFileModel";
export declare class ConfigFile {
    private static instance;
    private configFileModel;
    private constructor();
    static getInstance(): ConfigFile;
    updateMetrics(metrics: any): void;
    init(connect: spinal.FileSystem, fileName: string, type: string, serverName: string, port: number): Promise<ConfigFileModel>;
    private _loadOrMakeConfigFile;
    getConfigFile(): ConfigFileModel;
    getUpdateInterval(): number;
}
export declare const configFile: ConfigFile;
export default configFile;
