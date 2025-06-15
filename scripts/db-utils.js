const { execSync } = require('child_process');

/**
 * Creates a database if it doesn't exist
 * @param {Sequelize} sequelize - Sequelize instance
 * @param {string} dbName - Database name
 */
async function createDatabase(sequelize, dbName) {
  try {
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Database ${dbName} created or already exists`);
  } catch (error) {
    console.error(`Error creating database ${dbName}:`, error);
    throw error;
  }
}

/**
 * Drops a database if it exists
 * @param {Sequelize} sequelize - Sequelize instance
 * @param {string} dbName - Database name
 */
async function dropDatabase(sequelize, dbName) {
  try {
    await sequelize.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
    console.log(`Database ${dbName} dropped successfully`);
  } catch (error) {
    console.error(`Error dropping database ${dbName}:`, error);
    throw error;
  }
}

/**
 * Executes a shell command
 * @param {string} command - Command to execute
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
function execCommand(command) {
  return new Promise((resolve, reject) => {
    try {
      const stdout = execSync(command, { stdio: 'pipe' }).toString();
      resolve({ stdout, stderr: '' });
    } catch (error) {
      reject({
        stdout: error.stdout ? error.stdout.toString() : '',
        stderr: error.stderr ? error.stderr.toString() : error.message,
      });
    }
  });
}

module.exports = {
  createDatabase,
  dropDatabase,
  execCommand,
};
