import { Lst, Model, Str, Val } from "spinal-core-connectorjs";
export interface ILog extends Model {
    timeStamp: Val;
    message: Str;
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
export declare class ConfigFileModel extends Model {
    genericOrganData: IGenericOrganData;
    constructor(name?: string, type?: string, serverName?: string);
    private getIpAddress;
    updateFromMetrics(metrics: SystemMetrics): void;
}
