import { FileSystem, spinalCore, Lst } from "spinal-core-connectorjs";
import { ConfigFileModel } from "../models/ConfigFileModel";
import * as path from "path";

export class ConfigFile {
  private static instance: ConfigFile;
  private configFileModel: ConfigFileModel | null = null;
  private conn: FileSystem | null = null;

  private constructor() {}

  public static getInstance(): ConfigFile {
    if (!this.instance) this.instance = new ConfigFile();
    return this.instance;
  }

  // ✅ Getter public pour accéder au modèle
  public getConfigFileModel(): ConfigFileModel | null {
    return this.configFileModel;
  }

  // ✅ Méthode pour obtenir le modèle avec vérification
  public getValidatedModel(): ConfigFileModel {
    if (!this.configFileModel) {
      throw new Error("ConfigFile n'est pas encore initialisé");
    }
    return this.configFileModel;
  }

  // Initialise le fichier de configuration avec le pattern singleton
  async init(
    conn: FileSystem,
    filePath: string,
    organName: string,
    organType: string,
    port: number
  ): Promise<ConfigFileModel> {
    this.conn = conn;
    return this._loadOrMakeConfigFile(conn, filePath, organName, organType);
  }

  private async _loadOrMakeConfigFile(
    conn: FileSystem,
    filePath: string,
    organName: string,
    organType: string
  ): Promise<ConfigFileModel> {
    return new Promise((resolve, reject) => {
      spinalCore.load(
        conn,
        filePath,
        (model: ConfigFileModel) => {
          console.log("✅ Fichier de configuration existant chargé depuis:", filePath);
          this.configFileModel = model;
          resolve(model);
        },
        () => {
          console.log("🆕 Création d'un nouveau fichier de configuration dans:", filePath);
          
          // Extraire le répertoire et le nom du fichier
          const directory = path.dirname(filePath);
          const fileName = path.basename(filePath);
          
          conn.load_or_make_dir(directory, (dir: any) => {
            const file = new ConfigFileModel(organName, organType);
            dir.force_add_file(fileName, file, { model_type: "ConfigFile" });
            this.configFileModel = file;
            console.log("💾 Fichier de configuration sauvegardé dans:", filePath, "avec type ConfigFile");
            resolve(file);
          });
        }
      );
    });
  }

  // ✅ Vérifie si le modèle est initialisé
  isInitialized(): boolean {
    return this.configFileModel !== null;
  }

  // ✅ Met à jour les métriques système
  updateMetrics(metrics: any): void {
    if (!this.configFileModel) {
      throw new Error("ConfigFileModel is not initialized. Call init() first.");
    }
    this.configFileModel.updateFromMetrics(metrics);
    console.log('📊 Métriques mises à jour dans ConfigFile');
  }

  // ✅ Met à jour la liste des processus PM2
  updateProcesses(processes: any[]): void {
    if (!this.configFileModel) {
      throw new Error("ConfigFileModel is not initialized. Call init() first.");
    }
    this.configFileModel.updateProcesses(processes);
    console.log(`📋 ${processes.length} processus mis à jour dans ConfigFile`);
  }

  // ✅ Met à jour les métriques ET les processus
  updateMetricsWithProcesses(metrics: any, processes: any[]): void {
    if (!this.configFileModel) {
      throw new Error("ConfigFileModel is not initialized. Call init() first.");
    }
    this.configFileModel.updateMetricsWithProcesses(metrics, processes);
    console.log('📊 Métriques et processus mis à jour dans ConfigFile');
  }

  // ✅ Surveille les commandes de restart
  watchRestartCommands(callback: (command: any) => void) {
    if (this.configFileModel?.commands?.restartProcess) {
      this.configFileModel.commands.restartProcess.execute.bind(() => {
        const executeValue = this.configFileModel!.commands.restartProcess.execute.get();
        if (executeValue === 1) {
          const command = {
            targetId: this.configFileModel!.commands.restartProcess.targetId.get(),
            targetType: this.configFileModel!.commands.restartProcess.targetType.get(),
            requestedBy: this.configFileModel!.commands.restartProcess.requestedBy.get(),
            requestTime: this.configFileModel!.commands.restartProcess.requestTime.get()
          };
          callback(command);
        }
      });
    }
  }

  // ✅ Surveille les commandes de stop
  watchStopCommands(callback: (command: any) => void) {
    if (this.configFileModel?.commands?.stopProcess) {
      this.configFileModel.commands.stopProcess.execute.bind(() => {
        const executeValue = this.configFileModel!.commands.stopProcess.execute.get();
        if (executeValue === 1) {
          const command = {
            targetId: this.configFileModel!.commands.stopProcess.targetId.get(),
            targetType: this.configFileModel!.commands.stopProcess.targetType.get(),
            requestedBy: this.configFileModel!.commands.stopProcess.requestedBy.get(),
            requestTime: this.configFileModel!.commands.stopProcess.requestTime.get()
          };
          callback(command);
        }
      });
    }
  }

  // ✅ Surveille les commandes de start
  watchStartCommands(callback: (command: any) => void) {
    if (this.configFileModel?.commands?.startProcess) {
      this.configFileModel.commands.startProcess.execute.bind(() => {
        const executeValue = this.configFileModel!.commands.startProcess.execute.get();
        if (executeValue === 1) {
          const command = {
            targetId: this.configFileModel!.commands.startProcess.targetId.get(),
            targetType: this.configFileModel!.commands.startProcess.targetType.get(),
            requestedBy: this.configFileModel!.commands.startProcess.requestedBy.get(),
            requestTime: this.configFileModel!.commands.startProcess.requestTime.get()
          };
          callback(command);
        }
      });
    }
  }

  // ✅ Surveille les commandes de refresh
  watchRefreshCommands(callback: () => void) {
    if (this.configFileModel?.commands?.refreshProcesses) {
      this.configFileModel.commands.refreshProcesses.execute.bind(() => {
        const executeValue = this.configFileModel!.commands.refreshProcesses.execute.get();
        if (executeValue === 1) {
          callback();
        }
      });
    }
  }

  // ✅ Met à jour le statut d'une commande
  updateCommandStatus(commandType: string, status: string, error?: string) {
    if (this.configFileModel?.commands?.[commandType]) {
      this.configFileModel.commands[commandType].status.set(status);
      this.configFileModel.commands[commandType].lastExecuted.set(new Date().toISOString());
      this.configFileModel.commands[commandType].execute.set(0);
      if (error) {
        this.configFileModel.commands[commandType].error.set(error);
      } else {
        this.configFileModel.commands[commandType].error.set("");
      }
    }
  }

  // ✅ Obtient la liste des processus
  getProcesses(): any[] {
    if (this.configFileModel?.pm2Processes) {
      const processes = [];
      for (let i = 0; i < this.configFileModel.pm2Processes.length; i++) {
        const proc = this.configFileModel.pm2Processes[i];
        processes.push({
          pid: proc.pid.get(),
          pm2_id: proc.pm2_id.get(),
          name: proc.name.get(),
          status: proc.status.get(),
          alias: proc.alias.get(),
          path: proc.path.get(),
          createdAt: proc.createdAt.get(),
          lastUptime: proc.lastUptime.get(),
          memory: proc.memory.get(),
          cpu: proc.cpu.get(),
          restarts: proc.restarts.get()
        });
      }
      return processes;
    }
    return [];
  }

  // ✅ Obtient les métriques complètes
  getMetrics(): any {
    if (this.configFileModel) {
      return {
        cpuUsage: this.configFileModel.genericOrganData.cpuUsage.get(),
        ramUsage: this.configFileModel.genericOrganData.ramUsage.get(),
        totalRam: this.configFileModel.genericOrganData.totalRam.get(),
        freeRam: this.configFileModel.genericOrganData.freeRam.get(),
        totalDisk: this.configFileModel.genericOrganData.totalDisk.get(),
        freeDisk: this.configFileModel.genericOrganData.freeDisk.get(),
        diskUsage: this.configFileModel.genericOrganData.diskUsage.get(),
        macAddress: this.configFileModel.genericOrganData.macAddress.get(),
        pm2Processes: this.getProcesses(),
        processCount: this.configFileModel.processCount.get(),
        lastUpdate: this.configFileModel.lastUpdate.get()
      };
    }
    return {};
  }
}

// Export de l'instance singleton
export default ConfigFile.getInstance();