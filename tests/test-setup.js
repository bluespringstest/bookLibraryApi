const dotenv = require('dotenv');

dotenv.config({ path: './.test.env'});

// Ensure test DB is dropped after tests (even on failure)
const { dropDatabase } = require('../scripts/drop-database');

after(async function () {
  try {
    await dropDatabase();
  } catch (err) {
    console.error('Error during test cleanup:', err.message || err);
  }
});
