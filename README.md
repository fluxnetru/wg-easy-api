# WireGuard API Client

[![npm version](https://img.shields.io/npm/v/wg-easy-api.svg)](https://www.npmjs.com/package/wg-easy-api)
[![GitHub license](https://img.shields.io/github/license/fluxnetru/wg-easy-api.svg)](https://github.com/fluxnetru/wg-easy-api/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/fluxnetru/wg-easy-api.svg)](https://github.com/fluxnetru/wg-easy-api/issues)
[![Downloads](https://img.shields.io/npm/dt/wg-easy-api.svg)](https://www.npmjs.com/package/wg-easy-api)

[Русский](https://github.com/fluxnetru/wg-easy-api/blob/main/README.ru.md) | English

A Node.js client library for interacting with the WireGuard API, designed for easy integration with wg-easy servers.

## About

This library provides a convenient way to interact with the WireGuard API exposed by [WG-Easy](https://github.com/wg-easy/wg-easy), a simple and user-friendly WireGuard VPN management tool. WG-Easy simplifies the setup and management of WireGuard VPNs, and this API client allows developers to programmatically control its features, such as managing clients, sessions, and configurations.

## Installation

Install via npm:

<code>npm install wg-easy-api</code>

## Requirements

- Node.js >= 12.x
- <code>node-fetch</code> (automatically installed as a dependency)

## Usage

### With <code>node-fetch</code> (default)

```js
const WireGuardAPI = require('wg-easy-api'); // commonjs
// import WireGuardAPI from 'wg-easy-api'; // module

const api = new WireGuardAPI(
    'http://example.com:58121',
    'connect.sid=s%3Ald-A-H4OHXadNrjNx1kDDvWPX2yJGqTx...'
);

async function example() {
    try {
        const clients = await api.getClients();
        console.log('Clients:', JSON.stringify(clients, null, 2));
    } catch (error) {
        console.error('Error:', JSON.parse(error.message));
    }
}

example();
```

### With <code>axios</code>

To use with <code>axios</code>, you'll need to modify the <code>call</code> method. Here's an example:

```js
const axios = require('axios');
const WireGuardAPI = require('wg-easy-api'); // commonjs
// import WireGuardAPI from 'wg-easy-api'; // module

// Override the call method
WireGuardAPI.prototype.call = async function ({ method, path, body }) {
    const url = `${this.baseUrl}/api${path}`;
    try {
        const res = await axios({
            method,
            url,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': this.cookies
            },
            data: body
        });

        return { status: 'success', data: res.data };
    } catch (error) {
        return {
            status: 'error',
            error: error.response?.data?.error || error.message,
            statusCode: error.response?.status,
            details: error.response?.data
        };
    }
};

const api = new WireGuardAPI(
    'http://example.com:58121',
    'connect.sid=s%3Ald-A-H4OHXadNrjNx1kDDvWPX2yJGqTx...'
);

async function example() {
    const clients = await api.getClients();
    console.log('Clients:', JSON.stringify(clients, null, 2));
}

example();
```

## API Methods

All methods return a Promise resolving to an object with <code>{ status, data|error, [statusCode], [details] }</code>.

- <code>getClients()</code>: Retrieves a list of WireGuard clients.
- <code>createClient({ name })</code>: Creates a new client with the specified name.
- <code>deleteClient({ clientId })</code>: Deletes a client by ID.
- <code>enableClient({ clientId })</code>: Enables a client.
- <code>disableClient({ clientId })</code>: Disables a client.
- <code>updateClientName({ clientId, name })</code>: Updates a client's name.
- <code>updateClientAddress({ clientId, address })</code>: Updates a client's address.
- <code>restoreConfiguration(file)</code>: Restores a WireGuard configuration.
- <code>getSession()</code>: Gets current session info.
- <code>createSession({ password })</code>: Creates a new session.
- <code>deleteSession()</code>: Deletes the current session.
- <code>getRelease()</code>: Gets release information.
- <code>getLang()</code>: Gets UI language.
- <code>getUITrafficStats()</code>: Gets UI traffic statistics.
- <code>getChartType()</code>: Gets UI chart type.

## Error Handling

Errors are returned in a structured format:

```json
{
    "status": "error",
    "error": "Internal Server Error",
    "statusCode": 500,
    "details": { /* additional error info */ },
    "url": "http://example.com:58121/api/wireguard/client",
    "method": "GET"
}
```

## Contributing

Feel free to submit issues or pull requests at [GitHub](https://github.com/fluxnetru/wg-easy-api).

## License

MIT © [fluxnetru](https://github.com/fluxnetru)