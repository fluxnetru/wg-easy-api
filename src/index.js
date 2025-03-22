import fetch from 'node-fetch';

/**
 * Класс для работы с WireGuard API / Class for interacting with WireGuard API
 * @class
 */
class WireGuardAPI {
    /**
     * Создает экземпляр WireGuardAPI / Creates an instance of WireGuardAPI
     * @param {string} baseUrl - Базовый URL API (например, 'http://94.228.161.40:44958') / Base API URL (e.g., 'http://94.228.161.40:44958')
     * @param {string} cookies - Cookies для авторизации (например, 'connect.sid=...') / Cookies for authentication (e.g., 'connect.sid=...')
     * @throws {Error} Если baseUrl или cookies не указаны / If baseUrl or cookies are not provided
     */
    constructor(baseUrl, cookies) {
        if (!baseUrl || !cookies) {
            throw new Error('Base URL and cookies are required');
        }
        this.baseUrl = baseUrl;
        this.cookies = cookies;
    }

    /**
     * Выполняет HTTP-запрос к API / Performs an HTTP request to the API
     * @private
     * @param {Object} options - Опции запроса / Request options
     * @param {string} options.method - HTTP метод (GET, POST и т.д.) / HTTP method (GET, POST, etc.)
     * @param {string} options.path - Путь API (например, '/wireguard/client') / API path (e.g., '/wireguard/client')
     * @param {Object} [options.body] - Тело запроса / Request body
     * @returns {Promise<Object>} Ответ в формате { status: 'success'|'error', data|error, [statusCode], [details] } / Response in format { status: 'success'|'error', data|error, [statusCode], [details] }
     * @throws {Error} При сетевых ошибках или некорректном JSON / On network errors or invalid JSON
     */
    async call({ method, path, body }) {
        const url = `${this.baseUrl}/api${path}`;
        const headers = {
            'Content-Type': 'application/json',
            'Cookie': this.cookies
        };

        try {
            const res = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            if (res.status === 204) {
                return { status: 'success', data: null };
            }

            const text = await res.text();
            let json;
            try {
                json = JSON.parse(text);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${text}`);
            }

            if (!res.ok) {
                return {
                    status: 'error',
                    error: json.error || res.statusText,
                    statusCode: res.status,
                    details: json
                };
            }

            return { status: 'success', data: json };
        } catch (error) {
            throw new Error(JSON.stringify({
                status: 'error',
                error: error.message,
                url,
                method
            }));
        }
    }

    /**
     * Получает информацию о релизе / Gets release information
     * @returns {Promise<Object>} Ответ API / API response
     */
    async getRelease() {
        return this.call({ method: 'GET', path: '/release' });
    }

    /**
     * Получает язык интерфейса / Gets UI language
     * @returns {Promise<Object>} Ответ API / API response
     */
    async getLang() {
        return this.call({ method: 'GET', path: '/lang' });
    }

    /**
     * Получает статистику трафика UI / Gets UI traffic statistics
     * @returns {Promise<Object>} Ответ API / API response
     */
    async getUITrafficStats() {
        return this.call({ method: 'GET', path: '/ui-traffic-stats' });
    }

    /**
     * Получает тип графика UI / Gets UI chart type
     * @returns {Promise<Object>} Ответ API / API response
     */
    async getChartType() {
        return this.call({ method: 'GET', path: '/ui-chart-type' });
    }

    /**
     * Получает текущую сессию / Gets current session
     * @returns {Promise<Object>} Ответ API / API response
     */
    async getSession() {
        return this.call({ method: 'GET', path: '/session' });
    }

    /**
     * Создает новую сессию / Creates a new session
     * @param {Object} params - Параметры / Parameters
     * @param {string} params.password - Пароль для сессии / Password for the session
     * @returns {Promise<Object>} Ответ API / API response
     */
    async createSession({ password }) {
        return this.call({ method: 'POST', path: '/session', body: { password } });
    }

    /**
     * Удаляет текущую сессию / Deletes the current session
     * @returns {Promise<Object>} Ответ API / API response
     */
    async deleteSession() {
        return this.call({ method: 'DELETE', path: '/session' });
    }

    /**
     * Получает список WireGuard клиентов / Gets a list of WireGuard clients
     * @returns {Promise<Object>} Ответ API с преобразованными датами / API response with transformed dates
     */
    async getClients() {
        return this.call({ method: 'GET', path: '/wireguard/client' }).then((response) => ({
            ...response,
            data: response.data.map((client) => ({
                ...client,
                createdAt: new Date(client.createdAt),
                updatedAt: new Date(client.updatedAt),
                latestHandshakeAt: client.latestHandshakeAt !== null ? new Date(client.latestHandshakeAt) : null,
            }))
        }));
    }

    /**
     * Создает нового WireGuard клиента / Creates a new WireGuard client
     * @param {Object} params - Параметры / Parameters
     * @param {string} params.name - Имя клиента / Client name
     * @returns {Promise<Object>} Ответ API / API response
     */
    async createClient({ name }) {
        return this.call({ method: 'POST', path: '/wireguard/client', body: { name } });
    }

    /**
     * Удаляет WireGuard клиента / Deletes a WireGuard client
     * @param {Object} params - Параметры / Parameters
     * @param {string} params.clientId - ID клиента / Client ID
     * @returns {Promise<Object>} Ответ API / API response
     */
    async deleteClient({ clientId }) {
        return this.call({ method: 'DELETE', path: `/wireguard/client/${clientId}` });
    }

    /**
     * Включает WireGuard клиента / Enables a WireGuard client
     * @param {Object} params - Параметры / Parameters
     * @param {string} params.clientId - ID клиента / Client ID
     * @returns {Promise<Object>} Ответ API / API response
     */
    async enableClient({ clientId }) {
        return this.call({ method: 'POST', path: `/wireguard/client/${clientId}/enable` });
    }

    /**
     * Отключает WireGuard клиента / Disables a WireGuard client
     * @param {Object} params - Параметры / Parameters
     * @param {string} params.clientId - ID клиента / Client ID
     * @returns {Promise<Object>} Ответ API / API response
     */
    async disableClient({ clientId }) {
        return this.call({ method: 'POST', path: `/wireguard/client/${clientId}/disable` });
    }

    /**
     * Обновляет имя WireGuard клиента / Updates a WireGuard client's name
     * @param {Object} params - Параметры / Parameters
     * @param {string} params.clientId - ID клиента / Client ID
     * @param {string} params.name - Новое имя / New name
     * @returns {Promise<Object>} Ответ API / API response
     */
    async updateClientName({ clientId, name }) {
        return this.call({ method: 'PUT', path: `/wireguard/client/${clientId}/name`, body: { name } });
    }

    /**
     * Обновляет адрес WireGuard клиента / Updates a WireGuard client's address
     * @param {Object} params - Параметры / Parameters
     * @param {string} params.clientId - ID клиента / Client ID
     * @param {string} params.address - Новый адрес / New address
     * @returns {Promise<Object>} Ответ API / API response
     */
    async updateClientAddress({ clientId, address }) {
        return this.call({ method: 'PUT', path: `/wireguard/client/${clientId}/address`, body: { address } });
    }

    /**
     * Восстанавливает конфигурацию WireGuard / Restores WireGuard configuration
     * @param {string} file - Содержимое файла конфигурации / Configuration file content
     * @returns {Promise<Object>} Ответ API / API response
     */
    async restoreConfiguration(file) {
        return this.call({ method: 'PUT', path: '/wireguard/restore', body: { file } });
    }
}

export default WireGuardAPI;