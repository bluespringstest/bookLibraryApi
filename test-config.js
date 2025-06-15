require('dotenv').config({ path: '.test.env' });

module.exports = {
  // Database Configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'music_library_test',

  // Server Configuration
  NODE_ENV: 'test',
  PORT: process.env.PORT || 3000,

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'test-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  // Email configuration for tests
  EMAIL_ENABLED: process.env.EMAIL_ENABLED !== 'false',
  EMAIL_TEST_MODE: true,
};

// Usage in your test files:
// const config = require('./test-config');
// console.log(config.DB_HOST); // 'localhost'
