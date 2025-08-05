import { spinalCore, Model } from "spinal-core-connectorjs";
import { resolve as path_resolve } from "path";
import { ConfigFileModel } from "../models/ConfigFileModel";
import { getConfig } from "../config";


export class ConfigFile {
  private static instance: ConfigFile;
  private configFileModel: ConfigFileModel;

  private constructor() {}

  public static getInstance(): ConfigFile {
    if (!this.instance) this.instance = new ConfigFile();
    return this.instance;
  }
public updateMetrics(metrics: any): void {
  if (!this.configFileModel) {
    throw new Error("ConfigFileModel is not initialized. Call init() first.");
  }
  this.configFileModel.updateFromMetrics(metrics);
}

  public async init(
    connect: spinal.FileSystem,
    fileName: string,
    type: string,
    serverName: string,
    port: number
  ): Promise<ConfigFileModel> {
    return this._loadOrMakeConfigFile(connect, fileName, type, serverName);
  }

  private async _loadOrMakeConfigFile(
    connect: spinal.FileSystem,
    fileName: string,
    type: string,
    serverName: string
  ): Promise<ConfigFileModel> {
    return new Promise((resolve) => {
      spinalCore.load(
        connect,
        path_resolve(getConfig().monitoringPath, fileName),
        async (file: ConfigFileModel) => {
          this.configFileModel = file;
          //await this.file.initAsyncData();
          resolve(file);
        },
        () => {
          connect.load_or_make_dir(getConfig().monitoringPath, (directory: any) => {
            const file = new ConfigFileModel(fileName, type, serverName);
            directory.force_add_file(fileName, file, { model_type: "ConfigFile" });
            this.configFileModel = file;
            resolve(file);
          });
        }
      );
    });
  }

  public getConfigFile() {
    return this.configFileModel;
  }


 


  public getUpdateInterval(): number {
    return getConfig().updateInterval;
  }
}

export const configFile = ConfigFile.getInstance();
export default configFile;