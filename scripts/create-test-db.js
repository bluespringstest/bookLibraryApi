const { execSync } = require('child_process');
require('dotenv').config({ path: '.test.env' });
const { Sequelize } = require('sequelize');
const { createDatabase, dropDatabase } = require('./db-utils');

async function setupTestDatabase() {
  // Get database configuration from environment variables
  const dbConfig = {
    database: process.env.DB_NAME || 'music_library_test',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
  };

  console.log('Setting up test database with config:', {
    ...dbConfig,
    password: dbConfig.password ? '***' : '(empty)',
  });

  // Create a connection without specifying the database
  const sequelize = new Sequelize('', dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false,
  });

  try {
    // Drop the database if it exists
    try {
      console.log(`Dropping database ${dbConfig.database} if it exists...`);
      await dropDatabase(sequelize, dbConfig.database);
    } catch (dropError) {
      console.warn('Warning: Could not drop database (may not exist):', dropError.message);
    }

    // Create the test database
    console.log(`Creating database ${dbConfig.database}...`);
    await createDatabase(sequelize, dbConfig.database);
    console.log(`✅ Test database ${dbConfig.database} created successfully`);

    // Close the connection
    await sequelize.close();

    // Run migrations
    console.log('Running migrations...');
    execSync('npx sequelize-cli db:migrate --env=test', {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' },
    });

    // Seed the database
    console.log('Seeding database...');
    execSync('npx sequelize-cli db:seed:all', {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' },
    });

    console.log('✅ Test database setup completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close().catch(console.error);
    }
  }
}

setupTestDatabase();
