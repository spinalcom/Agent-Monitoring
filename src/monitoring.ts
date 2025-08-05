import os from "os";
import path from "path";
import configFile from "./classes/ConfigFile";
const diskusage = require("diskusage");
import { getConfig } from "./config";

const config = configFile;
const MACHINE_NAME: string = os.hostname();

/**
 * Récupère les métriques système (CPU, RAM, et Disque)
 */
export async function getSystemMetrics(): Promise<{
  cpuUsage: string;
  ramUsage: string;
  totalRam: string;
  freeRam: string;
  totalDisk: string;
  freeDisk: string;
  diskUsage: string;
}> {
  try {
    // Utilisation CPU en pourcentage
    const cpus = os.cpus();
    const cpuUsage =
      cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
        const idle = cpu.times.idle;
        return acc + (total - idle) / total;
      }, 0) / cpus.length;

    // Mémoire totale et mémoire libre
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Informations d'utilisation du disque
    const diskPath = (getConfig() as any).diskPath || path.parse(__dirname).root;
    const diskInfo = await diskusage.check(diskPath);

    // Retourne les métriques formatées
    return {
      cpuUsage: (cpuUsage * 100).toFixed(2) + "%", // Pourcentage d'utilisation CPU
      ramUsage: ((usedMemory / totalMemory) * 100).toFixed(2) + "%", // Pourcentage d'utilisation RAM
      totalRam: (totalMemory / 1e9).toFixed(2) + " GB", // RAM totale en GB
      freeRam: (freeMemory / 1e9).toFixed(2) + " GB", // RAM libre en GB
      totalDisk: (diskInfo.total / 1e9).toFixed(2) + " GB", // Disque total en GB
      freeDisk: (diskInfo.free / 1e9).toFixed(2) + " GB", // Disque libre en GB
      diskUsage: (((diskInfo.total - diskInfo.free) / diskInfo.total)*100).toFixed(2) + "%", // Pourcentage d'utilisation du disque
    };
  } catch (error) {
    console.error("Error while fetching system metrics:", error);
    throw error;
  }
}

/**
 * Met à jour les métriques dans le modèle de configuration
 */
async function updateMetrics() {
  try {
    const metrics = await getSystemMetrics();
    config.updateMetrics(metrics);
  } catch (error) {
    console.error("Error while updating metrics:", error);
  }
}

// Met à jour les métriques toutes les 30 secondes
setInterval(updateMetrics, 30 * 1000);