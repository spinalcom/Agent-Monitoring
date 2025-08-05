declare module "diskusage" {
    interface DiskUsage {
        total: number;
        free: number;
        available: number;
    }

    function check(path: string, callback: (err: Error | null, info: DiskUsage) => void): void;
    function check(path: string): Promise<DiskUsage>;

    export = check;
}