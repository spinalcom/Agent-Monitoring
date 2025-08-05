import { FileSystem } from "spinal-core-connectorjs";
declare class LoadSystemStatus {
    private static instance;
    private apiConnector;
    private constructor();
    static getInstance(): LoadSystemStatus;
    loadAndSendStatus(conn: FileSystem): Promise<void>;
    private _loadConfigFile;
    private sendStatusToMonitoring;
}
declare const _default: LoadSystemStatus;
export default _default;
