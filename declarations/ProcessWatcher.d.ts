import type { IMonitoringFile } from './interfaces/IMonitoring';
export default class ProcessWatcher {
    private monitoringFile;
    constructor(monitoringFile: IMonitoringFile);
    /** Lance l'observation des statuts */
    startWatching(): void;
    private restartProcess;
    private stopProcess;
    private startProcess;
    private updateStatus;
}
