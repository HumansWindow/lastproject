/**
 * Database Connection Test Script
 * 
 * This script tests the connection to the Postgres database
 * using the credentials from the .env file.
 */

require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');

async function testConnection() {
  console.log('Attempting to connect to database with following credentials:');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`Database: ${process.env.DB_DATABASE}`);
  console.log(`Username: ${process.env.DB_USERNAME}`);
  console.log('Password: ********');
  
  const client = new Client({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to the database!');
    
    // Test a simple query to verify full access
    const result = await client.query('SELECT current_user, current_database()');
    console.log(`Current user: ${result.rows[0].current_user}`);
    console.log(`Current database: ${result.rows[0].current_database}`);
    
    // Get a list of tables to verify schema access
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
      LIMIT 10
    `);
    
    console.log('\nAvailable tables:');
    tablesResult.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.table_name}`);
    });
    
    console.log('\nDatabase connection test completed successfully.');
  } catch (err) {
    console.error('❌ Database connection failed with error:');
    console.error(err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Execute the test
testConnection();