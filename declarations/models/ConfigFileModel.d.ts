import { Lst, Model, Str, Val } from "spinal-core-connectorjs";
export interface ILog extends Model {
    timeStamp: Val;
    message: Str;
}
export interface IControlAction extends Model {
    actionType: Str;
    targetId: Str;
    status: Str;
    timestamp: Str;
    result: Str;
}
export interface IGenericOrganData extends Model {
    id: Str;
    name: Str;
    type: Str;
    bootTimestamp: Val;
    lastHealthTime: Val;
    macAddress: Str;
    ipAddress: Str;
    ramUsage: Str;
    totalRam: Str;
    freeRam: Str;
    cpuUsage: Str;
    totalDisk: Str;
    freeDisk: Str;
    diskUsage: Str;
    serverName: Str;
    version: Str;
    logList: Lst<ILog>;
    controlActions: Lst<IControlAction>;
}
export interface SystemMetrics {
    cpuUsage: string;
    ramUsage: string;
    totalRam: string;
    freeRam: string;
    totalDisk: string;
    freeDisk: string;
    diskUsage: string;
    macAddress?: string;
}
export interface IPM2Process extends Model {
    pid: Val;
    pm2_id: Val;
    name: Str;
    status: Str;
    alias: Str;
    path: Str;
    createdAt: Val;
    lastUptime: Val;
    memory: Val;
    cpu: Val;
    restarts: Val;
}
export interface IRestartCommand extends Model {
    targetId: Str;
    targetType: Str;
    execute: Val;
    status: Str;
    lastExecuted: Str;
    error: Str;
}
export interface IRefreshCommand extends Model {
    execute: Val;
    status: Str;
    lastExecuted: Str;
}
export interface ICommands extends Model {
    restartProcess: IRestartCommand;
    refreshProcesses: IRefreshCommand;
}
export declare class ConfigFileModel extends Model {
    genericOrganData: IGenericOrganData;
    pm2Processes: Lst<IPM2Process>;
    commands: ICommands;
    lastUpdate: Str;
    processCount: Val;
    constructor(name?: string, type?: string, serverName?: string);
    private getIpAddress;
    updateFromMetrics(metrics: SystemMetrics): void;
    updateProcesses(processes: any[]): void;
    updateMetricsWithProcesses(metrics: SystemMetrics, processes: any[]): void;
    updateCommandStatus(commandType: string, status: string, error?: string): void;
    addControlAction(actionType: string, targetId: string): string;
    updateControlAction(targetId: string, actionType: string, status: string, result?: string): void;
    getPendingActions(): any[];
    get_model_type(): string;
}
