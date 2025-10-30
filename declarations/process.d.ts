import { ConfigFileModel } from "./models/ConfigFileModel";
export declare function initProcessWatcher(modelInstance: ConfigFileModel): void;
export declare function refreshProcessList(): Promise<void>;
export declare function getProcessList(): Promise<any[]>;
export declare function findProcess(identifier: string, type: "name" | "pid" | "pm2_id"): any | null;
