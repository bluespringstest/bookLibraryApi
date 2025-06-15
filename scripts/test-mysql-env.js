const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.test.env' });

async function testConnection() {
  // First try to connect to the default 'mysql' database
  const config = {
    host: 'localhost',
    port: 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: 'mysql', // Connect to default system database first
    connectTimeout: 5000,
  };
  
  // Store the target database name if provided
  const targetDb = process.env.DB_NAME || 'library_db_test'; // Default test database name

  console.log('Testing MySQL connection with config:');
  console.log(`- Host: ${config.host}:${config.port}`);
  console.log(`- User: ${config.user}`);
  console.log(`- Database: ${config.database}`);
  console.log('Connecting...');

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Successfully connected to MySQL server!');
    
    // Show server version
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`✅ MySQL Server version: ${rows[0].version}`);
    
    // Show current user
    const [users] = await connection.execute('SELECT CURRENT_USER() as user');
    console.log(`✅ Connected as: ${users[0].user}`);
    
    // Show databases
    const [dbs] = await connection.execute('SHOW DATABASES');
    console.log('✅ Available databases:');
    dbs.forEach(db => console.log(`  - ${db.Database}`));
    
    return true;
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Error code:', err.code);
    return false;
  } finally {
    if (connection) await connection.end();
  }
}

testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
