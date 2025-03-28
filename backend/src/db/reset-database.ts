import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from multiple possible locations
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '.env')
];

// Try to load from each path until successful
let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`Loaded environment from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('No .env file found. Will try to use environment variables directly.');
}

async function resetDatabase() {
  console.log('Starting database reset...');
  
  // Log database connection details without passwords
  console.log(`Database connection info:
    - Host: ${process.env.DATABASE_HOST || 'localhost'}
    - Port: ${process.env.DATABASE_PORT || '5432'}
    - Database: ${process.env.DATABASE_NAME}
    - User: ${process.env.DATABASE_USER}
    - Password: ${process.env.DATABASE_PASSWORD ? '[REDACTED]' : 'not provided'}
  `);

  // Validate required environment variables
  if (!process.env.DATABASE_USER || !process.env.DATABASE_PASSWORD || !process.env.DATABASE_NAME) {
    console.error('Missing required database environment variables.');
    console.error('Please make sure DATABASE_USER, DATABASE_PASSWORD, and DATABASE_NAME are set.');
    process.exit(1);
  }
  
  try {
    // Create a connection to the database
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      synchronize: false,
      logging: true
    });

    console.log('Connected to database');
    
    // Get all table names from the database (except migrations table)
    const tableNames = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name != 'migrations'
      AND table_name != 'typeorm_migrations'
    `);

    // Start a transaction
    await connection.query('BEGIN');
    
    try {
      // Disable foreign key checks
      await connection.query('SET CONSTRAINTS ALL DEFERRED');

      // Drop all tables in a single transaction
      console.log('Dropping tables...');
      
      for (const { table_name } of tableNames) {
        await connection.query(`TRUNCATE TABLE "${table_name}" CASCADE`);
        console.log(`Truncated table: ${table_name}`);
      }

      // Re-enable foreign key checks
      await connection.query('SET CONSTRAINTS ALL IMMEDIATE');
      
      // Commit the transaction
      await connection.query('COMMIT');
      console.log('Database reset successful!');
    } catch (error) {
      // If there's an error, rollback the transaction
      await connection.query('ROLLBACK');
      console.error('Error during database reset:', error);
      throw error;
    }

    // Close the connection
    await connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Database reset failed:', error);
    process.exit(1);
  }
}

// Run the reset function
resetDatabase()
  .then(() => {
    console.log('Database reset completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Database reset failed:', error);
    process.exit(1);
  });
