import pm2 from 'pm2';
import type { IMonitoringFile, IProcessItem } from './interfaces/IMonitoring';

export default class ProcessWatcher {
  constructor(private monitoringFile: IMonitoringFile) {}

  /** Lance l'observation des statuts */
  public startWatching() {
    const processList =
      this.monitoringFile?.ConfigFile?.pm2Processes ||
      this.monitoringFile?.pm2Processes;

    if (!processList) {
      console.error('❌ Aucun processus trouvé dans le fichier de monitoring');
      return;
    }

    for (const processItem of processList) {
      const name = processItem.Model?.name?.get?.();
      const id = processItem.Model?.id?.get?.();

      processItem.Model.status.bind(async () => {
        try {
          const status = processItem.Model.status.get();
          console.log(`🔁 Status change detected for ${name}: ${status}`);

          if (status === 'restart') {
            await this.restartProcess(name, id);
          } else if (status === 'stop') {
            await this.stopProcess(name);
          } else if (status === 'start') {
            await this.startProcess(name);
          }
        } catch (error) {
          console.error(`❌ Error handling status change for ${name}:`, error);
        }
      });
    }
  }

  private async restartProcess(name: string, id: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error(`❌ Error connecting to PM2:`, err);
          reject(err);
          return;
        }

        pm2.restart(name, (err) => {
          if (err) {
            console.error(`❌ Error restarting ${name}:`, err);
            reject(err);
          } else {
            console.log(`✅ Process ${name} restarted`);
            this.updateStatus(id, 'running');
            resolve();
          }
          pm2.disconnect();
        });
      });
    });
  }

  private async stopProcess(name: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error(`❌ Error connecting to PM2:`, err);
          reject(err);
          return;
        }

        pm2.stop(name, (err) => {
          if (err) {
            console.error(`❌ Error stopping ${name}:`, err);
            reject(err);
          } else {
            console.log(`🛑 Process ${name} stopped`);
            resolve();
          }
          pm2.disconnect();
        });
      });
    });
  }

  private async startProcess(name: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error(`❌ Error connecting to PM2:`, err);
          reject(err);
          return;
        }

        pm2.start(name, (err) => {
          if (err) {
            console.error(`❌ Error starting ${name}:`, err);
            reject(err);
          } else {
            console.log(`▶️ Process ${name} started`);
            resolve();
          }
          pm2.disconnect();
        });
      });
    });
  }

  private updateStatus(id: string, newStatus: string): void {
    const processList = this.monitoringFile?.ConfigFile?.pm2Processes || 
                       this.monitoringFile?.pm2Processes;
    
    if (!processList) {
      console.error(`❌ Cannot update status: no process list found`);
      return;
    }

    for (const p of processList) {
      if (p.Model.id.get() === id) {
        p.Model.status.set(newStatus);
        console.log(`💾 Updated status for ${id} to ${newStatus}`);
        return;
      }
    }
    
    console.warn(`⚠️ Process with id ${id} not found for status update`);
  }
}