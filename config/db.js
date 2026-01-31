const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '9700',
    database: process.env.DB_NAME || 'clearance',
    port: process.env.DB_PORT || 5434,
    ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
};

const pool = new Pool(dbConfig);

// Test database connection
pool.connect()
    .then(() => console.log('✅ Connected to PostgreSQL database'))
    .catch(err => console.error('❌ Database connection error:', err));

// MySQL Compatibility Layer for legacy routes
pool.execute = async function (sql, params) {
    // 1. Convert placeholders (?) to ($1, $2, etc.)
    let paramIndex = 1;
    let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

    // Replace backticks with double quotes for identifier compatibility
    pgSql = pgSql.replace(/`/g, '"');

    // 2. Fix LIMIT syntax (LIMIT offset, count -> LIMIT count OFFSET offset)
    pgSql = pgSql.replace(/LIMIT\s+(\d+)\s*,\s*(\d+)/yi, 'LIMIT $2 OFFSET $1');

    // 3. Handle INSERTs to return id (Emulate insertId)
    const isInsert = /^INSERT/i.test(pgSql);
    if (isInsert && !/RETURNING/i.test(pgSql)) {
        pgSql += ' RETURNING id';
    }

    // 4. Handle SHOW TABLES
    const showTablesMatch = pgSql.match(/^SHOW\s+TABLES\s+LIKE\s+['"]([^'"]+)['"]/i);
    if (showTablesMatch) {
        const tableName = showTablesMatch[1];
        pgSql = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${tableName}'`;
    }

    // 5. Handle SHOW COLUMNS
    const showColumnsMatch = pgSql.match(/^SHOW\s+COLUMNS\s+FROM\s+(\S+)\s+LIKE\s+['"]([^'"]+)['"]/i);
    if (showColumnsMatch) {
        const tableName = showColumnsMatch[1].replace(/[`"']/g, ''); // Remove quotes if any
        const columnName = showColumnsMatch[2];
        pgSql = `SELECT column_name FROM information_schema.columns WHERE table_name = '${tableName}' AND column_name = '${columnName}'`;
    }

    try {
        const result = await this.query(pgSql, params);

        if (isInsert) {
            const insertId = result.rows.length > 0 ? result.rows[0].id : 0;
            return [{
                insertId: insertId,
                affectedRows: result.rowCount
            }, undefined];
        }

        if (/^UPDATE|DELETE/i.test(pgSql)) {
            return [{ affectedRows: result.rowCount }, undefined];
        }

        return [result.rows, result.fields];
    } catch (err) {
        console.error('SQL Error:', err.message);
        console.error('Query:', pgSql);
        throw err;
    }
};

module.exports = pool;
