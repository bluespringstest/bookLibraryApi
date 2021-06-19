
const mysql = require('mysql2')
const path = require('path'); 
// const args = process.argv.slice(2)[0]
//extracts any command line arguments from argument values

require('dotenv').config({
    path: path.join(__dirname, '../.test.env'),
});
//Loads the environment variables from the env files.

const { DB_PASSWORD, DB_NAME, DB_USER, DB_HOST, DB_PORT } = process.env;
//to connect to the database
const connection = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
});
//Drop the database
connection.query(`DROP DATABASE ${DB_NAME}`, () => connection.end());