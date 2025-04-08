import fetch from 'node-fetch';

/**
 * Class for interacting with the WireGuard API.
 * Класс для работы с WireGuard API.
 * @class
 */
class WireGuardAPI {
    /**
     * Creates an instance of WireGuardAPI. This is the starting point for all interactions with the WG-Easy server.
     * It validates the protocol, IP, and port to ensure a correct base URL is formed, avoiding bugs from malformed inputs.
     * Создает экземпляр WireGuardAPI. Это отправная точка для всех взаимодействий с сервером WG-Easy.
     * Проверяет протокол, IP и порт, чтобы сформировать корректный базовый URL и избежать ошибок из-за некорректных входных данных.
     * @constructor
     * @param {string} protocol - The protocol to use ('http' or 'https'). Only these two are allowed to keep it strict. | Протокол для использования ('http' или 'https'). Допускаются только эти два для строгого контроля.
     * @param {string} ip - The IP address of the server (e.g., 'example.com'). Must be a valid IPv4 address or domain. | IP-адрес сервера (например, 'example.com'). Должен быть действительным IPv4-адресом или доменом.
     * @param {number} port - The port number (e.g., 51821). Must be a number between 1 and 65535. | Номер порта (например, 51821). Должен быть числом от 1 до 65535.
     * @param {string} [password] - Optional password for automatic authentication. If provided, used for session retries on 401 errors. | Необязательный пароль для автоматической аутентификации. Если указан, используется для повторных попыток сессии при ошибках 401.
     * @param {string} [cookies] - Optional pre-existing cookies (e.g., 'connect.sid=...'). If provided, skips password-based auth. | Необязательные существующие куки (например, 'connect.sid=...'). Если указаны, пропускается аутентификация по паролю.
     * @throws {Error} If protocol isn't 'http' or 'https', IP is invalid, or port is out of range. | Если протокол не 'http' или 'https', IP некорректен, или порт вне диапазона.
     * @example
     * const api = new WireGuardAPI('https', 'example.com', 51821, 'myPass');
     * // Creates an instance ready to talk to that server | Создает экземпляр, готовый к взаимодействию с этим сервером
     */
    constructor(protocol, ip, port, password, cookies) {
        if (!['http', 'https'].includes(protocol)) {
            throw new Error('Protocol must be "http" or "https" | Протокол должен быть "http" или "https"');
        }
        const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
        const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
        if (!ip || (!ipRegex.test(ip) && !domainRegex.test(ip))) {
            throw new Error('Invalid IP address | Некорректный IP-адрес');
        }
        if (!port || isNaN(port) || port < 1 || port > 65535) {
            throw new Error('Port must be a number between 1 and 65535 | Порт должен быть числом от 1 до 65535');
        }

        this.baseUrl = `${protocol}://${ip}:${port}`; // Forms the base URL, e.g., 'http://example.com:51821'
        this.password = password; // Stores password for auto-auth retries
        this.cookies = cookies || ''; // Stores cookies, defaults to empty string if none provided
        this.authRetryCount = 0; // Tracks retry attempts for 401 errors
        this.maxAuthRetries = 3; // Limits retries to 3 to avoid infinite loops
    }

    /**
     * Performs an HTTP request to the API. This is the core method that all other methods use to talk to the server.
     * It handles sending requests, parsing responses, updating cookies, and retrying on authentication failures.
     * Выполняет HTTP-запрос к API. Это основной метод, который используют все другие методы для общения с сервером.
     * @private
     * @param {Object} options - Options for the request | Опции для запроса
     * @param {string} options.method - HTTP method like 'GET', 'POST', 'PUT', 'DELETE'. | HTTP-метод, например 'GET', 'POST', 'PUT', 'DELETE'.
     * @param {string} options.path - API endpoint path (e.g., '/wireguard/client'). Gets appended to baseUrl/api. | Путь к конечной точке API (например, '/wireguard/client'). Добавляется к baseUrl/api.
     * @param {Object} [options.body] - Optional request body, gets JSON-stringified (e.g., { password: 'myPass' }). | Необязательное тело запроса, преобразуется в JSON (например, { password: 'myPass' }).
     * @returns {Promise<Object>} A promise resolving to an object with:
     *   - status: 'success' or 'error' | Статус: 'success' или 'error'
     *   - data: response payload on success (e.g., client list, config text) | Данные: полезная нагрузка ответа при успехе (например, список клиентов, текст конфигурации)
     *   - error: error message on failure (e.g., 'Unauthorized') | Ошибка: сообщение об ошибке при неудаче (например, 'Unauthorized')
     *   - statusCode: HTTP status on error (e.g., 401, 500) | Код статуса HTTP при ошибке (например, 401, 500)
     *   - details: extra error info from server (e.g., { statusCode: 500, stack: [] }) | Детали: дополнительная информация об ошибке от сервера
     * @throws {Error} On network errors, invalid JSON, or unhandled fetch failures | При сетевых ошибках, некорректном JSON или необработанных сбоях fetch
     * @example
     * await this.call({ method: 'GET', path: '/wireguard/client' })
     * // Returns { status: 'success', data: [{ id: 'abc', name: 'Client1' }] }
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
                body: body ? JSON.stringify(body) : undefined
            });

            const setCookie = res.headers.get('set-cookie');
            if (setCookie) {
                this.cookies = setCookie;
            }

            if (res.status === 204) return { status: 'success', data: null };

            const text = await res.text();
            let json;
            try {
                json = text ? JSON.parse(text) : {};
            } catch {
                throw new Error(`Invalid JSON: ${text} | Некорректный JSON: ${text}`);
            }

            if (!res.ok) {
                if (res.status === 401 && this.password && this.authRetryCount < this.maxAuthRetries) {
                    this.authRetryCount++;
                    await this.initSession({ password: this.password });
                    return this.call({ method, path, body });
                }
                return {
                    status: 'error',
                    error: json.error || res.statusText,
                    statusCode: res.status,
                    details: json
                };
            }

            this.authRetryCount = 0;
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
     * Initializes a session with a password and updates cookies. This is how you log in to the WG-Easy server.
     * Инициализирует сессию с паролем и обновляет куки. Это способ входа на сервер WG-Easy.
     * @param {Object} params - Parameters for the request | Параметры для запроса
     * @param {string} params.password - The password for WG-Easy (required). Must match the server's WG_PASSWORD. | Пароль для WG-Easy (обязателен). Должен совпадать с WG_PASSWORD сервера.
     * @returns {Promise<Object>} Same as call() return: { status, data|error, [statusCode], [details] } | Такой же результат, как у call()
     * @example
     * await api.initSession({ password: 'myPass' })
     * // Returns { status: 'success', data: { success: true } }
     */
    async initSession({ password }) {
        return this.call({ method: 'POST', path: '/session', body: { password } });
    }

    /**
     * Gets the WG-Easy release version. Useful for checking what version the server is running.
     * Получает версию выпуска WG-Easy. Полезно для проверки, какая версия работает на сервере.
     * @returns {Promise<Object>} { status: 'success', data: { version: string } } or error | Результат или ошибка
     * @example
     * await api.getRelease()
     * // Returns { status: 'success', data: { version: '7' } }
     */
    async getRelease() { return this.call({ method: 'GET', path: '/release' }); }

    /**
     * Gets the UI language setting from WG-Easy. Tells you what language the server is configured to use.
     * Получает настройку языка интерфейса WG-Easy.
     * @returns {Promise<Object>} { status: 'success', data: { lang: string } } or error | Результат или ошибка
     * @example
     * await api.getLang()
     * // Returns { status: 'success', data: { lang: 'en' } }
     */
    async getLang() { return this.call({ method: 'GET', path: '/lang' }); }

    /**
     * Gets traffic statistics for the WG-Easy UI. Shows bytes sent/received for monitoring.
     * Получает статистику трафика для интерфейса WG-Easy.
     * @returns {Promise<Object>} { status: 'success', data: { bytesSent: number, bytesReceived: number } } or error | Результат или ошибка
     * @example
     * await api.getUITrafficStats()
     * // Returns { status: 'success', data: { bytesSent: 12345, bytesReceived: 67890 } }
     */
    async getUITrafficStats() { return this.call({ method: 'GET', path: '/ui-traffic-stats' }); }

    /**
     * Gets the chart type used in the WG-Easy UI. Tells you how traffic stats are displayed.
     * Получает тип графика, используемый в интерфейсе WG-Easy.
     * @returns {Promise<Object>} { status: 'success', data: { type: string } } or error | Результат или ошибка
     * @example
     * await api.getChartType()
     * // Returns { status: 'success', data: { type: 'line' } }
     */
    async getChartType() { return this.call({ method: 'GET', path: '/ui-chart-type' }); }

    /**
     * Gets current session info. Checks if you're still logged in and what the server knows about your session.
     * Получает информацию о текущей сессии.
     * @returns {Promise<Object>} { status: 'success', data: { authenticated: boolean } } or error | Результат или ошибка
     * @example
     * await api.getSession()
     * // Returns { status: 'success', data: { authenticated: true } }
     */
    async getSession() { return this.call({ method: 'GET', path: '/session' }); }

    /**
     * Creates a new session. Similar to initSession, but doesn't auto-update cookies (for manual control).
     * Создает новую сессию.
     * @param {Object} params - Parameters | Параметры
     * @param {string} params.password - The password | Пароль
     * @returns {Promise<Object>} Same as initSession | Такой же результат, как у initSession
     * @example
     * await api.createSession({ password: 'myPass' })
     * // Returns { status: 'success', data: { success: true } }
     */
    async createSession({ password }) { return this.call({ method: 'POST', path: '/session', body: { password } }); }

    /**
     * Deletes the current session (logs out). Makes the current cookies invalid on the server.
     * Удаляет текущую сессию (выход).
     * @returns {Promise<Object>} { status: 'success', data: null } or error | Результат или ошибка
     * @example
     * await api.deleteSession()
     * // Returns { status: 'success', data: null }
     */
    async deleteSession() { return this.call({ method: 'DELETE', path: '/session' }); }

    /**
     * Gets a list of all WireGuard clients. This is the main way to see who's connected to your VPN.
     * Получает список всех клиентов WireGuard.
     * @returns {Promise<Object>} { status: 'success', data: Client[] } or error | Результат или ошибка
     * @typedef {Object} Client
     * @property {string} id - Client ID (e.g., 'f2t3bdbh-b340-4e7d-62f7-651a0122bc62')
     * @property {string} name - Client name (e.g., 'MyPhone')
     * @property {string} address - Client IP (e.g., '10.0.0.2')
     * @property {Date} createdAt - Creation date
     * @property {Date} updatedAt - Last update date
     * @property {Date|null} latestHandshakeAt - Last handshake date or null
     * @example
     * await api.getClients()
     * // Returns { status: 'success', data: [{ id: 'abc', name: 'Client1', createdAt: Date, ... }] }
     */
    async getClients() {
        return this.call({ method: 'GET', path: '/wireguard/client' }).then((response) => ({
            ...response,
            data: response.data?.map((client) => ({
                ...client,
                createdAt: new Date(client.createdAt),
                updatedAt: new Date(client.updatedAt),
                latestHandshakeAt: client.latestHandshakeAt !== null ? new Date(client.latestHandshakeAt) : null,
            })) || []
        }));
    }

    /**
     * Creates a new WireGuard client. Adds a new VPN user with the given name.
     * Создает нового клиента WireGuard.
     * @param {Object} params - Parameters | Параметры
     * @param {string} params.name - The name for the new client (e.g., 'MyLaptop') | Имя нового клиента
     * @returns {Promise<Object>} { status: 'success', data: object } with new client details or error | Результат или ошибка
     * @example
     * await api.createClient({ name: 'MyLaptop' })
     * // Returns { status: 'success', data: { id: 'xyz', name: 'MyLaptop', ... } }
     */
    async createClient({ name }) { return this.call({ method: 'POST', path: '/wireguard/client', body: { name } }); }

    /**
     * Deletes a client by ID. Removes a VPN user from the server.
     * Удаляет клиента по ID.
     * @param {Object} params - Parameters | Параметры
     * @param {string} params.clientId - The client’s unique ID | Уникальный ID клиента
     * @returns {Promise<Object>} { status: 'success', data: null } or error | Результат или ошибка
     * @example
     * await api.deleteClient({ clientId: 'f2t3bdbh-b340-4e7d-62f7-651a0122bc62' })
     * // Returns { status: 'success', data: null }
     */
    async deleteClient({ clientId }) { return this.call({ method: 'DELETE', path: `/wireguard/client/${clientId}` }); }

    /**
     * Enables a client. Allows it to connect to the VPN.
     * Включает клиента.
     * @param {Object} params - Parameters | Параметры
     * @param {string} params.clientId - The client’s unique ID | Уникальный ID клиента
     * @returns {Promise<Object>} { status: 'success', data: null } or error | Результат или ошибка
     * @example
     * await api.enableClient({ clientId: 'f2t3bdbh-b340-4e7d-62f7-651a0122bc62' })
     * // Returns { status: 'success', data: null }
     */
    async enableClient({ clientId }) { return this.call({ method: 'POST', path: `/wireguard/client/${clientId}/enable` }); }

    /**
     * Disables a client. Prevents it from connecting to the VPN.
     * Отключает клиента.
     * @param {Object} params - Parameters | Параметры
     * @param {string} params.clientId - The client’s unique ID | Уникальный ID клиента
     * @returns {Promise<Object>} { status: 'success', data: null } or error | Результат или ошибка
     * @example
     * await api.disableClient({ clientId: 'f2t3bdbh-b340-4e7d-62f7-651a0122bc62' })
     * // Returns { status: 'success', data: null }
     */
    async disableClient({ clientId }) { return this.call({ method: 'POST', path: `/wireguard/client/${clientId}/disable` }); }

    /**
     * Updates a client’s name. Changes how the client is labeled in WG-Easy.
     * Обновляет имя клиента.
     * @param {Object} params - Parameters | Параметры
     * @param {string} params.clientId - The client’s unique ID | Уникальный ID клиента
     * @param {string} params.name - New name | Новое имя
     * @returns {Promise<Object>} { status: 'success', data: null } or error | Результат или ошибка
     * @example
     * await api.updateClientName({ clientId: 'f2t3bdbh-b340-4e7d-62f7-651a0122bc62', name: 'NewName' })
     * // Returns { status: 'success', data: null }
     */
    async updateClientName({ clientId, name }) { return this.call({ method: 'PUT', path: `/wireguard/client/${clientId}/name`, body: { name } }); }

    /**
     * Updates a client’s IP address. Changes the VPN IP assigned to the client.
     * Обновляет IP-адрес клиента.
     * @param {Object} params - Parameters | Параметры
     * @param {string} params.clientId - The client’s unique ID | Уникальный ID клиента
     * @param {string} params.address - New IP address (e.g., '10.0.0.3') | Новый IP-адрес
     * @returns {Promise<Object>} { status: 'success', data: null } or error | Результат или ошибка
     * @example
     * await api.updateClientAddress({ clientId: 'f2t3bdbh-b340-4e7d-62f7-651a0122bc62', address: '10.0.0.3' })
     * // Returns { status: 'success', data: null }
     */
    async updateClientAddress({ clientId, address }) { return this.call({ method: 'PUT', path: `/wireguard/client/${clientId}/address`, body: { address } }); }

    /**
     * Restores a WireGuard configuration from a file. Overwrites the current server config with the provided one.
     * Восстанавливает конфигурацию WireGuard из файла.
     * @param {string} file - The full configuration file content as a string (e.g., '[Interface]\nPrivateKey=...') | Полное содержимое файла конфигурации в виде строки
     * @returns {Promise<Object>} { status: 'success', data: null } or error | Результат или ошибка
     * @example
     * await api.restoreConfiguration('[Interface]\nPrivateKey=...')
     * // Returns { status: 'success', data: null }
     */
    async restoreConfiguration(file) { return this.call({ method: 'PUT', path: '/wireguard/restore', body: { file } }); }

    /**
     * Gets a client’s WireGuard configuration as text. This is the .conf file you’d use in a WireGuard app.
     * Получает конфигурацию клиента WireGuard в виде текста.
     * @param {Object} params - Parameters | Параметры
     * @param {string} params.clientId - The client’s unique ID | Уникальный ID клиента
     * @returns {Promise<Object>} { status: 'success', data: string } (config text) or error | Результат или ошибка
     * @example
     * await api.getClientConfig({ clientId: 'f2t3bdbh-b340-4e7d-62f7-651a0122bc62' })
     * // Returns { status: 'success', data: '[Interface]\nPrivateKey=...\n...' }
     */
    async getClientConfig({ clientId }) {
        return this.call({ method: 'GET', path: `/wireguard/client/${clientId}/configuration` });
    }

    /**
     * Gets a client’s configuration as an SVG QR code. Useful for scanning into mobile WireGuard apps.
     * Получает конфигурацию клиента в виде SVG QR-кода.
     * @param {Object} params - Parameters | Параметры
     * @param {string} params.clientId - The client’s unique ID | Уникальный ID клиента
     * @returns {Promise<Object>} { status: 'success', data: string } (SVG content) or error | Результат или ошибка
     * @example
     * await api.getClientQRCode({ clientId: 'f2t3bdbh-b340-4e7d-62f7-651a0122bc62' })
     * // Returns { status: 'success', data: '<svg>...</svg>' }
     */
    async getClientQRCode({ clientId }) {
        return this.call({ method: 'GET', path: `/wireguard/client/${clientId}/qrcode.svg` });
    }
}

export default WireGuardAPI;