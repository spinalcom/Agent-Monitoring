declare const config: {
    spinalConnector: {
        protocol: string | undefined;
        user: string | undefined;
        password: string | undefined;
        host: string | undefined;
        port: string | undefined;
    };
    monitoringApiConfig: {
        TokenBosRegister: string | undefined;
        monitoring_url: string | undefined;
        monitoring_helath_url: string | undefined;
        organName: string | undefined;
        email: string | undefined;
        password: string | undefined;
        grant_type: string | undefined;
    };
};
export default config;
export declare function getConfig(): {
    monitoringPath: string;
    updateInterval: number;
    cpuAlertThreshold: number;
};
