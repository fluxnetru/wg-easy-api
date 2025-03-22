import fetch from 'node-fetch';

class WireGuardAPI {
    constructor(baseUrl, cookies) {
        if (!baseUrl || !cookies) {
            throw new Error('Base URL and cookies are required');
        }
        this.baseUrl = baseUrl;
        this.cookies = cookies;
    }

    async call({
        method,
        path,
        body
    }) {
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
                return {
                    status: 'success',
                    data: null
                };
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

            return {
                status: 'success',
                data: json
            };
        } catch (error) {
            throw new Error(JSON.stringify({
                status: 'error',
                error: error.message,
                url: url,
                method: method
            }));
        }
    }

    async getRelease() {
        return this.call({
            method: 'GET',
            path: '/release'
        });
    }

    async getLang() {
        return this.call({
            method: 'GET',
            path: '/lang'
        });
    }

    async getUITrafficStats() {
        return this.call({
            method: 'GET',
            path: '/ui-traffic-stats'
        });
    }

    async getChartType() {
        return this.call({
            method: 'GET',
            path: '/ui-chart-type'
        });
    }

    async getSession() {
        return this.call({
            method: 'GET',
            path: '/session'
        });
    }

    async createSession({
        password
    }) {
        return this.call({
            method: 'POST',
            path: '/session',
            body: {
                password
            }
        });
    }

    async deleteSession() {
        return this.call({
            method: 'DELETE',
            path: '/session'
        });
    }

    async getClients() {
        return this.call({
            method: 'GET',
            path: '/wireguard/client'
        }).then((response) => ({
            ...response,
            data: response.data.map((client) => ({
                ...client,
                createdAt: new Date(client.createdAt),
                updatedAt: new Date(client.updatedAt),
                latestHandshakeAt: client.latestHandshakeAt !== null ?
                    new Date(client.latestHandshakeAt) :
                    null,
            }))
        }));
    }

    async createClient({
        name
    }) {
        return this.call({
            method: 'POST',
            path: '/wireguard/client',
            body: {
                name
            }
        });
    }

    async deleteClient({
        clientId
    }) {
        return this.call({
            method: 'DELETE',
            path: `/wireguard/client/${clientId}`
        });
    }

    async enableClient({
        clientId
    }) {
        return this.call({
            method: 'POST',
            path: `/wireguard/client/${clientId}/enable`
        });
    }

    async disableClient({
        clientId
    }) {
        return this.call({
            method: 'POST',
            path: `/wireguard/client/${clientId}/disable`
        });
    }

    async updateClientName({
        clientId,
        name
    }) {
        return this.call({
            method: 'PUT',
            path: `/wireguard/client/${clientId}/name`,
            body: {
                name
            }
        });
    }

    async updateClientAddress({
        clientId,
        address
    }) {
        return this.call({
            method: 'PUT',
            path: `/wireguard/client/${clientId}/address`,
            body: {
                address
            }
        });
    }

    async restoreConfiguration(file) {
        return this.call({
            method: 'PUT',
            path: '/wireguard/restore',
            body: {
                file
            }
        });
    }
}

export default WireGuardAPI;