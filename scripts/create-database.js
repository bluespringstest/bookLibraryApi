

//utils/create-database.js

const { Pool } = require('pg');
const path = require('path');
//the path to handle file paths when a request is made.

const args = process.argv.slice(2)[0]
//extracts any command line arguments from argument values

const envFile = args === 'test' ? '../.test.env' : '../.env';
//uses arguments to determine if .env or .test.env should be loaded

require('dotenv').config({
    path: path.join(__dirname, envFile),
});
//Loads the environment variables from the env files.

const { POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_USER, POSTGRES_SERVER, POSTGRES_PORT, POSTGRES_SSL } = process.env;
//retrieves (destructure) the environment variables from process.env

const setUpDatabase = async () => {
    // Check if required environment variables are set
    if (!POSTGRES_SERVER || !POSTGRES_USER || !POSTGRES_PASSWORD || !POSTGRES_DB) {
        console.error('Missing required PostgreSQL environment variables');
        console.error('Required variables: POSTGRES_SERVER, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB');
        console.error('Current values:', {
            POSTGRES_SERVER: POSTGRES_SERVER || 'undefined',
            POSTGRES_USER: POSTGRES_USER || 'undefined',
            POSTGRES_PASSWORD: POSTGRES_PASSWORD ? '***' : 'undefined',
            POSTGRES_DB: POSTGRES_DB || 'undefined',
            POSTGRES_PORT: POSTGRES_PORT || '5432 (default)'
        });
        process.exit(1);
    }

    try {
        // Connect to PostgreSQL without specifying a database
        const pool = new Pool({
            host: POSTGRES_SERVER,
            user: POSTGRES_USER,
            password: POSTGRES_PASSWORD,
            port: POSTGRES_PORT || 5432,
            ssl: POSTGRES_SSL === 'true' ? true : false,
        });
        
        const client = await pool.connect();
        
        try {
            // Check if database already exists
            const result = await client.query(
                `SELECT 1 FROM pg_database WHERE datname = $1`,
                [POSTGRES_DB]
            );
            
            if (result.rows.length === 0) {
                // Create the database only if it doesn't exist
                await client.query(`CREATE DATABASE "${POSTGRES_DB}"`);
                console.log(`Database ${POSTGRES_DB} created successfully`);
            } else {
                console.log(`Database ${POSTGRES_DB} already exists`);
            }
        } finally {
            client.release();
        }
        
        await pool.end();
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            console.error('Failed to connect to PostgreSQL database');
            console.error(`Make sure PostgreSQL is running on ${POSTGRES_SERVER}:${POSTGRES_PORT || 5432}`);
        } else if (err.code === '42P04') {
            // Database already exists
            console.log(`Database ${POSTGRES_DB} already exists`);
        } else {
            console.error('Error setting up database:', err.message);
        }
        console.error('Environment Variables:', {
            POSTGRES_SERVER,
            POSTGRES_PORT: POSTGRES_PORT || '5432',
            POSTGRES_USER,
            POSTGRES_DB,
            POSTGRES_SSL: POSTGRES_SSL || 'false'
        });
        process.exit(1);
    }
};


//run the asyncronous function
setUpDatabase();

