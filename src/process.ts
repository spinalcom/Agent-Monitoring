import pm2 from "pm2";
import { ConfigFileModel } from "./models/ConfigFileModel";

let configFile: ConfigFileModel;
let watching = false;

// ======================================================
// 🚀 Initialisation de l'observateur
// ======================================================
export function initProcessWatcher(modelInstance: ConfigFileModel) {
  configFile = modelInstance;
  console.log("[ProcessWatcher] Initialisation OK");

  if (!watching) {
    setupWatchers();
    watching = true;
  }
}

// ======================================================
// 👀 Surveille les changements dans le modèle
// ======================================================
function setupWatchers() {
  console.log("[ProcessWatcher] Mise en place des watchers...");

  // ✅ Watcher pour redémarrage de processus
  configFile.commands.restartProcess.execute.bind(() => {
    if (configFile.commands.restartProcess.execute.get() === 1) {
      console.log("[Watcher] Requête de redémarrage détectée");
      
      // Ne pas attendre, mais gérer l'erreur
      handleRestartCommand()
        .finally(() => configFile.commands.restartProcess.execute.set(0));
    }
  });

  // ✅ Watcher pour arrêt de processus
  configFile.commands.stopProcess.execute.bind(() => {
    if (configFile.commands.stopProcess.execute.get() === 1) {
      console.log("[Watcher] Requête d'arrêt détectée");
      
      handleStopCommand()
        .finally(() => configFile.commands.stopProcess.execute.set(0));
    }
  });

  // ✅ Watcher pour démarrage de processus
  configFile.commands.startProcess.execute.bind(() => {
    if (configFile.commands.startProcess.execute.get() === 1) {
      console.log("[Watcher] Requête de démarrage détectée");
      
      handleStartCommand()
        .finally(() => configFile.commands.startProcess.execute.set(0));
    }
  });

  // ✅ Watcher pour actualisation de la liste
  configFile.commands.refreshProcesses.execute.bind(() => {
    if (configFile.commands.refreshProcesses.execute.get() === 1) {
      console.log("[Watcher] Requête d'actualisation détectée");
      
      handleRefreshCommand()
        .finally(() => configFile.commands.refreshProcesses.execute.set(0));
    }
  });
}

// ======================================================
// 🔄 Gère la commande de redémarrage
// ======================================================
async function handleRestartCommand() {
  const targetId = configFile.commands.restartProcess.targetId.get();
  const targetType = configFile.commands.restartProcess.targetType.get();
  const requestedBy = configFile.commands.restartProcess.requestedBy.get();

  console.log(`[ProcessWatcher] Redémarrage ${targetType}: ${targetId} (demandé par: ${requestedBy})`);
  configFile.updateCommandStatus("restartProcess", "executing");

  try {
    await executePM2Action("restart", targetId, targetType);
    configFile.updateCommandStatus("restartProcess", "success");
    console.log(`[ProcessWatcher] Processus ${targetId} redémarré avec succès.`);
    
    // ✅ Actualiser la liste des processus après redémarrage
    setTimeout(() => refreshProcessList(), 2000);
    
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    configFile.updateCommandStatus("restartProcess", "error", message);
    console.error("[ProcessWatcher] Erreur redémarrage :", err);
  }
}

// ======================================================
// 🛑 Gère la commande d'arrêt
// ======================================================
async function handleStopCommand() {
  const targetId = configFile.commands.stopProcess.targetId.get();
  const targetType = configFile.commands.stopProcess.targetType.get();
  const requestedBy = configFile.commands.stopProcess.requestedBy.get();

  console.log(`[ProcessWatcher] Arrêt ${targetType}: ${targetId} (demandé par: ${requestedBy})`);
  configFile.updateCommandStatus("stopProcess", "executing");

  try {
    await executePM2Action("stop", targetId, targetType);
    configFile.updateCommandStatus("stopProcess", "success");
    console.log(`[ProcessWatcher] Processus ${targetId} arrêté avec succès.`);
    
    // ✅ Actualiser la liste des processus après arrêt
    setTimeout(() => refreshProcessList(), 2000);
    
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    configFile.updateCommandStatus("stopProcess", "error", message);
    console.error("[ProcessWatcher] Erreur arrêt :", err);
  }
}

// ======================================================
// ▶️ Gère la commande de démarrage
// ======================================================
async function handleStartCommand() {
  const targetId = configFile.commands.startProcess.targetId.get();
  const targetType = configFile.commands.startProcess.targetType.get();
  const requestedBy = configFile.commands.startProcess.requestedBy.get();

  console.log(`[ProcessWatcher] Démarrage ${targetType}: ${targetId} (demandé par: ${requestedBy})`);
  configFile.updateCommandStatus("startProcess", "executing");

  try {
    await executePM2Action("start", targetId, targetType);
    configFile.updateCommandStatus("startProcess", "success");
    console.log(`[ProcessWatcher] Processus ${targetId} démarré avec succès.`);
    
    // ✅ Actualiser la liste des processus après démarrage
    setTimeout(() => refreshProcessList(), 2000);
    
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    configFile.updateCommandStatus("startProcess", "error", message);
    console.error("[ProcessWatcher] Erreur démarrage :", err);
  }
}

// ======================================================
// 🔁 Gère la commande d'actualisation des processus
// ======================================================
async function handleRefreshCommand() {
  console.log("[ProcessWatcher] Actualisation de la liste des processus");
  configFile.updateCommandStatus("refreshProcesses", "executing");
  
  try {
    await refreshProcessList();
    configFile.updateCommandStatus("refreshProcesses", "success");
    console.log("[ProcessWatcher] Liste des processus actualisée avec succès");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    configFile.updateCommandStatus("refreshProcesses", "error", message);
    console.error("[ProcessWatcher] Erreur refresh:", err);
  }
}

// ======================================================
// 📋 Récupère et met à jour la liste des processus PM2
// ======================================================
export async function refreshProcessList(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    pm2.connect((err) => {
      if (err) {
        console.error("[ProcessWatcher] Erreur connexion PM2:", err);
        return reject(err);
      }

      pm2.list((err, processes) => {
        if (err) {
          console.error("[ProcessWatcher] Erreur liste PM2:", err);
          pm2.disconnect();
          return reject(err);
        }

        // ✅ Mappage des données selon l'interface IPM2Process - SUPPRESSION DES CHAMPS PROBLÉMATIQUES
        const processData = processes.map((p: any) => ({
          pid: p.pid || 0,
          pm2_id: p.pm_id || 0,
          name: p.name || "",
          status: (p.pm2_env as any)?.status || "unknown",
          alias: p.name || "",
          path: (p.pm2_env as any)?.pm_exec_path || "",
          // ✅ SUPPRIMÉ: createdAt, lastUptime, memory, cpu
          restarts: (p.pm2_env as any)?.restart_time || 0,
        }));

        // ✅ Mise à jour via la méthode du ConfigFileModel
        configFile.updateProcesses(processData);
        console.log(`[ProcessWatcher] ${processData.length} processus mis à jour dans ConfigFile.`);
        
        pm2.disconnect();
        resolve();
      });
    });
  });
}

// ======================================================
// 🎯 Exécution unifiée des actions PM2
// ======================================================
async function executePM2Action(action: string, targetId: string, targetType: string): Promise<void> {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) {
        console.error(`[ProcessWatcher] Erreur connexion PM2 pour ${action}:`, err);
        return reject(err);
      }

      const actionCallback = (err?: Error) => {
        pm2.disconnect();
        if (err) {
          console.error(`[ProcessWatcher] Échec ${action} PM2:`, err);
          return reject(err);
        }
        console.log(`[ProcessWatcher] ${action.toUpperCase()} réussi pour ${targetId}`);
        resolve();
      };

      // ✅ Exécution selon le type de cible
      if (targetType === "pm2_id") {
        // Utilisation de l'ID PM2
        const pm2Id = parseInt(targetId);
        if (isNaN(pm2Id)) {
          pm2.disconnect();
          return reject(new Error("ID PM2 invalide"));
        }
        executeAction(action, pm2Id, actionCallback);
        
      } else if (targetType === "name") {
        // Utilisation du nom du processus
        executeAction(action, targetId, actionCallback);
        
      } else if (targetType === "pid") {
        // Recherche par PID puis action sur le nom
        pm2.list((err, processes) => {
          if (err) {
            pm2.disconnect();
            return reject(err);
          }
          
          const proc = processes.find((p) => p.pid === Number(targetId));
          if (!proc || !proc.name) {
            pm2.disconnect();
            return reject(new Error(`Processus avec PID ${targetId} non trouvé`));
          }
          
          executeAction(action, proc.name, actionCallback);
        });
        
      } else {
        pm2.disconnect();
        reject(new Error(`Type de cible invalide: ${targetType}. Utilisez 'pm2_id', 'name' ou 'pid'.`));
      }
    });
  });
}

// ======================================================
// 🔧 Exécute l'action PM2 spécifiée - Correction des surcharges
// ======================================================
function executeAction(action: string, target: string | number, callback: (err?: Error) => void) {
  switch (action) {
    case "restart":
      if (typeof target === 'number') {
        pm2.restart(target, callback);
      } else {
        pm2.restart(target, callback);
      }
      break;
    case "stop":
      if (typeof target === 'number') {
        pm2.stop(target, callback);
      } else {
        pm2.stop(target, callback);
      }
      break;
    case "start":
      // ✅ Pour start, PM2 n'accepte que des strings (noms de processus ou fichiers de config)
      if (typeof target === 'number') {
        // Convertir l'ID en nom de processus d'abord
        pm2.list((err, processes) => {
          if (err) return callback(err);
          const proc = processes.find(p => p.pm_id === target);
          if (!proc || !proc.name) {
            return callback(new Error(`Processus avec ID ${target} non trouvé`));
          }
          pm2.start(proc.name, callback);
        });
      } else {
        pm2.start(target, callback);
      }
      break;
    case "reload":
      if (typeof target === 'number') {
        pm2.reload(target, callback);
      } else {
        pm2.reload(target, callback);
      }
      break;
    default:
      callback(new Error(`Action non supportée: ${action}`));
  }
}

// ======================================================
// 📊 Fonction utilitaire : Obtenir la liste des processus
// ======================================================
export async function getProcessList(): Promise<any[]> {
  if (!configFile) {
    throw new Error("ProcessWatcher non initialisé");
  }
  
  // ✅ Récupérer directement depuis PM2 pour avoir les infos complètes
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) return reject(err);
      
      pm2.list((err, processes) => {
        pm2.disconnect();
        if (err) return reject(err);
        
        const formattedProcesses = processes.map((p: any) => ({
          pid: p.pid || 0,
          pm2_id: p.pm_id || 0,
          name: p.name || "",
          status: (p.pm2_env as any)?.status || "unknown",
          alias: p.name || "",
          path: (p.pm2_env as any)?.pm_exec_path || "",
          // ✅ Formatage direct depuis PM2 pour l'affichage
          createdAt: (p.pm2_env as any)?.created_at ? new Date((p.pm2_env as any).created_at).toISOString() : "N/A",
          lastUptime: (p.pm2_env as any)?.pm_uptime ? new Date((p.pm2_env as any).pm_uptime).toISOString() : "N/A",
          memory: p.monit?.memory ? `${Math.round(p.monit.memory / 1024 / 1024)} MB` : "0 MB",
          cpu: p.monit?.cpu ? `${p.monit.cpu}%` : "0%",
          restarts: (p.pm2_env as any)?.restart_time || 0
        }));
        
        resolve(formattedProcesses);
      });
    });
  });
}

// ======================================================
// 🔍 Fonction utilitaire : Rechercher un processus
// ======================================================
export function findProcess(identifier: string, type: "name" | "pid" | "pm2_id"): any | null {
  if (!configFile) {
    return null;
  }
  
  for (let i = 0; i < configFile.pm2Processes.length; i++) {
    const proc = configFile.pm2Processes[i];
    
    switch (type) {
      case "name":
        if (proc.name.get() === identifier || proc.alias.get() === identifier) {
          return {
            pid: proc.pid.get(),
            pm2_id: proc.pm2_id.get(),
            name: proc.name.get(),
            status: proc.status.get(),
            alias: proc.alias.get(),
            path: proc.path.get(),
            restarts: proc.restarts.get()
          };
        }
        break;
      case "pid":
        if (proc.pid.get() === parseInt(identifier)) {
          return {
            pid: proc.pid.get(),
            pm2_id: proc.pm2_id.get(),
            name: proc.name.get(),
            status: proc.status.get(),
            alias: proc.alias.get(),
            path: proc.path.get(),
            restarts: proc.restarts.get()
          };
        }
        break;
      case "pm2_id":
        if (proc.pm2_id.get() === parseInt(identifier)) {
          return {
            pid: proc.pid.get(),
            pm2_id: proc.pm2_id.get(),
            name: proc.name.get(),
            status: proc.status.get(),
            alias: proc.alias.get(),
            path: proc.path.get(),
            restarts: proc.restarts.get()
          };
        }
        break;
    }
  }
  
  return null;
}
