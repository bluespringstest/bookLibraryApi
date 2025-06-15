// Configure environment for testing
process.env.NODE_ENV = 'test';

// Load environment variables from .env.test
require('dotenv').config({ path: '.env.test' });

// Load test configuration
const config = require('./test.config');

// Set up global test timeout (30 seconds)
const TIMEOUT = 30000;

// Increase test timeout for all tests
mocha.timeout(TIMEOUT);

// Global before hook
before(async function() {
  // This runs once before all tests
  this.timeout(60000); // 60 seconds for setup
  
  try {
    if (config.test.skipDatabaseTests) {
      console.log('Skipping database tests as per configuration');
      return;
    }

    // Setup test database if needed
    const { sequelize } = require('../src/models');
    
    // Sync all models
    await sequelize.sync({ force: true });
    
    // Seed test data if needed
    // await seedTestData();
    
    console.log('Test setup completed');
  } catch (error) {
    console.error('Test setup failed:', error);
    process.exit(1);
  }
});

// Global after hook
after(async function() {
  // This runs once after all tests
  this.timeout(30000); // 30 seconds for cleanup
  
  try {
    if (config.test.skipDatabaseTests) {
      return;
    }

    // Close database connections
    const { sequelize } = require('../src/models');
    if (sequelize) {
      await sequelize.close();
      console.log('Test teardown completed');
    }
  } catch (error) {
    console.error('Test teardown failed:', error);
  }
});

// Global test hooks
beforeEach(function() {
  // This runs before each test
  this.currentTest.startTime = new Date();
});

afterEach(function() {
  // This runs after each test
  const testDuration = new Date() - this.currentTest.startTime;
  console.log(`Test "${this.currentTest.title}" completed in ${testDuration}ms`);
  
  // Reset any mocks or stubs
  if (this.sinon) {
    this.sinon.restore();
  }
});

// Make expect globally available
const { expect } = require('chai');
global.expect = expect;

// Configure chai plugins
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiHttp = require('chai-http');
const sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(chaiHttp);
chai.use(sinonChai);

// Configure supertest
const supertest = require('supertest');
const app = require('../src/app');
global.request = supertest(app);

// Configure test data factories
const { factory } = require('factory-girl');
const { User, Book, Author, Genre } = require('../src/models');

// Define factories
factory.define('user', User, {
  firstName: factory.chance('first'),
  lastName: factory.chance('last'),
  email: factory.chance('email'),
  password: 'password123',
  role: 'member',
});

factory.define('author', Author, {
  name: factory.chance('name'),
  biography: factory.chance('paragraph'),
  birthDate: factory.chance('birthday', { type: 'adult' }),
});

factory.define('genre', Genre, {
  name: factory.chance('word'),
  description: factory.chance('sentence'),
});

factory.define('book', Book, {
  isbn: () => factory.chance('integer', { min: 1000000000000, max: 9999999999999 }).toString(),
  title: factory.chance('sentence', { words: 3 }),
  description: factory.chance('paragraph'),
  publishedDate: factory.chance('date', { year: 1900 }),
  publisher: factory.chance('company'),
  pageCount: factory.chance('integer', { min: 50, max: 1000 }),
  language: 'English',
  coverImage: factory.chance('url'),
  totalCopies: factory.chance('integer', { min: 1, max: 10 }),
  availableCopies: factory.chance('integer', { min: 0, max: 10 }),
  authorId: factory.assoc('author', 'id'),
  genreId: factory.assoc('genre', 'id'),
});
