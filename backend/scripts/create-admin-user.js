// This script creates an admin user in the database
require('dotenv').config();
const { createConnection } = require('typeorm');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function createAdminUser() {
  console.log('Connecting to database...');
  
  try {
    // Use the same database configuration as your main application
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'postgres',
      synchronize: false,
      logging: true
    });

    console.log('Connected to database successfully');

    // Generate a wallet address for admin if none is provided
    const walletAddress = '0x0749c7b218948524cab3e892eba5e60b0b95caee'; // Use the one from logs
    
    // Check if user already exists
    const existingUser = await connection.query(
      `SELECT * FROM "users" WHERE LOWER("walletAddress") = LOWER($1)`,
      [walletAddress]
    );

    if (existingUser && existingUser.length > 0) {
      console.log(`User with wallet address ${walletAddress} already exists`);
      await connection.close();
      return;
    }

    // Create admin user
    const userId = uuidv4();
    const now = new Date();
    
    console.log('Creating admin user...');
    
    await connection.query(
      `INSERT INTO "users" 
       ("id", "user_id", "first_name", "last_name", "walletAddress", "isActive", 
        "isVerified", "role", "created_at", "updated_at") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        `admin-${Date.now()}`,
        'Admin',
        'User',
        walletAddress,
        true,
        true,
        'admin',
        now,
        now
      ]
    );

    console.log('Admin user created successfully');
    
    // Create wallet entry
    const walletId = uuidv4();
    
    await connection.query(
      `INSERT INTO "wallets" 
       ("id", "address", "chain", "user_id", "isActive", "created_at", "updated_at") 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        walletId,
        walletAddress,
        'ethereum',
        userId,
        true,
        now,
        now
      ]
    );

    console.log('Wallet created successfully');
    
    // Create profile if profile table exists
    try {
      const profileId = uuidv4();
      
      await connection.query(
        `INSERT INTO "profiles" 
         ("id", "user_id", "display_name", "bio", "created_at", "updated_at") 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          profileId,
          userId,
          'Admin User',
          'System Administrator',
          now,
          now
        ]
      );
      
      console.log('Profile created successfully');
    } catch (err) {
      console.log('Profile creation skipped or failed:', err.message);
    }

    console.log('Setup completed successfully');
    await connection.close();
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the main function
createAdminUser()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });