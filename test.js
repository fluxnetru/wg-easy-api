import WireGuardAPI from './src/index.js';

async function example() {
    const api = new WireGuardAPI('http', '127.0.0.1', 51821);
    try {
        const auth = await api.initSession({ password: 'my-super-secret-password' });
        console.log(auth);
        const clients = await api.getClients();
        console.log('Clients:', JSON.stringify(clients, null, 2));
    } catch (error) {
        console.error('Error:', JSON.parse(error.message));
    }
}

example();