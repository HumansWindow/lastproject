// Simple script to test database connection
const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('Testing database connection...');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'Aliveadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'Alive-Db'
  });

  try {
    console.log('Connecting to database with:');
    console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  Port: ${process.env.DB_PORT || 5432}`);
    console.log(`  User: ${process.env.DB_USERNAME || 'Aliveadmin'}`);
    console.log(`  Database: ${process.env.DB_NAME || 'Alive-Db'}`);
    console.log('Attempting to connect...');
    
    await client.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT NOW()');
    console.log(`Current database time: ${result.rows[0].now}`);

    await client.end();
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  }
}

testConnection();
