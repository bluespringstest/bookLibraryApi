
const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '../.test.env'),
});

const { POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_USER, POSTGRES_SERVER, POSTGRES_PORT, POSTGRES_SSL } = process.env;

// Create a pool that connects to the default 'postgres' database so we can drop another DB
const pool = new Pool({
  host: POSTGRES_SERVER,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  port: POSTGRES_PORT || 5432,
  database: 'postgres',
  ssl: POSTGRES_SSL === 'true' ? true : false,
});

const dropDatabase = async () => {
  let client;
  try {
    client = await pool.connect();

    // Terminate connections to the target database
    const terminateSql = `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`;
    await client.query(terminateSql, [POSTGRES_DB]);

    // Drop the database if it exists
    await client.query(`DROP DATABASE IF EXISTS "${POSTGRES_DB}"`);

    console.log(`Database ${POSTGRES_DB} dropped successfully`);
    return true;
  } catch (err) {
    console.error('Error dropping database:', err.message || err);
    throw err;
  } finally {
    if (client) client.release();
    await pool.end();
  }
};

// If this file is executed directly, run the drop
if (require.main === module) {
  dropDatabase().catch(() => process.exit(1));
}

module.exports = { dropDatabase };
