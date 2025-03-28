import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';

/**
 * Reset database script - cleans up users and related tables
 * Run with: npx ts-node src/scripts/reset-db.ts
 */
async function resetDatabase() {
  console.log('Starting database reset...');
  
  // Load environment variables
  dotenv.config();
  
  try {
    // Create a connection to the database
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USERNAME || 'Aliveadmin',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'Alive-Db',
    });
    
    console.log('Connected to database. Starting cleanup...');
    
    // Clean up all related tables in the correct order
    await connection.query('DELETE FROM user_sessions');
    console.log('✓ Deleted user_sessions');
    
    await connection.query('DELETE FROM user_devices');
    console.log('✓ Deleted user_devices');
    
    await connection.query('DELETE FROM refresh_tokens');
    console.log('✓ Deleted refresh_tokens');
    
    await connection.query('DELETE FROM wallets');
    console.log('✓ Deleted wallets');
    
    await connection.query('DELETE FROM referral_codes');
    console.log('✓ Deleted referral_codes');
    
    await connection.query('DELETE FROM users');
    console.log('✓ Deleted users');
    
    console.log('Database reset completed successfully!');
    
    // Close connection
    await connection.close();
  } catch (error) {
    console.error('Error resetting database:', error);
  }
}

// Run the reset function
resetDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to reset database:', error);
    process.exit(1);
  });
