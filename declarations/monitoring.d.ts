/**
 * Récupère les métriques système (CPU, RAM, et Disque)
 */
export declare function getSystemMetrics(): Promise<{
    cpuUsage: string;
    ramUsage: string;
    totalRam: string;
    freeRam: string;
    totalDisk: string;
    freeDisk: string;
    diskUsage: string;
}>;
