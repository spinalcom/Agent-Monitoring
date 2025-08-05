export declare class TokenManager {
    private monitoring_url_auth;
    private token;
    private expire_in;
    private obtained_time;
    constructor();
    isExpired(): boolean;
    getToken(): Promise<string>;
}
