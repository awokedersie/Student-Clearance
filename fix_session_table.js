const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function createSessionTable() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        console.log('Creating session table if it doesn\'t exist...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS "session" (
                "sid" varchar NOT NULL COLLATE "default",
                "sess" json NOT NULL,
                "expire" timestamp(6) NOT NULL
            ) WITH (OIDS=FALSE);
            
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey') THEN
                    ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
                END IF;
            END $$;

            CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
        `);

        console.log('✅ Session table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating session table:', err.message);
    } finally {
        await pool.end();
    }
}

createSessionTable();
