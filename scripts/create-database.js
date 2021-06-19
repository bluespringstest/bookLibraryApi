

//utils/create-database.js

const mysql = require('mysql2/promise')
const path = require('path'); 
const db = require('../src/services/db');
//the path to handle file paths when a request is made.

const args = process.argv.slice(2)[0]
//extracts any command line arguments from argument values

const envFile = args === 'test' ? '../.test.env' : '../.env';
//uses arguments to determine if .env or .test.env should be loaded

require('dotenv').config({
    path: path.join(__dirname, envFile),
});
//Loads the environment variables from the env files.

const { DB_PASSWORD, DB_NAME, DB_USER, DB_HOST, DB_PORT } = process.env;
//retrieves (destructure) the environment variables from process.env

const setUpDatabase = async () => {
    try {
        //to connect to the database
        const db = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            port: DB_PORT
        });
        //create the database only if it doesn't exist
        await db.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
           await db.query(`USE ${DB_NAME}`);
           await db.query(`CREATE TABLE IF NOT EXISTS Artist (
               id INT PRIMARY KEY auto_increment,
               name VARCHAR(25),
               genre VARCHAR(25)
               )`);
               db.close();
        }
    //if something goes wrong
    catch (err) {
        console.log(
            `Your environment variables might be wrong. Please double check .env file`
        );
        //log out the error and current environment variables
        console.log('Environment Variables are:', {
            DB_PASSWORD,
            DB_NAME,
            DB_USER,
            DB_HOST,
            DB_PORT,
        });
        console.log(err);
    }
};


//run the asyncronous function
setUpDatabase();

