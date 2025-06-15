const mysql = require('mysql2/promise');

async function testWindowsAuth() {
  console.log('Attempting to connect using Windows Authentication...');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      authPlugins: {
        mysql_clear_password: () => () => {
          // This is a no-password auth
          return Buffer.from('\0');
        }
      },
      authSwitchHandler: function({ pluginName, pluginData }, cb) {
        if (pluginName === 'caching_sha2_password') {
          // For MySQL 8.0+
          return cb(null, Buffer.from(''));
        }
        if (pluginName === 'mysql_native_password') {
          // For MySQL 5.7 and earlier
          return cb(null, Buffer.from(''));
        }
        cb(new Error('Unsupported auth plugin'));
      }
    });

    console.log('✅ Successfully connected to MySQL using Windows Authentication!');
    
    // Show server version
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`✅ MySQL Server version: ${rows[0].version}`);
    
    // Show current user
    const [users] = await connection.execute('SELECT CURRENT_USER() as user');
    console.log(`✅ Connected as: ${users[0].user}`);
    
    // Show databases
    const [dbs] = await connection.execute('SHOW DATABASES');
    console.log('✅ Available databases:');
    dbs.forEach(db => console.log(`  - ${db.Database}`));
    
    await connection.end();
    return true;
  } catch (err) {
    console.error(`❌ Connection failed: ${err.code || 'Unknown error'} - ${err.message}`);
    console.error('Error details:', err);
    return false;
  }
}

testWindowsAuth().catch(console.error);
