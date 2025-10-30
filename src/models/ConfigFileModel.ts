import { FileSystem, spinalCore, Lst, Model, Ptr, Str, Val, Bool } from "spinal-core-connectorjs";
import os from "os";

export interface ILog extends Model {
  timeStamp: Val;
  message: Str;
}

export interface IControlAction extends Model {
  actionType: Str;    // "restart", "stop", "start", "update"
  targetId: Str;      // ID du processus ciblé
  status: Str;        // "pending", "processing", "completed", "failed"
  timestamp: Str;     // Quand l'action a été demandée
  result: Str;        // Résultat de l'action
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
  controlActions: Lst<IControlAction>; // ✅ Ajout de la liste d'actions
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

// ✅ Nouvelle interface pour les processus PM2
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

// ✅ Interface pour les commandes
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

// ✅ Une seule classe ConfigFileModel qui combine tout
export class ConfigFileModel extends Model {
  genericOrganData: IGenericOrganData;
  pm2Processes: Lst<IPM2Process>;
  commands: ICommands;
  lastUpdate: Str;
  processCount: Val;

  constructor(name?: string, type?: string, serverName?: string) {
    super();

    // Valeurs par défaut
    const defaultName = "VM Monitoring Agent";
    const defaultType = "Monitoring";
    const defaultServerName = os.hostname();

    this.add_attr({
      // ✅ Définir explicitement le type de modèle
      _type: new Str("ConfigFile"),
      fileType: new Str("ConfigFile"),
      
      // ✅ Données de base de l'organe
      genericOrganData: {
        id: new Str(Date.now().toString()),
        name: new Str(name || defaultName),
        type: new Str(type || defaultType),
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
        serverName: new Str(serverName || defaultServerName),
        version: new Str("1.0"),
        logList: new Lst<ILog>(),
        controlActions: new Lst<IControlAction>(), // ✅ Ajout de la liste d'actions
      },
      
      // ✅ Liste des processus PM2
      pm2Processes: new Lst<IPM2Process>(),
      
      // ✅ Commandes de contrôle
      commands: {
        restartProcess: {
          targetId: new Str(""),           // ID du processus à redémarrer
          targetType: new Str(""),         // "pm2_id", "name", ou "pid"
          execute: new Val(0),             // 0 = pas d'action, 1 = exécuter
          status: new Str("idle"),         // "idle", "executing", "success", "error"
          lastExecuted: new Str(""),       // Timestamp de dernière exécution
          error: new Str(""),              // Message d'erreur si échec
          requestedBy: new Str(""),        // Qui a demandé l'action
          requestTime: new Str("")         // Quand l'action a été demandée
        },
        
        stopProcess: {
          targetId: new Str(""),
          targetType: new Str(""),
          execute: new Val(0),
          status: new Str("idle"),
          lastExecuted: new Str(""),
          error: new Str(""),
          requestedBy: new Str(""),
          requestTime: new Str("")
        },
        
        startProcess: {
          targetId: new Str(""),
          targetType: new Str(""),
          execute: new Val(0),
          status: new Str("idle"),
          lastExecuted: new Str(""),
          error: new Str(""),
          requestedBy: new Str(""),
          requestTime: new Str("")
        },
        
        refreshProcesses: {
          execute: new Val(0),
          status: new Str("idle"),
          lastExecuted: new Str(""),
          requestedBy: new Str(""),
          requestTime: new Str("")
        }
      },
      
      // ✅ Métadonnées
      lastUpdate: new Str(""),
      processCount: new Val(0)
    });

    // ✅ Forcer le type du modèle
    this.model_type = "ConfigFile";
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

  // ✅ Met à jour les métriques système
  public updateFromMetrics(metrics: SystemMetrics) {
    this.genericOrganData.cpuUsage.set(metrics.cpuUsage);
    this.genericOrganData.ramUsage.set(metrics.ramUsage);
    this.genericOrganData.totalRam.set(metrics.totalRam);
    this.genericOrganData.freeRam.set(metrics.freeRam);
    this.genericOrganData.freeDisk.set(metrics.freeDisk);
    this.genericOrganData.totalDisk.set(metrics.totalDisk);
    this.genericOrganData.diskUsage.set(metrics.diskUsage);
    if (metrics.macAddress) {
      this.genericOrganData.macAddress.set(metrics.macAddress);
    }
    this.genericOrganData.lastHealthTime.set(Date.now());
    this.lastUpdate.set(new Date().toISOString());
  }

  // ✅ Met à jour la liste des processus PM2
  public updateProcesses(processes: any[]) {
    this.pm2Processes.clear();
    
    for (const proc of processes) {
      const pm2Process = {
        pid: new Val(proc.pid || null),
        pm2_id: new Val(proc.pm2_id || null),
        name: new Str(proc.name || ""),
        status: new Str(proc.status || "unknown"),
        alias: new Str(proc.alias || ""),
        path: new Str(proc.path || ""),
        createdAt: new Val(proc.createdAt || null),
        lastUptime: new Val(proc.lastUptime || null),
        memory: new Val(proc.memory || 0),
        cpu: new Val(proc.cpu || 0),
        restarts: new Val(proc.restarts || 0)
      };
      this.pm2Processes.push(pm2Process);
    }
    
    this.processCount.set(processes.length);
    this.lastUpdate.set(new Date().toISOString());
  }

  // ✅ Met à jour métriques ET processus
  public updateMetricsWithProcesses(metrics: SystemMetrics, processes: any[]) {
    this.updateFromMetrics(metrics);
    this.updateProcesses(processes);
  }

  // ✅ Met à jour le statut d'une commande
  public updateCommandStatus(commandType: string, status: string, error?: string) {
    if (commandType === 'restartProcess') {
      this.commands.restartProcess.status.set(status);
      this.commands.restartProcess.lastExecuted.set(new Date().toISOString());
      this.commands.restartProcess.execute.set(0); // ✅ 0 au lieu de false
      this.commands.restartProcess.error.set(error || "");
    } else if (commandType === 'refreshProcesses') {
      this.commands.refreshProcesses.status.set(status);
      this.commands.refreshProcesses.lastExecuted.set(new Date().toISOString());
      this.commands.refreshProcesses.execute.set(0); // ✅ 0 au lieu de false
    }
  }

  // ✅ Ajoute une nouvelle action de contrôle
  public addControlAction(actionType: string, targetId: string): string {
    const actionId = `${actionType}_${targetId}_${Date.now()}`;
    
    const controlAction = {
      actionType: new Str(actionType),
      targetId: new Str(targetId),
      status: new Str("pending"),
      timestamp: new Str(new Date().toISOString()),
      result: new Str("")
    };
    
    this.genericOrganData.controlActions.push(controlAction);
    return actionId;
  }

  // ✅ Met à jour le statut d'une action
  public updateControlAction(targetId: string, actionType: string, status: string, result?: string) {
    for (let i = 0; i < this.genericOrganData.controlActions.length; i++) {
      const action = this.genericOrganData.controlActions[i];
      if (action.targetId.get() === targetId && action.actionType.get() === actionType) {
        action.status.set(status);
        if (result) {
          action.result.set(result);
        }
        break;
      }
    }
  }

  // ✅ Obtient les actions en attente
  public getPendingActions(): any[] {
    const pendingActions = [];
    for (let i = 0; i < this.genericOrganData.controlActions.length; i++) {
      const action = this.genericOrganData.controlActions[i];
      if (action.status.get() === "pending") {
        pendingActions.push({
          actionType: action.actionType.get(),
          targetId: action.targetId.get(),
          status: action.status.get(),
          timestamp: action.timestamp.get(),
          result: action.result.get()
        });
      }
    }
    return pendingActions;
  }

  // ✅ Surcharger la méthode get_model_type
  get_model_type(): string {
    return "ConfigFile";
  }
}

// ✅ Enregistrement avec le bon type
spinalCore.register_models(ConfigFileModel, "ConfigFile");
