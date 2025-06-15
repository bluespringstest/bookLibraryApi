const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '.test.env' });

async function checkTestDatabase() {
  const config = {
    database: process.env.DB_NAME || 'music_library_test',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
  };

  console.log('Connecting to test database...');
  
  try {
    const sequelize = new Sequelize(
      config.database,
      config.username,
      config.password,
      {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        logging: false,
      }
    );

    console.log('✅ Successfully connected to test database');
    
    // List all tables in the database
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('\nTables in the test database:');
    
    if (tables.length === 0) {
      console.log('  No tables found in the test database');
    } else {
      tables.forEach(table => {
        const tableName = table[`Tables_in_${config.database}`];
        console.log(`  - ${tableName}`);
      });
    }
    
    // Close the connection
    await sequelize.close();
    return true;
  } catch (error) {
    console.error('❌ Error checking test database:', error.message);
    return false;
  }
}

checkTestDatabase()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
