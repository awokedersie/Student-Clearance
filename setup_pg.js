const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const isRemote = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';
const dbName = process.env.DB_NAME || 'clearance';

const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: isRemote ? { rejectUnauthorized: false } : false
};

async function setupDatabase() {
    console.log(`🔌 Connecting to ${dbConfig.host}...`);

    if (isRemote) {
        // Remote (Neon/Render): Connect directly to the provided database
        console.log(`🌍 Remote host detected. Connecting to ${dbName}...`);
        const client = new Client({
            ...dbConfig,
            database: dbName
        });

        try {
            await client.connect();
            console.log(`✅ Connected to ${dbName}`);
            await runSchema(client);
        } catch (err) {
            handleError(err);
        }
        return;
    }

    // Localhost: Check/Create database
    const client = new Client({
        ...dbConfig,
        database: 'postgres'
    });

    try {
        await client.connect();
        console.log('✅ Connected to Postgres defaults');

        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
        if (res.rowCount === 0) {
            console.log(`Creating database ${dbName}...`);
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`✅ Database ${dbName} created`);
        } else {
            console.log(`ℹ️  Database ${dbName} already exists`);
        }
        await client.end();

        // Connect to the target database
        const clearanceClient = new Client({
            ...dbConfig,
            database: dbName
        });

        await clearanceClient.connect();
        console.log(`✅ Connected to ${dbName}`);
        await runSchema(clearanceClient);

    } catch (err) {
        handleError(err);
    }
}

async function runSchema(client) {
    try {
        // Read schema file
        const schemaPath = path.join(__dirname, 'schema_pg.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        console.log('📜 Executing schema...');
        await client.query(schema);
        console.log('✅ Schema executed successfully');

        // Sync with node-pg-migrate table
        console.log('🔄 Syncing migration state...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS pgmigrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                run_on TIMESTAMP NOT NULL
            );
        `);

        // Mark initial schema as executed so migrations don't fail
        const migrationName = '1766323846787_initial-schema';
        const migRes = await client.query('SELECT 1 FROM pgmigrations WHERE name = $1', [migrationName]);

        if (migRes.rowCount === 0) {
            await client.query('INSERT INTO pgmigrations (name, run_on) VALUES ($1, NOW())', [migrationName]);
            console.log('✅ Initial migration marked as executed');
        } else {
            console.log('ℹ️  Initial migration already marked');
        }

    } catch (err) {
        console.error('❌ Error executing schema:', err);
    } finally {
        await client.end();
    }
}

function handleError(err) {
    if (err.code === '28P01') {
        console.error('\n❌ AUTHENTICATION ERROR: Incorrect password.');
        console.error('👉 Check DB_PASSWORD in .env\n');
    } else if (err.code === '28000') {
        console.error('\n❌ SSL ERROR: Connection is insecure. Ensure SSL is enabled.\n');
        console.error(err.message);
    } else {
        console.error('❌ Error setting up database:', err);
    }
}

setupDatabase();
