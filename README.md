# WireGuard API Client

[![npm version](https://img.shields.io/npm/v/wg-easy-api.svg)](https://www.npmjs.com/package/wg-easy-api)
[![GitHub license](https://img.shields.io/github/license/fluxnetru/wg-easy-api.svg)](https://github.com/fluxnetru/wg-easy-api/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/fluxnetru/wg-easy-api.svg)](https://github.com/fluxnetru/wg-easy-api/issues)
[![Downloads](https://img.shields.io/npm/dt/wg-easy-api.svg)](https://www.npmjs.com/package/wg-easy-api)

[Русский](https://github.com/fluxnetru/wg-easy-api/blob/main/README.ru.md) | English

Web-docs:
[Русский](https://fluxnetru.github.io/wg-easy-api/ru.html)
[English](https://fluxnetru.github.io/wg-easy-api/en.html)

A robust Node.js client library for interacting with the WireGuard API, designed for WG-Easy servers.

## Table of Contents

- [About](#about)
- [Features](#features)
- [Installation](#installation)
- [Requirements](#requirements)
- [Usage](#usage)
- [API Methods](#api-methods)
- [Response Format](#response-format)
- [Debugging Tips](#debugging-tips)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

## About

This library provides a programmatic interface to the WireGuard API as implemented by [WG-Easy](https://github.com/wg-easy/wg-easy).

## Features

- Automatic session management with retries on 401 errors.
- Full coverage of WG-Easy API endpoints.
- Flexible authentication via password or cookies.
- Structured error handling.
- TypeScript support.

## Installation

Install via npm:

<code>npm install wg-easy-api</code>

## Requirements

- Node.js 12.x or higher.
- `node-fetch` (^3.3.2) - Included as a dependency.
- A running WG-Easy server (typically on port 51821).

## Usage

Basic example with password:

```
const WireGuardAPI = require('wg-easy-api');

async function example() {
    const api = new WireGuardAPI('https', 'example.com', 51821, 'your-password');
    try {
        const auth = await api.initSession({ password: 'your-password' });
        const clients = await api.getClients();
        console.log('Clients:', JSON.stringify(clients, null, 2));
    } catch (error) {
        console.error('Error:', JSON.parse(error.message));
    }
}

example();
```

Using cookies:

```
const api = new WireGuardAPI('https', 'example.com', 51821, undefined, 'connect.sid=s%3A...');
const clients = await api.getClients();
console.log(clients);
```

Error handling:

```
try {
    const clients = await api.getClients();
} catch (error) {
    const err = JSON.parse(error.message);
    console.error(err.error, err.statusCode);
}
```

## API Methods

All methods return a `Promise` resolving to `{ status, data|error, [statusCode], [details] }`.

### Session Management

- **`initSession({ password })`**  
  Logs into the WG-Easy server with a password. Updates cookies automatically.  
  - **Params**: `{ password: string }` - WG-Easy password.  
  - **Returns**: `{ status: 'success', data: any }` or error (e.g., 401 for wrong password).  
  - **Example**:  
    <code>await api.initSession({ password: 'myPass' }); // { status: 'success', data: { success: true } }</code>

- **`getSession()`**  
  Checks current session status.  
  - **Returns**: `{ status: 'success', data: { authenticated: boolean } }` or error.  
  - **Example**:  
    <code>await api.getSession(); // { status: 'success', data: { authenticated: true } }</code>

- **`createSession({ password })`**  
  Creates a new session without auto-updating cookies.  
  - **Params**: `{ password: string }`.  
  - **Returns**: Same as `initSession`.  
  - **Example**:  
    <code>await api.createSession({ password: 'myPass' });</code>

- **`deleteSession()`**  
  Logs out by deleting the session.  
  - **Returns**: `{ status: 'success', data: null }` or error.  
  - **Example**:  
    <code>await api.deleteSession(); // { status: 'success', data: null }</code>

### Client Operations

- **`getClients()`**  
  Lists all WireGuard clients, converting timestamps to `Date` objects.  
  - **Returns**: `{ status: 'success', data: Client[] }` or error (e.g., 500 if server fails).  
  - **Example**:  
    <code>await api.getClients(); // { status: 'success', data: [{ id: 'abc', name: 'Client1' }] }</code>

- **`createClient({ name })`**  
  Adds a new client with the given name.  
  - **Params**: `{ name: string }`.  
  - **Returns**: `{ status: 'success', data: object }` or error.  
  - **Example**:  
    <code>await api.createClient({ name: 'MyLaptop' });</code>

- **`deleteClient({ clientId })`**  
  Removes a client by ID.  
  - **Params**: `{ clientId: string }`.  
  - **Returns**: `{ status: 'success', data: null }` or error.  
  - **Example**:  
    <code>await api.deleteClient({ clientId: 'abc' });</code>

- **`enableClient({ clientId })`**  
  Enables a client to connect.  
  - **Params**: `{ clientId: string }`.  
  - **Returns**: Same as above.  
  - **Example**:  
    <code>await api.enableClient({ clientId: 'abc' });</code>

- **`disableClient({ clientId })`**  
  Disables a client.  
  - **Params**: `{ clientId: string }`.  
  - **Returns**: Same as above.  
  - **Example**:  
    <code>await api.disableClient({ clientId: 'abc' });</code>

- **`updateClientName({ clientId, name })`**  
  Changes a client’s name.  
  - **Params**: `{ clientId: string, name: string }`.  
  - **Returns**: Same as above.  
  - **Example**:  
    <code>await api.updateClientName({ clientId: 'abc', name: 'NewName' });</code>

- **`updateClientAddress({ clientId, address })`**  
  Updates a client’s IP address.  
  - **Params**: `{ clientId: string, address: string }`.  
  - **Returns**: Same as above.  
  - **Example**:  
    <code>await api.updateClientAddress({ clientId: 'abc', address: '10.0.0.3' });</code>

### Configuration and QR Code

- **`getClientConfig({ clientId })`**  
  Gets a client’s `.conf` file as text.  
  - **Params**: `{ clientId: string }`.  
  - **Returns**: `{ status: 'success', data: string }` or error.  
  - **Example**:  
    <code>await api.getClientConfig({ clientId: 'abc' }); // { status: 'success', data: '[Interface]...' }</code>

- **`getClientQRCode({ clientId })`**  
  Gets a client’s config as an SVG QR code.  
  - **Params**: `{ clientId: string }`.  
  - **Returns**: `{ status: 'success', data: string }` or error.  
  - **Example**:  
    <code>await api.getClientQRCode({ clientId: 'abc' }); // { status: 'success', data: '<svg>...' }</code>

- **`restoreConfiguration(file)`**  
  Restores a server config from a string.  
  - **Params**: `file: string`.  
  - **Returns**: `{ status: 'success', data: null }` or error.  
  - **Example**:  
    <code>await api.restoreConfiguration('[Interface]...');</code>

### Miscellaneous

- **`getRelease()`**  
  Gets the WG-Easy version.  
  - **Returns**: `{ status: 'success', data: { version: string } }` or error.  
  - **Example**:  
    <code>await api.getRelease(); // { status: 'success', data: { version: '7' } }</code>

- **`getLang()`**  
  Gets the UI language.  
  - **Returns**: `{ status: 'success', data: { lang: string } }` or error.  
  - **Example**:  
    <code>await api.getLang(); // { status: 'success', data: { lang: 'en' } }</code>

- **`getUITrafficStats()`**  
  Gets traffic stats.  
  - **Returns**: `{ status: 'success', data: { bytesSent: number, bytesReceived: number } }` or error.  
  - **Example**:  
    <code>await api.getUITrafficStats(); // { status: 'success', data: { bytesSent: 12345 } }</code>

- **`getChartType()`**  
  Gets the UI chart type.  
  - **Returns**: `{ status: 'success', data: { type: string } }` or error.  
  - **Example**:  
    <code>await api.getChartType(); // { status: 'success', data: { type: 'line' } }</code>

## Response Format

- **Success**: `{ status: 'success', data: any }`
- **Error**: `{ status: 'error', error: string, statusCode: number, details: any }`

## Debugging Tips

- Check `protocol`, `ip`, `port` in constructor.
- Log `api.cookies` after `initSession`.
- Test with `curl` to verify server responses.

## Contributing

Fork and PR on [GitHub](https://github.com/fluxnetru/wg-easy-api).

## License

MIT © [fluxnetru](https://github.com/fluxnetru).