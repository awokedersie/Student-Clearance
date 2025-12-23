const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
};

async function setupDatabase() {
    const client = new Client({
        ...dbConfig,
        database: 'postgres' // Connect to default database first
    });

    try {
        await client.connect();
        console.log('✅ Connected to Postgres default database');

        // Check if clearance database exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'clearance'");
        if (res.rowCount === 0) {
            console.log('Creating database clearance...');
            await client.query('CREATE DATABASE clearance');
            console.log('✅ Database clearance created');
        } else {
            console.log('ℹ️ Database clearance already exists');
        }
        await client.end();

        // Connect to clearance database
        const clearanceClient = new Client({
            ...dbConfig,
            database: 'clearance'
        });

        await clearanceClient.connect();
        console.log('✅ Connected to clearance database');

        // Read schema file
        const schemaPath = path.join(__dirname, 'schema_pg.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        console.log('Executing schema...');
        await clearanceClient.query(schema);
        console.log('✅ Schema executed successfully');

        // Sync with node-pg-migrate
        console.log('Syncing migration state...');
        await clearanceClient.query(`
            CREATE TABLE IF NOT EXISTS pgmigrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                run_on TIMESTAMP NOT NULL
            );
        `);

        // Check if migration exists
        const migrationName = '1766323846787_initial-schema';
        const migRes = await clearanceClient.query('SELECT 1 FROM pgmigrations WHERE name = $1', [migrationName]);

        if (migRes.rowCount === 0) {
            await clearanceClient.query('INSERT INTO pgmigrations (name, run_on) VALUES ($1, NOW())', [migrationName]);
            console.log('✅ Initial migration marked as executed');
        } else {
            console.log('ℹ️ Initial migration already marked');
        }

        await clearanceClient.end();

    } catch (err) {
        if (err.code === '28P01') {
            console.error('\n❌ AUTHENTICATION ERROR: The password for user "postgres" is incorrect.');
            console.error('👉 Please open the .env file and update DB_PASSWORD with your actual PostgreSQL password.');
            console.error('   (The default is often "admin", "root", or the one you set during installation)\n');
        } else {
            console.error('❌ Error setting up database:', err);
        }
    }
}

setupDatabase();
