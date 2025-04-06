import { Client } from 'pg';

async function testAliveConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'Aliveadmin',
    password: 'new_password',
    database: 'Alive-Db',
  });
  
  try {
    console.log('Attempting to connect to Alive-Db with Aliveadmin user...');
    await client.connect();
    console.log('✅ Connection successful!');
    
    // Test executing a simple query
    const result = await client.query('SELECT current_timestamp as time, current_user as user;');
    console.log('Query result:', result.rows[0]);
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
    
    console.log('\nTroubleshooting steps:');
    console.log('1. Make sure PostgreSQL is running: sudo service postgresql status');
    console.log('2. Update pg_hba.conf to allow md5 authentication:');
    console.log('   Run: sudo nano /etc/postgresql/14/main/pg_hba.conf');
    console.log('   Change "peer" to "md5" for local connections or add a new line:');
    console.log('   local   all   Aliveadmin   md5');
    console.log('3. Restart PostgreSQL: sudo service postgresql restart');
  }
}

testAliveConnection();
