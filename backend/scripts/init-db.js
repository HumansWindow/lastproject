/**
 * Initialize database with required schema
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

async function initializeDb() {
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
  
  console.log('Connecting to database to initialize schema...');
  
  const client = new Client({
    connectionString: dbUrl,
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Enable UUID extension
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('Enabled uuid-ossp extension');
    
    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        roles VARCHAR(50)[] DEFAULT ARRAY['user'],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE,
        wallet_address VARCHAR(255)
      )
    `);
    console.log('Created users table if it didn\'t exist');
    
    // Create basic wallets table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        address VARCHAR(255) NOT NULL,
        user_id UUID,
        chain VARCHAR(20) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_hot_wallet BOOLEAN DEFAULT FALSE
      )
    `);
    console.log('Created wallets table if it didn\'t exist');
    
    // Add foreign key if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE wallets 
        ADD CONSTRAINT fk_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
      `);
      console.log('Added foreign key constraint to wallets table');
    } catch (error) {
      // Constraint might already exist, so we ignore the error
      console.log('Foreign key constraint might already exist');
    }
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error.message);
  } finally {
    await client.end();
  }
}

initializeDb().catch(console.error);
