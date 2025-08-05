/*
 * Copyright 2023 SpinalCom - www.spinalcom.com
 * 
 * This file is part of SpinalCore.
 * 
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 * 
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 * 
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */

import cron from 'node-cron';
import os from 'os';
import { Lst, spinalCore, FileSystem } from "spinal-core-connectorjs";
import { ConfigFile } from './classes/ConfigFile';
import configFile from './classes/ConfigFile';
import { ConfigFileModel } from "./models/ConfigFileModel";
import { io } from "socket.io-client";
import { getSystemMetrics } from './monitoring';
import { exec } from "child_process";
// Récupère l'instance de ConfigFile
const config = configFile; // ✅ Utilise directement l'instance exportée

function getMacAddress(): string | undefined {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
        return iface.mac;
      }
    }
  }
  return undefined;
}

async function main() {
  let conn: FileSystem;

  // Configuration de la connexion à SpinalCore
  const protocol = process.env.SPINALHUB_PROTOCOL || "http";
  const user = process.env.SPINALHUB_USER_ID || "168"; // Valeur par défaut
  const password = process.env.SPINAL_PASSWORD || "TjN75sjJ455czW"; // Valeur par défaut
  const host = process.env.SPINALHUB_IP || "127.0.0.1"; // Valeur par défaut
  const port = process.env.SPINALHUB_PORT || "10100";// Valeur par défaut

  const connect_opt = `${protocol}://${user}:${password}@${host}:${port}/`;

  try {
    // Initialisation de la connexion
    conn = spinalCore.connect(connect_opt);
    console.log('✅ Connexion à SpinalCore établie avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la connexion à SpinalCore :', error);
    return; // Arrête l'exécution si la connexion échoue
  }

  // Connecte-toi à ton serveur API Socket.IO
const socket = io("http://146.59.157.197:3001"); // adapte l’URL si le serveur est distant

// Quand l'agent est connecté

socket.on("connect", () => {
  console.log("Agent connecté !");
  const macAddress = getMacAddress();
if (!macAddress) {
  console.error("❌ Impossible de récupérer l'adresse MAC. Abandon.");
  return;
}

socket.emit("register-agent", { serverId: macAddress });
console.log("📡 Agent enregistré avec serverID =", macAddress);

});
  // Initialisation du fichier de configuration
  async function initializeConfigFile() {
    try {
      console.log('🔄 Initialisation du fichier de configuration...');
      const hostname = os.hostname(); // nom de la machine locale
      const fileName = `VM_MONITORING_${hostname}`; // Nom unique par machine

      await config.init(
        conn,                 // Connexion SpinalCore
        fileName,      // Nom du fichier
        'VM Monitoring Agent',// Type d'agent
        'Bare4',     // Nom du serveur
          8080                 // Port
      );
      console.log('✅ ConfigFile  initialisé avec succès !', fileName);
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du fichier de configuration :', error);
    }
  }

  // Mise à jour des métriques système
  async function updateMetricsFromSystem() {
    try {
      const metrics = await getSystemMetrics(); // Récupère les métriques
      const macAddress = getMacAddress();
      const metricsWithMac = { ...metrics, macAddress }; // Ajoute la MAC

      config.updateMetrics(metricsWithMac); // Met à jour les métriques dans ConfigFile
      console.log('📊 Métriques mises à jour :', metricsWithMac);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des métriques :", error);
    }
  }

  // Initialisation du fichier de configuration
  await initializeConfigFile();

  // Mise à jour des métriques toutes les 30 secondes
  setInterval(updateMetricsFromSystem, 30 * 1000);

  // Optionnel : Utilisation de node-cron pour des tâches planifiées
  cron.schedule('*/1 * * * *', async () => {
    console.log('⏰ Exécution de la tâche planifiée...');
    await updateMetricsFromSystem();
  });
}

// Lancement du programme
main().catch((error) => {
  console.error('❌ Erreur critique dans la fonction main :', error);
});