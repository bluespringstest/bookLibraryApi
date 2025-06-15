const mysql = require('mysql2/promise');

async function testConnection(credentials) {
  console.log(`\nTesting connection with: ${JSON.stringify(credentials, null, 2)}`);
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: credentials.user,
    password: credentials.password,
    connectTimeout: 2000,
    multipleStatements: true
  }).catch(err => {
    console.error(`❌ Connection failed: ${err.code} - ${err.message}`);
    return null;
  });

  if (!connection) return false;

  try {
    console.log('✅ Connected to MySQL server');
    
    // Show server version
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`✅ MySQL Server version: ${rows[0].version}`);
    
    // Show databases
    const [dbs] = await connection.execute('SHOW DATABASES');
    console.log('✅ Available databases:');
    dbs.forEach(db => console.log(`  - ${db.Database}`));
    
    return true;
  } catch (err) {
    console.error(`❌ Error executing query: ${err.message}`);
    return false;
  } finally {
    await connection.end();
  }
}

// Test common credentials
const testCredentials = [
  { user: 'root', password: '' },      // Default XAMPP/WAMP
  { user: 'root', password: 'root' },  // Common alternative
  { user: 'admin', password: 'admin' },
  { user: 'library', password: 'library' },
];

async function runTests() {
  let connected = false;
  
  for (const creds of testCredentials) {
    connected = await testConnection(creds);
    if (connected) {
      console.log('\n✅ Successfully connected to MySQL!');
      console.log(`Username: ${creds.user}`);
      console.log(`Password: ${creds.password ? '********' : '<empty>'}`);
      break;
    }
  }
  
  if (!connected) {
    console.log('\n❌ Could not connect with any test credentials.');
    console.log('Please check if MySQL is running and try with the correct credentials.');
  }
}

runTests();
