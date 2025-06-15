require('dotenv').config({ path: '.test.env' });
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;

async function runMigrations() {
  // Database configuration from environment variables
  const dbConfig = {
    database: process.env.DB_NAME || 'music_library_test',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log,
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

    // Check current tables
    const [tables] = await sequelize.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('\nCurrent tables in database:', tableNames);

    // Ensure SequelizeMeta table exists
    if (!tableNames.includes('SequelizeMeta')) {
      console.log('Creating SequelizeMeta table...');
      await queryInterface.createTable('SequelizeMeta', {
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
          primaryKey: true,
        },
      });
      console.log('✅ Created SequelizeMeta table');
    } else {
      console.log('SequelizeMeta table already exists');
    }

    // Get list of migration files
    const migrationsPath = path.join(__dirname, '..', 'src', 'migrations');
    const files = await fs.readdir(migrationsPath);
    const migrationFiles = files
      .filter(file => file.endsWith('.js') && file !== '20240614200000-test-migration.js')
      .sort();

    console.log('\nFound migration files:', migrationFiles);

    // Get already executed migrations
    const [executedMigrations] = await sequelize.query('SELECT name FROM SequelizeMeta');
    const executedMigrationNames = executedMigrations.map(m => m.name);
    console.log('Executed migrations:', executedMigrationNames);

    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrationNames.includes(file.replace('.js', ''))
    );

    if (pendingMigrations.length === 0) {
      console.log('\n✅ No pending migrations');
      return;
    }

    console.log('\nPending migrations:', pendingMigrations);

    // Run pending migrations
    for (const file of pendingMigrations) {
      const migration = require(path.join(migrationsPath, file));
      console.log(`\n🔄 Running migration: ${file}`);
      
      try {
        await migration.up(queryInterface, Sequelize);
        await queryInterface.sequelize.query(
          'INSERT INTO SequelizeMeta (name) VALUES (?)',
          { replacements: [file.replace('.js', '')] }
        );
        console.log(`✅ Successfully migrated: ${file}`);
      } catch (error) {
        console.error(`❌ Error running migration ${file}:`, error);
        throw error;
      }
    }

    console.log('\n✅ All migrations completed successfully');
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
