#!/usr/bin/env node
require('dotenv').config();
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Database Initialization Script
 * 
 * This script initializes the database with the necessary tables for wallet authentication
 * and creates an initial admin user with the wallet address detected in logs.
 */

// Configuration from environment variables
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_DATABASE || 'Alive-DB',
  user: process.env.DB_USERNAME || 'Aliveadmin',
  password: process.env.DB_PASSWORD || 'alivehumans@2024',
};

// The wallet address detected in logs
const INITIAL_WALLET_ADDRESS = '0x0749c7b218948524cab3e892eba5e60b0b95caee';

// Database connection
let client;

// Generate a UUID 
function generateUUID() {
  return uuidv4();
}

// Generate a unique referral code
function generateReferralCode() {
  return 'REF' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

async function initializeDatabase() {
  console.log('Starting database initialization...');
  console.log(`Connecting to PostgreSQL at ${config.host}:${config.port} as ${config.user}`);
  
  try {
    // Connect to the database
    client = new Client(config);
    await client.connect();
    console.log('Connected to database successfully.');
    
    // Create UUID extension if it doesn't exist
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('Ensured UUID extension is available.');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "first_name" varchar,
        "last_name" varchar,
        "avatar_url" varchar,
        "is_active" boolean DEFAULT true,
        "is_verified" boolean DEFAULT false,
        "role" varchar DEFAULT 'user',
        "referral_code" varchar,
        "referred_by_id" uuid,
        "referral_tier" integer DEFAULT 0,
        "wallet_address" varchar,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "FK_users_referred_by" FOREIGN KEY ("referred_by_id") REFERENCES "users" ("id") ON DELETE SET NULL
      );
    `);
    console.log('Created users table.');
    
    // Create wallets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "wallets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "address" varchar NOT NULL,
        "private_key" varchar,
        "chain" varchar DEFAULT 'ETH',
        "user_id" uuid NOT NULL,
        "is_active" boolean DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "FK_wallets_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_wallet_address" UNIQUE ("address")
      );
    `);
    console.log('Created wallets table.');
    
    // Create profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "profiles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "email" varchar,
        "password" varchar,
        "first_name" varchar,
        "last_name" varchar,
        "display_name" varchar,
        "avatar_url" varchar,
        "bio" text,
        "unique_id" varchar UNIQUE,
        "visibility_level" varchar DEFAULT 'public',
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "FK_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);
    console.log('Created profiles table.');
    
    // Create user_devices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_devices" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "device_id" varchar(255) NOT NULL,
        "device_type" varchar(50) DEFAULT 'unknown',
        "name" varchar(255),
        "platform" varchar(100),
        "os_name" varchar(100),
        "os_version" varchar(100),
        "browser" varchar(100),
        "browser_version" varchar(100),
        "is_active" boolean DEFAULT true,
        "last_used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "FK_user_devices_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);
    console.log('Created user_devices table.');
    
    // Create user_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "device_id" varchar(255),
        "wallet_id" uuid,
        "token" varchar(500),
        "ip_address" varchar(100),
        "user_agent" text,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "is_active" boolean DEFAULT true,
        "ended_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "FK_user_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_sessions_wallet_id" FOREIGN KEY ("wallet_id") REFERENCES "wallets" ("id") ON DELETE SET NULL
      );
    `);
    console.log('Created user_sessions table.');
    
    // Create refresh_tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "token" varchar NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);
    console.log('Created refresh_tokens table.');
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_wallet_address" ON "wallets" ("address");
      CREATE INDEX IF NOT EXISTS "IDX_wallet_address_lower" ON "wallets" (LOWER("address"));
      CREATE INDEX IF NOT EXISTS "IDX_wallet_user_id" ON "wallets" ("user_id");
      CREATE INDEX IF NOT EXISTS "IDX_wallet_address_chain" ON "wallets" ("address", "chain");
      CREATE INDEX IF NOT EXISTS "IDX_profile_user_id" ON "profiles" ("user_id");
      CREATE INDEX IF NOT EXISTS "IDX_profile_email" ON "profiles" ("email");
      CREATE INDEX IF NOT EXISTS "IDX_profile_unique_id" ON "profiles" ("unique_id");
      CREATE INDEX IF NOT EXISTS "IDX_user_device_user_id" ON "user_devices" ("user_id");
      CREATE INDEX IF NOT EXISTS "IDX_user_device_device_id" ON "user_devices" ("device_id");
      CREATE INDEX IF NOT EXISTS "IDX_user_session_user_id" ON "user_sessions" ("user_id");
      CREATE INDEX IF NOT EXISTS "IDX_user_wallet_address" ON "users" ("wallet_address");
    `);
    console.log('Created necessary indexes.');
    
    // Check if we need to create an initial admin user
    const { rows } = await client.query(`
      SELECT COUNT(*) FROM users;
    `);
    
    const userCount = parseInt(rows[0].count, 10);
    
    if (userCount === 0) {
      console.log('No users found in the database. Creating initial admin user...');
      
      // Generate a UUID for the admin user
      const userId = generateUUID();
      const referralCode = generateReferralCode();
      
      // Create admin user
      await client.query(`
        INSERT INTO users (
          id, role, is_active, is_verified, referral_code, wallet_address, created_at, updated_at
        ) VALUES (
          $1, 'admin', true, true, $2, $3, NOW(), NOW()
        )
      `, [userId, referralCode, INITIAL_WALLET_ADDRESS.toLowerCase()]);
      console.log('Created admin user with ID:', userId);
      
      // Create wallet for the admin user
      const walletId = generateUUID();
      const normalizedAddress = INITIAL_WALLET_ADDRESS.toLowerCase();
      
      await client.query(`
        INSERT INTO wallets (
          id, address, chain, user_id, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, 'ETH', $3, true, NOW(), NOW()
        )
      `, [walletId, normalizedAddress, userId]);
      console.log('Created wallet for admin user. Address:', normalizedAddress);
      
      // Create profile for the admin user
      const profileId = generateUUID();
      const uniqueId = 'admin-' + crypto.randomBytes(4).toString('hex');
      
      await client.query(`
        INSERT INTO profiles (
          id, user_id, display_name, unique_id, visibility_level, created_at, updated_at
        ) VALUES (
          $1, $2, 'Admin', $3, 'public', NOW(), NOW()
        )
      `, [profileId, userId, uniqueId]);
      console.log('Created profile for admin user.');
      
      console.log('Initial admin user created successfully!');
      console.log('You can now log in with the wallet address:', INITIAL_WALLET_ADDRESS);
    } else {
      console.log(`Found ${userCount} existing users. Skipping admin user creation.`);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Database initialization completed successfully!');
    
    return true;
  } catch (error) {
    // Rollback the transaction if there was an error
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error initializing database:', error);
    return false;
  } finally {
    // Close the database connection
    if (client) {
      await client.end();  // Changed from destroy() to end()
    }
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(success => {
      if (success) {
        console.log('Database is now ready for use with the wallet authentication system.');
        process.exit(0);
      } else {
        console.error('Failed to initialize database. Please check the error messages above.');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unexpected error during database initialization:', err);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };