import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { join } from 'path';

// Load environment variables from multiple possible locations
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '.env')
];

// Try to load from each path until successful
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`Loaded environment from: ${envPath}`);
    break;
  }
}

async function initializeSchema() {
  console.log('Starting database schema initialization...');

  try {
    // Create a connection to the database with synchronize enabled
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
      synchronize: true, // This will create tables based on your entities
      logging: true
    });

    console.log('Connected to database and schema synchronized');

    // Create basic admin user if needed
    const userTable = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user'
    `);

    if (userTable && userTable.length > 0) {
      console.log('Creating default admin user...');
      // Add code here to create a default admin user if needed
    }

    // Close the connection
    await connection.close();
    console.log('Database connection closed');
    
    return true;
  } catch (error) {
    console.error('Database schema initialization failed:', error);
    return false;
  }
}

// Run the initialization function
initializeSchema()
  .then(success => {
    if (success) {
      console.log('Database schema initialized successfully');
      process.exit(0);
    } else {
      console.error('Failed to initialize database schema');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error during initialization:', error);
    process.exit(1);
  });
