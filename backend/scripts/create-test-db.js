const { Client } = require('pg');
require('dotenv').config({ path: '.env.test' });

async function createTestDatabase() {
  // Connect to postgres to create the test database
  const client = new Client({
    host: process.env.TEST_DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || 5432,
    user: process.env.TEST_DB_USERNAME || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    database: 'postgres', // Connect to default postgres database initially
  });

  try {
    await client.connect();
    
    // Check if test database exists
    const checkDbResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = '${process.env.TEST_DB_NAME || 'alivehuman_test'}'`
    );
    
    // Create test database if it doesn't exist
    if (checkDbResult.rows.length === 0) {
      console.log(`Creating test database: ${process.env.TEST_DB_NAME || 'alivehuman_test'}`);
      await client.query(`CREATE DATABASE ${process.env.TEST_DB_NAME || 'alivehuman_test'}`);
      console.log('Test database created successfully');
    } else {
      console.log('Test database already exists');
    }
  } catch (error) {
    console.error('Error creating test database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestDatabase();
