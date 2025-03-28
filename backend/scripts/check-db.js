/**
 * Debug script to validate database connection
 */
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('Loaded .env file from:', envPath);
  } else {
    console.log('No .env file found, using environment variables');
  }
}

async function checkDbConnection() {
  loadEnv();
  
  // Get connection parameters
  let dbUrl = process.env.DATABASE_URL;
  
  // If no URL provided, try to construct from individual params
  if (!dbUrl) {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 5432;
    const database = process.env.DB_NAME || 'Alive-Db';
    const user = process.env.DB_USERNAME || 'Aliveadmin';
    const password = process.env.DB_PASSWORD || '';
    
    dbUrl = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }
  
  console.log('Trying to connect to database...');
  console.log(`Connection details: ${dbUrl.replace(/:[^:]*@/, ':***@')}`);
  
  const client = new Client({
    connectionString: dbUrl,
  });
  
  try {
    await client.connect();
    console.log('✅ Database connection successful!');
    const result = await client.query('SELECT NOW()');
    console.log(`Current database time: ${result.rows[0].now}`);
    
    try {
      // Check if users table exists
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      console.log('\nAvailable tables:');
      tablesResult.rows.forEach(row => console.log(`- ${row.table_name}`));
      
      if (tablesResult.rows.some(row => row.table_name === 'users')) {
        // Count users
        const userCount = await client.query('SELECT COUNT(*) FROM users');
        console.log(`\nUsers in database: ${userCount.rows[0].count}`);
      } else {
        console.log('\n⚠️ Users table not found in database');
      }
    } catch (err) {
      console.error('Error checking tables:', err.message);
    }
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Please check your database configuration and ensure PostgreSQL is running.');
  } finally {
    await client.end();
  }
}

checkDbConnection().catch(console.error);
