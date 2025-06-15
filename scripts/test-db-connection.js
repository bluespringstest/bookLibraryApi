const { Sequelize } = require('sequelize');
const config = require('../src/config/config');

async function testConnection() {
  // Use the development configuration
  const dbConfig = config.db;
  
  console.log('Attempting to connect to database with config:', {
    host: dbConfig.host,
    port: dbConfig.port || 3306,
    database: dbConfig.database,
    username: dbConfig.username,
    dialect: dbConfig.dialect
  });

  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port || 3306,
      dialect: dbConfig.dialect,
      logging: console.log,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Connection to database has been established successfully.');
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT 1+1 as result');
    console.log('✅ Test query result:', results[0]);
    
    // Show current database
    const [dbResult] = await sequelize.query('SELECT DATABASE() as db');
    console.log('✅ Current database:', dbResult[0].db);
    
    // Show tables in the database
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('✅ Tables in database:', tables.map(t => Object.values(t)[0]));
    
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    if (error.original) {
      console.error('❌ Original error:', error.original);
    }
  } finally {
    await sequelize.close();
  }
}

testConnection();
