const { Sequelize } = require('sequelize');
const config = require('../src/config/config');
const { dropDatabase } = require('./db-utils');

async function teardownTestDatabase() {
  try {
    // Extract database configuration
    const { database, username, password, host, dialect } = config.db;
    
    // Create a connection without specifying the database
    const sequelize = new Sequelize('', username, password, {
      host,
      dialect,
      logging: false,
    });
    
    // Drop the test database
    await dropDatabase(sequelize, database);
    
    // Close the connection
    await sequelize.close();
    
    console.log('Test database teardown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error tearing down test database:', error);
    process.exit(1);
  }
}

teardownTestDatabase();
