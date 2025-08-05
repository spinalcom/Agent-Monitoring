declare class LoadConfigFiles {
    private static instance;
    private constructor();
    static getInstance(): LoadConfigFiles;
    initFiles(): Promise<any>;
    _loadConfigFiles(connect: spinal.FileSystem, fileName: string): Promise<any>;
}
declare const _default: LoadConfigFiles;
export default _default;
