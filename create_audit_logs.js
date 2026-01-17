const pool = require('./config/db');

async function createAuditTable() {
    try {
        console.log('Connecting to database...');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                admin_id INTEGER,
                admin_name VARCHAR(255),
                admin_role VARCHAR(100),
                action VARCHAR(100),
                target_student_id VARCHAR(50),
                target_student_name VARCHAR(255),
                details TEXT,
                ip_address VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await pool.execute(createTableQuery);
        console.log('✅ audit_logs table created successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
}

createAuditTable();
