const fs = require('fs').promises;
const path = require('path');

async function renameMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'src', 'migrations');
  
  // Define the correct order of migrations
  const migrationOrder = [
    '20240614190000-initial-schema.js',
    '20230614173400-create-notification.js',
    '20230614171600-create-borrowing.js',
    '20230614172100-create-sales-tables.js',
    '20240614200000-test-migration.js'
  ];

  // New names with proper timestamps to ensure correct order
  const newNames = [
    '20230601000000-initial-schema.js',
    '20230602000000-create-notification.js',
    '20230603000000-create-borrowing.js',
    '20230604000000-create-sales-tables.js',
    '20230605000000-test-migration.js'
  ];

  try {
    // First, verify all files exist
    const files = await fs.readdir(migrationsDir);
    
    // Check if all expected files exist
    for (const file of migrationOrder) {
      if (!files.includes(file)) {
        console.error(`Error: File ${file} not found in migrations directory`);
        return;
      }
    }

    // Rename files
    for (let i = 0; i < migrationOrder.length; i++) {
      const oldPath = path.join(migrationsDir, migrationOrder[i]);
      const newPath = path.join(migrationsDir, newNames[i]);
      
      // Skip if already renamed
      if (migrationOrder[i] === newNames[i]) {
        console.log(`Skipping ${migrationOrder[i]} - already has correct name`);
        continue;
      }
      
      try {
        await fs.rename(oldPath, newPath);
        console.log(`Renamed: ${migrationOrder[i]} -> ${newNames[i]}`);
      } catch (error) {
        console.error(`Error renaming ${migrationOrder[i]}:`, error.message);
      }
    }

    console.log('\nMigration files have been renamed successfully!');
    console.log('New order of migrations:');
    
    // List the files in the new order
    const updatedFiles = await fs.readdir(migrationsDir);
    updatedFiles
      .filter(f => f.endsWith('.js'))
      .sort()
      .forEach((file, index) => console.log(`${index + 1}. ${file}`));
      
  } catch (error) {
    console.error('Error renaming migration files:', error);
  }
}

// Run the function
renameMigrations();
