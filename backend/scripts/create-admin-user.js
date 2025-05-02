// This script creates an admin user in the database
require('dotenv').config();
const { createConnection } = require('typeorm');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createAdminUser() {
  console.log('Admin User Creation Script\n');
  
  // Get username and password from command line
  const username = await prompt('Enter admin username (default: admin): ') || 'admin';
  const password = await prompt('Enter admin password (min 8 chars): ');
  
  if (!password || password.length < 8) {
    console.error('Error: Password must be at least 8 characters long');
    rl.close();
    process.exit(1);
  }
  
  // Get wallet address or generate one
  const useWallet = await prompt('Do you want to use an existing wallet address? (y/n): ');
  
  let walletAddress;
  if (useWallet.toLowerCase() === 'y') {
    walletAddress = await prompt('Enter wallet address (0x...): ');
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      console.error('Error: Invalid wallet address format');
      rl.close();
      process.exit(1);
    }
  } else {
    // Generate a random wallet address for testing purposes
    const privateKey = crypto.randomBytes(32);
    const ethUtil = require('ethereumjs-util');
    const publicKey = ethUtil.privateToPublic(privateKey);
    walletAddress = '0x' + ethUtil.publicToAddress(publicKey).toString('hex');
    console.log(`Generated wallet address: ${walletAddress}`);
  }
  
  console.log('Connecting to database...');
  
  try {
    // Use the correct database configuration for Alive-Db
    const connection = await createConnection({
      type: process.env.DB_TYPE || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'Aliveadmin',
      password: process.env.DB_PASSWORD || 'aliveHumans@2024',
      database: process.env.DB_DATABASE || 'Alive-Db',
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
      ssl: process.env.DB_SSL === 'true'
    });

    console.log('Connected to database successfully');

    // Check if username already exists
    const existingUsername = await connection.query(
      `SELECT * FROM "users" WHERE "username" = $1`,
      [username]
    );

    if (existingUsername && existingUsername.length > 0) {
      console.log(`User with username ${username} already exists`);
      await connection.close();
      rl.close();
      return;
    }
    
    // Check if wallet already exists
    const existingWallet = await connection.query(
      `SELECT * FROM "users" WHERE LOWER("walletAddress") = LOWER($1)`,
      [walletAddress]
    );

    if (existingWallet && existingWallet.length > 0) {
      console.log(`User with wallet address ${walletAddress} already exists`);
      await connection.close();
      rl.close();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create admin user
    const userId = uuidv4();
    const userIdSecondary = uuidv4(); // Generate a second UUID for user_id
    const now = new Date();
    const email = `${username}@alivehuman.com`;
    
    console.log('Creating admin user...');
    
    // First create the user record
    await connection.query(
      `INSERT INTO "users" 
       ("id", "user_id", "username", "first_name", "last_name", "walletAddress", "isActive", 
        "isVerified", "role", "created_at", "updated_at") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userId,
        userIdSecondary, // Use UUID instead of string
        username,
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
    
    // Create profile record with email and password
    const profileId = uuidv4();
      
    await connection.query(
      `INSERT INTO "profiles" 
       ("id", "user_id", "email", "password", "display_name", "bio", "created_at", "updated_at") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        profileId,
        userId,
        email,
        hashedPassword,  // Store password in the profile table
        'Admin User',
        'System Administrator',
        now,
        now
      ]
    );
      
    console.log('Profile created successfully');

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

    console.log('\n==== Admin User Created Successfully ====');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Wallet: ${walletAddress}`);
    console.log('Role: admin');
    console.log('==========================================\n');

    // Write admin credentials to a file
    const fs = require('fs');
    const path = require('path');
    const adminFilePath = path.join(process.cwd(), '..', 'admin', 'admin.txt');
    
    fs.writeFileSync(adminFilePath, 
      `Admin User Credentials\n` +
      `=====================\n` +
      `Username: ${username}\n` +
      `Email: ${email}\n` +
      `Password: ${password}\n` +
      `Wallet: ${walletAddress}\n` +
      `Role: admin\n` +
      `=====================\n` +
      `Created on: ${now.toISOString()}\n`
    );
    
    console.log(`Admin credentials written to ${adminFilePath}`);

    await connection.close();
    rl.close();
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    rl.close();
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