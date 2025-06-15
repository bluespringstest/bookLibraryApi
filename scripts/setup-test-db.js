const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.test.env' });

const config = {
  host: 'localhost',
  port: 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: 'mysql', // Connect to default system database first
  connectTimeout: 5000,
};

const TEST_DB = process.env.DB_NAME || 'library_db_test';

async function setupTestDatabase() {
  console.log('Setting up test database...');
  console.log(`Database name: ${TEST_DB}`);
  
  let connection;
  try {
    // Connect to MySQL server
    connection = await mysql.createConnection({
      ...config,
      multipleStatements: true,
    });

    console.log('✅ Connected to MySQL server');

    // Drop the test database if it exists
    await connection.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
    console.log(`✅ Dropped database '${TEST_DB}' if it existed`);

    // Create the test database
    await connection.query(`CREATE DATABASE \`${TEST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Created database '${TEST_DB}'`);

    // Switch to the test database
    await connection.query(`USE \`${TEST_DB}\``);
    console.log(`✅ Using database '${TEST_DB}'`);

    // Run migrations or schema setup here if needed
    // For now, we'll just confirm the database is accessible
    const [result] = await connection.query('SELECT DATABASE() as db');
    console.log(`✅ Confirmed connected to database: ${result[0].db}`);

    console.log('\n✅ Test database setup completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error setting up test database:', error.message);
    return false;
  } finally {
    if (connection) await connection.end();
  }
}

// Run the setup
setupTestDatabase()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
