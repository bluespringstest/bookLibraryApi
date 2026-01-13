const { Pool } = require('pg');

const { POSTGRES_PASSWORD, POSTGRES_USER, POSTGRES_DB, POSTGRES_SERVER, POSTGRES_PORT, POSTGRES_SSL } = process.env;

module.exports = async () => {
    const pool = new Pool({
        host: POSTGRES_SERVER,
        user: POSTGRES_USER,
        password: POSTGRES_PASSWORD,
        port: POSTGRES_PORT,
        database: POSTGRES_DB,
        ssl: POSTGRES_SSL === 'true' ? true : false,
    });
    const client = await pool.connect();
    return client;
};