const { Pool } = require('pg');
require('dotenv').config();

async function testWalletAuth() {
  console.log('Testing wallet authentication database schema...');
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'Alive-Db',
    user: process.env.DB_USER || 'Aliveadmin',
    password: process.env.DB_PASSWORD || 'alivehumans@2024',
  });

  try {
    const client = await pool.connect();
    console.log('✓ Connected to database');
    
    // Check if users table exists and has data
    const userResult = await client.query(`
      SELECT id, "walletAddress" FROM users 
      WHERE "walletAddress" IS NOT NULL 
      LIMIT 1
    `);
    
    if (userResult.rows.length === 0) {
      console.log('No users with wallet addresses found, creating test user...');
      
      // Create a test user with a wallet address
      const insertUserResult = await client.query(`
        INSERT INTO users (
          "isActive", "isVerified", role, "walletAddress", "created_at"
        ) VALUES (
          true, true, 'user', $1, NOW()
        ) RETURNING id, "walletAddress"
      `, ['0xTestWalletAddress123456789abcdef']);
      
      console.log('✓ Created test user:', insertUserResult.rows[0]);
      var userId = insertUserResult.rows[0].id;
    } else {
      console.log('✓ Found existing user:', userResult.rows[0]);
      var userId = userResult.rows[0].id;
    }
    
    // Generate a unique token string
    const tokenString = 'test-token-' + Date.now();
    
    // Try to create a test refresh token
    console.log('Creating test refresh token...');
    const tokenResult = await client.query(`
      INSERT INTO refresh_tokens (
        token, "expiresAt", "userId", "createdAt"
      ) VALUES (
        $1, NOW() + INTERVAL '7 days', $2, NOW()
      ) RETURNING id, token, "expiresAt"
    `, [tokenString, userId]);
    
    console.log('✓ Successfully created refresh token:', tokenResult.rows[0]);
    
    // Clean up
    console.log('Cleaning up test data...');
    await client.query('DELETE FROM refresh_tokens WHERE id = $1', [tokenResult.rows[0].id]);
    
    client.release();
    await pool.end();
    console.log('✓ Test completed successfully!');
    return true;
  } catch (error) {
    console.error('Error testing wallet auth:', error.message);
    return false;
  }
}

testWalletAuth()
  .then(success => {
    if (success) {
      console.log('✅ Wallet authentication schema is working properly!');
      process.exit(0);
    } else {
      console.log('❌ Wallet authentication schema test failed.');
      process.exit(1);
    }
  });
