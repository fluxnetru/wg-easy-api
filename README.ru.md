# WireGuard API Клиент

[![npm version](https://img.shields.io/npm/v/wg-easy-api.svg)](https://www.npmjs.com/package/wg-easy-api)
[![GitHub license](https://img.shields.io/github/license/fluxnetru/wg-easy-api.svg)](https://github.com/fluxnetru/wg-easy-api/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/fluxnetru/wg-easy-api.svg)](https://github.com/fluxnetru/wg-easy-api/issues)
[![Downloads](https://img.shields.io/npm/dt/wg-easy-api.svg)](https://www.npmjs.com/package/wg-easy-api)

Русский | [English](https://github.com/fluxnetru/wg-easy-api/blob/main/README.md)

Надежная библиотека клиента на Node.js для взаимодействия с API WireGuard, разработанная для серверов WG-Easy.

## Содержание

- [О проекте](#о-проекте)
- [Функции](#функции)
- [Установка](#установка)
- [Требования](#требования)
- [Использование](#использование)
- [Методы API](#методы-api)
- [Формат ответа](#формат-ответа)
- [Советы по отладке](#советы-по-отладке)
- [Вклад](#вклад)
- [Лицензия](#лицензия)
- [Список изменений](#список-изменений)

## О проекте

Эта библиотека предоставляет программный интерфейс для API WireGuard, реализованного в [WG-Easy](https://github.com/wg-easy/wg-easy).

## Функции

- Автоматическое управление сессиями с повторными попытками при ошибках 401.
- Полное покрытие конечных точек API WG-Easy.
- Гибкая аутентификация через пароль или куки.
- Структурированная обработка ошибок.
- Поддержка TypeScript.

## Установка

Установите через npm:

<code>npm install wg-easy-api</code>

## Требования

- Node.js 12.x или выше.
- <code>node-fetch</code> (^3.3.2) - Включено как зависимость.
- Запущенный сервер WG-Easy (обычно на порту 51821).

## Использование

Базовый пример с паролем:

<code>
const WireGuardAPI = require('wg-easy-api');

async function example() {
    const api = new WireGuardAPI('https', 'example.com', 51821, 'ваш-пароль');
    try {
        const auth = await api.initSession({ password: 'ваш-пароль' });
        const clients = await api.getClients();
        console.log('Клиенты:', JSON.stringify(clients, null, 2));
    } catch (error) {
        console.error('Ошибка:', JSON.parse(error.message));
    }
}

example();
</code>

Использование куки:

<code>
const api = new WireGuardAPI('https', 'example.com', 51821, undefined, 'connect.sid=s%3A...');
const clients = await api.getClients();
console.log(clients);
</code>

Обработка ошибок:

<code>
try {
    const clients = await api.getClients();
} catch (error) {
    const err = JSON.parse(error.message);
    console.error(err.error, err.statusCode);
}
</code>

## Методы API

Все методы возвращают <code>Promise</code>, разрешающийся в <code>{ status, data|error, [statusCode], [details] }</code>.

### Управление сессиями

- **<code>initSession({ password })</code>**  
  Вход на сервер WG-Easy с паролем. Автоматически обновляет куки.  
  - **Параметры**: <code>{ password: string }</code> - Пароль WG-Easy.  
  - **Возвращает**: <code>{ status: 'success', data: any }</code> или ошибка (например, 401 при неверном пароле).  
  - **Пример**:  
    <code>await api.initSession({ password: 'мойПароль' }); // { status: 'success', data: { success: true } }</code>

- **<code>getSession()</code>**  
  Проверяет статус текущей сессии.  
  - **Возвращает**: <code>{ status: 'success', data: { authenticated: boolean } }</code> или ошибка.  
  - **Пример**:  
    <code>await api.getSession(); // { status: 'success', data: { authenticated: true } }</code>

## Формат ответа

- **Успех**: <code>{ status: 'success', data: any }</code>
- **Ошибка**: <code>{ status: 'error', error: string, statusCode: number, details: any }</code>

## Советы по отладке

- Проверьте <code>protocol</code>, <code>ip</code>, <code>port</code> в конструкторе.
- Запишите <code>api.cookies</code> после <code>initSession</code>.
- Тестируйте с помощью <code>curl</code> для проверки ответов сервера.

## Вклад

Форкните и создайте пулл-реквест на [GitHub](https://github.com/fluxnetru/wg-easy-api).

## Лицензия

MIT © [fluxnetru](https://github.com/fluxnetru).