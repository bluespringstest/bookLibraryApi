// Test configuration
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory path
const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Load test environment variables from .env.test
try {
  const envPath = path.resolve(currentDir, '..', '.env.test');
  dotenv.config({ path: envPath });
} catch (error) {
  console.warn('No .env.test file found, using default test configuration');
}

// Use SQLite in-memory database for tests
const isCI = process.env.CI === 'true';

const config = {
  // Test database configuration
  db: {
    database: process.env.DB_NAME || 'library_test',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    dialect: isCI ? 'sqlite' : process.env.DB_DIALECT || 'sqlite',
    storage: isCI ? ':memory:' : './test-db.sqlite',
    logging: false, // Disable SQL logging during tests
    dialectOptions: isCI ? {} : {},
  },
  
  // JWT configuration for tests
  jwt: {
    secret: process.env.JWT_SECRET || 'test-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  
  // Port for test server
  port: process.env.PORT || 3001,
  
  // Environment
  env: 'test',
  
  // Other test configuration
  test: {
    // Set to true to skip database tests
    skipDatabaseTests: process.env.SKIP_DB_TESTS === 'true',
  },
};
