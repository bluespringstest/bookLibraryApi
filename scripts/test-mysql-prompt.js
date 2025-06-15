const readline = require('readline');
const mysql = require('mysql2/promise');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testConnection(user, password) {
  console.log(`\nAttempting to connect with username: ${user}`);
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: user,
      password: password,
      connectTimeout: 2000,
      multipleStatements: true
    });

    console.log('✅ Successfully connected to MySQL!');
    
    // Show server version
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`✅ MySQL Server version: ${rows[0].version}`);
    
    // Show databases
    const [dbs] = await connection.execute('SHOW DATABASES');
    console.log('✅ Available databases:');
    dbs.forEach(db => console.log(`  - ${db.Database}`));
    
    await connection.end();
    return true;
  } catch (err) {
    console.error(`❌ Connection failed: ${err.code} - ${err.message}`);
    return false;
  }
}

async function promptForCredentials() {
  return new Promise((resolve) => {
    rl.question('Enter MySQL username (default: root): ', (user) => {
      user = user || 'root';
      rl.question('Enter MySQL password: ', { silent: true }, (password) => {
        resolve({ user, password });
      });
    });
  });
}

async function main() {
  console.log('MySQL Connection Tester');
  console.log('------------------------');
  
  while (true) {
    const credentials = await promptForCredentials();
    const connected = await testConnection(credentials.user, credentials.password);
    
    if (connected) {
      console.log('\n✅ Success! Use these credentials in your .env file:');
      console.log(`DB_USER=${credentials.user}`);
      console.log(`DB_PASSWORD=${credentials.password}`);
      break;
    } else {
      console.log('\n❌ Connection failed. Please try again or press Ctrl+C to exit.\n');
    }
  }
  
  rl.close();
}

main().catch(console.error);
