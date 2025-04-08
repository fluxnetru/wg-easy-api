declare module 'wg-easy-api' {
    interface ApiResponse<T> {
        status: 'success' | 'error';
        data?: T;
        error?: string;
        statusCode?: number;
        details?: any;
    }

    interface Client {
        [key: string]: any;
        createdAt: Date;
        updatedAt: Date;
        latestHandshakeAt: Date | null;
    }

    class WireGuardAPI {
        constructor(baseUrl: string, password?: string, cookies?: string);

        call<T>(options: { method: string; path: string; body?: any }): Promise<ApiResponse<T>>;
        initSession(params: { password: string }): Promise<ApiResponse<string>>;
        getRelease(): Promise<ApiResponse<any>>;
        getLang(): Promise<ApiResponse<any>>;
        getUITrafficStats(): Promise<ApiResponse<any>>;
        getChartType(): Promise<ApiResponse<any>>;
        getSession(): Promise<ApiResponse<any>>;
        createSession(params: { password: string }): Promise<ApiResponse<any>>;
        deleteSession(): Promise<ApiResponse<any>>;
        getClients(): Promise<ApiResponse<Client[]>>;
        createClient(params: { name: string }): Promise<ApiResponse<any>>;
        deleteClient(params: { clientId: string }): Promise<ApiResponse<any>>;
        enableClient(params: { clientId: string }): Promise<ApiResponse<any>>;
        disableClient(params: { clientId: string }): Promise<ApiResponse<any>>;
        updateClientName(params: { clientId: string; name: string }): Promise<ApiResponse<any>>;
        updateClientAddress(params: { clientId: string; address: string }): Promise<ApiResponse<any>>;
        restoreConfiguration(file: string): Promise<ApiResponse<any>>;
        getClientConfig(params: { clientId: string }): Promise<ApiResponse<string>>;
        getClientQRCode(params: { clientId: string }): Promise<ApiResponse<string>>;
    }

    export default WireGuardAPI;
}