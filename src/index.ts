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

import configFile from './classes/ConfigFile';

import { io } from "socket.io-client";
import { getSystemMetrics } from './monitoring';

import { initProcessWatcher, getProcessList,refreshProcessList } from './process';
import dotenv from 'dotenv';
import * as path from "path";
import { ConfigFileModel } from './models/ConfigFileModel';

// Charge les variables d'environnement depuis le fichier .env à la racine du projet
dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("ENV:", {
  SPINALHUB_PROTOCOL: process.env.SPINALHUB_PROTOCOL,
  SPINALHUB_USER_ID: process.env.SPINALHUB_USER_ID,
  SPINAL_PASSWORD: process.env.SPINAL_PASSWORD,
  SPINALHUB_IP: process.env.SPINALHUB_IP,
  SPINALHUB_PORT: process.env.SPINALHUB_PORT,
});


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

// ✅ Mise à jour des métriques système avec processus
async function updateMetricsFromSystem() {
  try {
    // ✅ Vérification que le ConfigFile est initialisé
    if (!config.isInitialized()) {
      console.log("⚠️ ConfigFile non initialisé, attente...");
      return;
    }

    console.log('🔄 Récupération des métriques et processus...');
    
    const metrics = await getSystemMetrics();
    
    // ✅ CORRECTION: Actualiser d'abord la liste PM2 SANS récupérer les données formatées
    await refreshProcessList();
    
    const macAddress = getMacAddress(); // ✅ Récupère l'adresse MAC

    // ✅ Ajoute l'adresse MAC aux métriques
    const metricsWithMac = {
      ...metrics,
      macAddress: macAddress || 'unknown'
    };

    // ✅ CORRECTION: Mettre à jour SEULEMENT les métriques, PAS les processus
    config.updateMetrics(metricsWithMac);
    
    // ✅ Pour l'affichage seulement, récupérer les données formatées
    const Pm2Processes = await getProcessList();
    
    console.log('📊 Métriques et processus mis à jour dans ConfigFile:', {
      ...metricsWithMac,
      processCount: Pm2Processes.length
    });
    
    // ✅ Log des processus pour debug
    console.log(`📋 ${Pm2Processes.length} processus PM2 disponibles:`);
    Pm2Processes.forEach(proc => {
      console.log(`  - ${proc.name} (ID: ${proc.pm2_id}, PID: ${proc.pid}, Status: ${proc.status})`);
    });
    
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des métriques :", error);
  }
}

async function main() {
  let conn: FileSystem;

  // Configuration de la connexion à SpinalCore
  const protocol = process.env.SPINALHUB_PROTOCOL?.trim();
  const user = process.env.SPINALHUB_USER_ID?.trim();
  const password = process.env.SPINAL_PASSWORD?.trim();
  const host = process.env.SPINALHUB_IP?.trim();
  const port = process.env.SPINALHUB_PORT?.trim();

  if (!protocol || !user || !password || !host || !port) {
    console.error('❌ Une ou plusieurs variables d\'environnement SPINALHUB sont manquantes.');
    return;
  }

  const connect_opt = `${protocol}://${user}:${password}@${host}:${port}/`;

  try {
    // Initialisation de la connexion
    conn = spinalCore.connect(connect_opt);
    console.log('✅ Connexion à SpinalCore établie avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la connexion à SpinalCore :', error);
    return;
  }

  // ✅ Connecte-toi à ton serveur API Socket.IO
  const socket = io("http://146.59.157.197:3001");

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

  // ✅ Initialisation du fichier de configuration
  async function initializeConfigFile() {
    try {
      console.log('🔄 Initialisation du fichier de configuration...');
      const hostname = os.hostname();
      const fileName = `VM_MONITORING_${hostname}`;
      
      // ✅ Nouveau chemin : /etc/Organs/Monitoring/
      const filePath = `/etc/Organs/Monitoring/${fileName}`;

      await config.init(
        conn,
        filePath,
        'VM Monitoring Agent',
        'Bare4',
        8080
      );
      
      console.log('✅ ConfigFile initialisé avec succès !', filePath);
      
      // ✅ Initialise le ProcessWatcher après l'initialisation avec la bonne méthode
      const model = config.getValidatedModel();
      initProcessWatcher(model);
      console.log('✅ ProcessWatcher initialisé avec le modèle');
      
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation:", error);
    }
  }

  // Initialisation
  await initializeConfigFile();

  // ✅ Première mise à jour immédiate
  setTimeout(async () => {
    console.log('🚀 Première mise à jour des données...');
    await updateMetricsFromSystem();
  }, 3000);

  // ✅ Cron job pour les mises à jour périodiques
  cron.schedule('*/1 * * * *', async () => {
    console.log('⏰ Exécution de la tâche planifiée...');
    await updateMetricsFromSystem();
  });

  console.log('🎯 Agent de monitoring initialisé - contrôle via ConfigFile uniquement');
}

// Lancement du programme
main().catch((error) => {
  console.error('❌ Erreur critique dans la fonction main :', error);
});