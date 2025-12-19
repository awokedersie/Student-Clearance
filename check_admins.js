const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clearance'
};

async function checkAdmins() {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT username, role, name FROM admin');
    console.log(JSON.stringify(rows, null, 2));
    await connection.end();
}

checkAdmins().catch(console.error);
