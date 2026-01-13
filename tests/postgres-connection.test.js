const { Pool } = require('pg');
const chai = require('chai');
const expect = chai.expect;
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.test.env') });

describe('PostgreSQL Connection Test', function() {
    let pool;
    let client;
    let skipTests = false;

    before(async function() {
        const { POSTGRES_PASSWORD, POSTGRES_USER, POSTGRES_DB, POSTGRES_SERVER, POSTGRES_PORT, POSTGRES_SSL } = process.env;
        
        // Check if required environment variables are set
        if (!POSTGRES_SERVER || !POSTGRES_USER || !POSTGRES_PASSWORD || !POSTGRES_DB) {
            console.log('\n  PostgreSQL environment variables not configured');
            console.log('Required variables: POSTGRES_SERVER, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB');
            console.log('Current values:', {
                POSTGRES_SERVER: POSTGRES_SERVER || 'undefined',
                POSTGRES_USER: POSTGRES_USER || 'undefined',
                POSTGRES_PASSWORD: POSTGRES_PASSWORD ? '***' : 'undefined',
                POSTGRES_DB: POSTGRES_DB || 'undefined'
            });
            console.log('Skipping PostgreSQL tests...\n');
            skipTests = true;
            this.skip();
            return;
        }

        pool = new Pool({
            host: POSTGRES_SERVER,
            user: POSTGRES_USER,
            password: POSTGRES_PASSWORD,
            port: POSTGRES_PORT || 5432,
            database: POSTGRES_DB,
            ssl: POSTGRES_SSL === 'true' ? true : false,
        });
    });

    after(async () => {
        if (pool) {
            await pool.end();
        }
    });

    it('should connect to PostgreSQL database successfully', async function() {
        if (skipTests) {
            this.skip();
            return;
        }
        
        try {
            client = await pool.connect();
            expect(client).to.be.an('object');
            console.log('✓ PostgreSQL connection successful');
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error(`PostgreSQL server is not running on ${process.env.POSTGRES_SERVER}:${process.env.POSTGRES_PORT || 5432}`);
            } else if (error.code === '28P01') {
                throw new Error('PostgreSQL authentication failed. Check POSTGRES_USER and POSTGRES_PASSWORD');
            } else if (error.code === '3D000') {
                throw new Error(`Database ${process.env.POSTGRES_DB} does not exist`);
            } else {
                throw new Error(`Failed to connect to PostgreSQL: ${error.message}`);
            }
        } finally {
            if (client) {
                client.release();
            }
        }
    });

    it('should be able to execute a simple query', async function() {
        if (skipTests) {
            this.skip();
            return;
        }
        
        try {
            client = await pool.connect();
            const result = await client.query('SELECT 1 as test_value');
            expect(result.rows[0].test_value).to.equal(1);
            console.log('✓ PostgreSQL query execution successful');
        } catch (error) {
            throw new Error(`Failed to execute query: ${error.message}`);
        } finally {
            if (client) {
                client.release();
            }
        }
    });
});