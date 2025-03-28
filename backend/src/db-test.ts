import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  // Try with the postgres user and alive_human_db first
  const clientPostgres = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: 'postgres',
    password: 'postgres',
    database: 'alive_human_db',
  });
  
  try {
    console.log('Trying to connect with postgres user to alive_human_db...');
    await clientPostgres.connect();
    console.log('Connected successfully with postgres user to alive_human_db!');
    await clientPostgres.end();
    console.log('This is the recommended configuration for your application.');
  } catch (postgresError) {
    console.error('Failed to connect with postgres user to alive_human_db:', postgresError.message);
    
    // Try with Aliveadmin user and Alive-Db as alternative
    const clientAlive = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: 'Aliveadmin',
      password: 'new_password',
      database: 'Alive-Db',
    });

    try {
      console.log('Trying to connect with Aliveadmin user to Alive-Db...');
      await clientAlive.connect();
      console.log('Connected successfully with Aliveadmin user to Alive-Db!');
      await clientAlive.end();
      console.log('Consider updating your .env file to use the Alive-Db database with Aliveadmin user.');
    } catch (aliveError) {
      console.error('Failed to connect with Aliveadmin user to Alive-Db:', aliveError.message);
      console.log('\nTroubleshooting tips:');
      console.log('1. Verify PostgreSQL is running: sudo service postgresql status');
      console.log('2. Try resetting the postgres user password: sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD \'postgres\';"');
      console.log('3. Try resetting the Aliveadmin user password: sudo -u postgres psql -c "ALTER USER Aliveadmin WITH PASSWORD \'new_password\';"');
      console.log('4. Check database ownership: sudo -u postgres psql -c "\\l"');
    }
  }
}

testConnection();
