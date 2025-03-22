# WireGuard API Client

[![npm version](https://img.shields.io/npm/v/wg-easy-api.svg)](https://www.npmjs.com/package/wg-easy-api)
[![GitHub license](https://img.shields.io/github/license/fluxnetru/wg-easy-api.svg)](https://github.com/fluxnetru/wg-easy-api/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/fluxnetru/wg-easy-api.svg)](https://github.com/fluxnetru/wg-easy-api/issues)
[![Downloads](https://img.shields.io/npm/dt/wg-easy-api.svg)](https://www.npmjs.com/package/wg-easy-api)

Русский | [English](https://github.com/fluxnetru/wg-easy-api/blob/main/README.md)

Библиотека Node.js для взаимодействия с API WireGuard, разработанная для легкой интеграции с серверами wg-easy.

## О проекте

Эта библиотека предоставляет удобный способ взаимодействия с API WireGuard, предоставляемым [WG-Easy](https://github.com/wg-easy/wg-easy), простым и удобным инструментом управления VPN WireGuard. WG-Easy упрощает настройку и управление VPN-серверами WireGuard, а данный клиент API позволяет разработчикам программно управлять его функциями, такими как управление клиентами, сессиями и конфигурациями.

## Установка

Установите через npm:

<code>npm install wg-easy-api</code>

## Требования

- Node.js >= 12.x
- <code>node-fetch</code> (автоматически устанавливается как зависимость)

## Использование

### С <code>node-fetch</code> (по умолчанию)

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
        console.log('Клиенты:', JSON.stringify(clients, null, 2));
    } catch (error) {
        console.error('Ошибка:', JSON.parse(error.message));
    }
}

example();
```

### С <code>axios</code>

Для использования с <code>axios</code> необходимо изменить метод <code>call</code>. Вот пример:

```js
const axios = require('axios');
const WireGuardAPI = require('wg-easy-api'); // commonjs
// import WireGuardAPI from 'wg-easy-api'; // module

// Переопределяем метод call
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
    console.log('Клиенты:', JSON.stringify(clients, null, 2));
}

example();
```

## Методы API

Все методы возвращают Promise, разрешающийся в объект с <code>{ status, data|error, [statusCode], [details] }</code>.

- <code>getClients()</code>: Получает список клиентов WireGuard.
- <code>createClient({ name })</code>: Создает нового клиента с указанным именем.
- <code>deleteClient({ clientId })</code>: Удаляет клиента по ID.
- <code>enableClient({ clientId })</code>: Включает клиента.
- <code>disableClient({ clientId })</code>: Отключает клиента.
- <code>updateClientName({ clientId, name })</code>: Обновляет имя клиента.
- <code>updateClientAddress({ clientId, address })</code>: Обновляет адрес клиента.
- <code>restoreConfiguration(file)</code>: Восстанавливает конфигурацию WireGuard.
- <code>getSession()</code>: Получает информацию о текущей сессии.
- <code>createSession({ password })</code>: Создает новую сессию.
- <code>deleteSession()</code>: Удаляет текущую сессию.
- <code>getRelease()</code>: Получает информацию о релизе.
- <code>getLang()</code>: Получает язык интерфейса.
- <code>getUITrafficStats()</code>: Получает статистику трафика UI.
- <code>getChartType()</code>: Получает тип графика UI.

## Обработка ошибок

Ошибки возвращаются в структурированном формате:

```json
{
    "status": "error",
    "error": "Внутренняя ошибка сервера",
    "statusCode": 500,
    "details": { /* дополнительная информация об ошибке */ },
    "url": "http://example.com:58121/api/wireguard/client",
    "method": "GET"
}
```

## Как внести вклад

Приглашаем отправлять вопросы или запросы на включение изменений через [GitHub](https://github.com/fluxnetru/wg-easy-api).

## Лицензия

MIT © [fluxnetru](https://github.com/fluxnetru)