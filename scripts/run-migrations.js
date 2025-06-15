require('dotenv').config({ path: '.test.env' });
const { Sequelize } = require('sequelize');
const path = require('path');

async function runMigrations() {
  // Database configuration from environment variables
  const dbConfig = {
    database: process.env.DB_NAME || 'music_library_test',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log, // Enable logging
  };

  console.log('Database configuration:', {
    ...dbConfig,
    password: dbConfig.password ? '***' : '(empty)',
  });

  // Create a Sequelize instance
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
    }
  );

  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');

    // Get the query interface
    const queryInterface = sequelize.getQueryInterface();

    // Check if the SequelizeMeta table exists
    const [tables] = await sequelize.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log('\nCurrent tables in database:', tableNames);

    if (tableNames.includes('SequelizeMeta')) {
      console.log('\nSequelizeMeta table exists. Current migrations:');
      const [migrations] = await sequelize.query('SELECT * FROM SequelizeMeta');
      console.table(migrations);
    } else {
      console.log('\nSequelizeMeta table does not exist yet.');
    }

    // Run migrations
    console.log('\nRunning migrations...');
    const { execSync } = require('child_process');
    
    // Set NODE_ENV to test to ensure we use the test database
    process.env.NODE_ENV = 'test';
    
    try {
      execSync('npx sequelize-cli db:migrate', { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' }
      });
      console.log('✅ Migrations completed successfully');
    } catch (migrateError) {
      console.error('❌ Error running migrations:', migrateError);
      throw migrateError;
    }

    // Check tables after migrations
    const [tablesAfter] = await sequelize.query('SHOW TABLES');
    const tableNamesAfter = tablesAfter.map(t => Object.values(t)[0]);
    console.log('\nTables after migrations:', tableNamesAfter);

    if (tableNamesAfter.includes('SequelizeMeta')) {
      const [migrationsAfter] = await sequelize.query('SELECT * FROM SequelizeMeta');
      console.log('\nMigrations after running:', migrationsAfter);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('Database connection closed.');
    }
  }
}

runMigrations();
