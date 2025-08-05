import { FileSystem, spinalCore, Lst, Model, Ptr, Str, Val } from "spinal-core-connectorjs";
import os from "os";

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
  macAddress?: string; // Optionnel, peut être récupéré via os.networkInterfaces()
}

export class ConfigFileModel extends Model {
  genericOrganData: IGenericOrganData;

  constructor(name?: string, type?: string, serverName?: string) {
    super();

    // Valeurs par défaut pour les arguments manquants
    const defaultName = "Unnamed Organ";
    const defaultType = "Unknown Type";
    const defaultServerName = "Unknown Server";

    // Initialiser les attributs avec les types SpinalCore
    this.add_attr({
      genericOrganData: {
        id: new Str(Date.now().toString()),
        name: new Str(name || defaultName), // Utilisation de la valeur par défaut si "name" est manquant
        type: new Str(type || defaultType), // Utilisation de la valeur par défaut si "type" est manquant
        bootTimestamp: new Val(Date.now()),
        lastHealthTime: new Val(Date.now()),
        macAddress: new Str(""),
        ipAddress: new Str(this.getIpAddress()),
        ramUsage: new Str(""),
        totalRam: new Str(""),
        freeRam: new Str(""),
        cpuUsage: new Str(""),
        totalDisk: new Str(""),
        freeDisk: new Str(""),
        diskUsage: new Str(""),
        serverName: new Str(serverName || defaultServerName), // Utilisation de la valeur par défaut si "serverName" est manquant
        version: new Str("1.0"),
        logList: new Lst<ILog>(),
      },
    });
  }

  private getIpAddress(): string {
    const networkInterfaces = os.networkInterfaces();
    for (const iface of Object.values(networkInterfaces)) {
      if (iface) {
        for (const details of iface) {
          if (!details.internal && details.family === "IPv4") {
            return details.address;
          }
        }
      }
    }
    return "Unknown";
  }


  

  public updateFromMetrics(metrics: SystemMetrics) {
    this.genericOrganData.cpuUsage.set(metrics.cpuUsage);
    this.genericOrganData.ramUsage.set(metrics.ramUsage);
    this.genericOrganData.totalRam.set(metrics.totalRam);
    this.genericOrganData.freeRam.set(metrics.freeRam);
    this.genericOrganData.freeDisk.set(metrics.freeDisk);
    this.genericOrganData.totalDisk.set(metrics.totalDisk);
    this.genericOrganData.diskUsage.set(metrics.diskUsage);
    this.genericOrganData.macAddress.set(metrics.macAddress);
    this.genericOrganData.lastHealthTime.set(Date.now());
  }
}

spinalCore.register_models(ConfigFileModel, "ConfigFileModel");
