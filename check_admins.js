const { Client } = require('pg');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'clearance',
    port: process.env.DB_PORT || 5432,
};

async function checkAdmins() {
    const client = new Client(dbConfig);
    try {
        await client.connect();
        const res = await client.query('SELECT username, role, name FROM admin');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkAdmins().catch(console.error);
