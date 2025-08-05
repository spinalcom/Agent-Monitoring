"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = require("node-cron");
const spinal_core_connectorjs_1 = require("spinal-core-connectorjs");
const ConfigFile_1 = require("./classes/ConfigFile");
const monitoring_1 = require("./monitoring");
// Récupère l'instance de ConfigFile
const config = ConfigFile_1.default; // ✅ Utilise directement l'instance exportée
async function main() {
    let conn;
    // Configuration de la connexion à SpinalCore
    const protocol = process.env.SPINALHUB_PROTOCOL || "http";
    const user = process.env.SPINALHUB_USER_ID || "168"; // Valeur par défaut
    const password = process.env.SPINAL_PASSWORD || "TjN75sjJ455czW"; // Valeur par défaut
    const host = process.env.SPINALHUB_IP || "127.0.0.1"; // Valeur par défaut
    const port = process.env.SPINALHUB_PORT || "10100"; // Valeur par défaut
    const connect_opt = `${protocol}://${user}:${password}@${host}:${port}/`;
    try {
        // Initialisation de la connexion
        conn = spinal_core_connectorjs_1.spinalCore.connect(connect_opt);
        console.log('✅ Connexion à SpinalCore établie avec succès !');
    }
    catch (error) {
        console.error('❌ Erreur lors de la connexion à SpinalCore :', error);
        return; // Arrête l'exécution si la connexion échoue
    }
    // Initialisation du fichier de configuration
    async function initializeConfigFile() {
        try {
            console.log('🔄 Initialisation du fichier de configuration...');
            await config.init(conn, // Connexion SpinalCore
            'VM_MONITORING', // Nom du fichier
            'VM Monitoring Agent', // Type d'agent
            'SpinalServer01', // Nom du serveur
            8080 // Port
            );
            console.log('✅ ConfigFile initialisé avec succès !');
        }
        catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du fichier de configuration :', error);
        }
    }
    // Mise à jour des métriques système
    async function updateMetricsFromSystem() {
        try {
            const metrics = await (0, monitoring_1.getSystemMetrics)(); // Récupère les métriques
            config.updateMetrics(metrics); // Met à jour les métriques dans ConfigFile
            console.log('📊 Métriques mises à jour :', metrics);
        }
        catch (error) {
            console.error("❌ Erreur lors de la récupération des métriques :", error);
        }
    }
    // Initialisation du fichier de configuration
    await initializeConfigFile();
    // Mise à jour des métriques toutes les 30 secondes
    setInterval(updateMetricsFromSystem, 30 * 1000);
    // Optionnel : Utilisation de node-cron pour des tâches planifiées
    node_cron_1.default.schedule('*/1 * * * *', async () => {
        console.log('⏰ Exécution de la tâche planifiée...');
        await updateMetricsFromSystem();
    });
}
// Lancement du programme
main().catch((error) => {
    console.error('❌ Erreur critique dans la fonction main :', error);
});
