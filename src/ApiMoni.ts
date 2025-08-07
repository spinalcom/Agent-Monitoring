import axios, { AxiosRequestConfig } from "axios";
import { getSystemMetrics } from "./monitoring";
import dotenv from "dotenv";

dotenv.config();

// Interface pour les métriques système
interface SystemMetrics {
  serverManagerId: string;
  cpuUsage: string;
  ramUsage: string;
  totalRam: string;
  freeRam: string;
  totalDisk: string;
  freeDisk: string;
  diskUsage: string;
}

class MonitoringService {
  private readonly baseUrl: string;
  private readonly registerKey: string;
  private readonly serverManagerId: string;

  constructor() {
    this.baseUrl = this.getRequiredEnv('MONITORING_URL');
    console.log("🔍 URL de monitoring:", this.baseUrl);
    this.registerKey = this.getRequiredEnv('REGISTER_KEY');
    this.serverManagerId = this.getRequiredEnv('SERVER_MANAGER_ID');
  }
  

  private getRequiredEnv(varName: string): string {
    const value = process.env[varName];
    if (!value) throw new Error(`Variable manquante: ${varName}`);
    return value;
  }

  async sendMetrics(): Promise<void> {
    const metrics = await getSystemMetrics();

    const payload = {
      registerKey: this.registerKey,
      infoServer: {
        serverManagerId: this.serverManagerId,
        timestamp: new Date().toISOString(),
        cpu: parseFloat(metrics.cpuUsage.replace('%', '')),
        ram: parseFloat(metrics.ramUsage.replace('%', '')),
        disk: parseFloat(metrics.diskUsage.replace('%', '')),
        totalRam: metrics.totalRam,
        freeRam: metrics.freeRam,
        totalDisk: metrics.totalDisk,
        freeDisk: metrics.freeDisk,
        service: "monitoring-agent"
      }
    };

    console.log("Envoi des données:", JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post(
        `${this.baseUrl}/pushDataServer`,
        payload,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getRequiredEnv('TOKEN_BOS_REGISTER')}`
          },
          timeout: 10000
        }
      );

      console.log("✅ Succès:", response.status, response.data);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  private handleError(error: unknown): void {
    if (axios.isAxiosError(error)) {
      console.error("❌ Erreur API:", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
        url: error.config?.url
      });
    } else {
      console.error("❌ Erreur inattendue:", error);
    }
  }
}

// Exécution
(async () => {
  try {
    const monitor = new MonitoringService();
    await monitor.sendMetrics();
    console.log("Données envoyées avec succès !");
  } catch (error) {
    console.error("Échec de l'envoi des données");
    process.exit(1);
  }
})();