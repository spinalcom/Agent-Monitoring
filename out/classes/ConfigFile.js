"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configFile = exports.ConfigFile = void 0;
const spinal_core_connectorjs_1 = require("spinal-core-connectorjs");
const path_1 = require("path");
const ConfigFileModel_1 = require("../models/ConfigFileModel");
const config_1 = require("../config");
class ConfigFile {
    constructor() { }
    static getInstance() {
        if (!this.instance)
            this.instance = new ConfigFile();
        return this.instance;
    }
    updateMetrics(metrics) {
        if (!this.configFileModel) {
            throw new Error("ConfigFileModel is not initialized. Call init() first.");
        }
        this.configFileModel.updateFromMetrics(metrics);
    }
    async init(connect, fileName, type, serverName, port) {
        return this._loadOrMakeConfigFile(connect, fileName, type, serverName);
    }
    async _loadOrMakeConfigFile(connect, fileName, type, serverName) {
        return new Promise((resolve) => {
            spinal_core_connectorjs_1.spinalCore.load(connect, (0, path_1.resolve)((0, config_1.getConfig)().monitoringPath, fileName), async (file) => {
                this.configFileModel = file;
                //await this.file.initAsyncData();
                resolve(file);
            }, () => {
                connect.load_or_make_dir((0, config_1.getConfig)().monitoringPath, (directory) => {
                    const file = new ConfigFileModel_1.ConfigFileModel(fileName, type, serverName);
                    directory.force_add_file(fileName, file, { model_type: "ConfigFile" });
                    this.configFileModel = file;
                    resolve(file);
                });
            });
        });
    }
    getConfigFile() {
        return this.configFileModel;
    }
    getUpdateInterval() {
        return (0, config_1.getConfig)().updateInterval;
    }
}
exports.ConfigFile = ConfigFile;
exports.configFile = ConfigFile.getInstance();
exports.default = exports.configFile;
