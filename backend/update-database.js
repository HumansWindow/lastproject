const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn('No .env file found, using default environment variables');
  dotenv.config();
}

async function main() {
  // Create a PostgreSQL client connection
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'Aliveadmin',
    password: process.env.DB_PASSWORD || 'new_password',
    database: process.env.DB_DATABASE || 'Alive-Db'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Direct check for users table to avoid issues with permissions
    const { rows: directTableCheck } = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
      );
    `);

    const usersTableExists = directTableCheck[0].exists;
    console.log(`Users table exists (direct check): ${usersTableExists}`);
    
    if (usersTableExists) {
      console.log('Checking users table structure...');
      
      // Check if users table has first_name and last_name columns
      const { rows: columnsResult } = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'users';
      `);
      
      const columns = columnsResult.map(col => col.column_name);
      console.log('Existing columns in users table:', columns);
      
      // Find id column info
      const idColumnInfo = columnsResult.find(col => col.column_name === 'id');
      const idColumnType = idColumnInfo ? idColumnInfo.data_type : null;
      console.log(`ID column type: ${idColumnType}`);
      
      // If id is integer, we need to migrate to UUID
      if (idColumnType === 'integer') {
        console.log('Need to convert from integer ID to UUID...');
        
        // Create backup table if it doesn't exist
        try {
          await client.query(`CREATE TABLE users_backup AS SELECT * FROM users;`);
          console.log('Created users_backup table');
        } catch (error) {
          if (error.code === '42P07') { // relation already exists
            console.log('users_backup table already exists, skipping creation');
          } else {
            throw error;
          }
        }
        
        try {
          // Drop foreign key constraints pointing to users table
          const { rows: constraintRows } = await client.query(`
            SELECT tc.constraint_name, tc.table_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.constraint_column_usage AS ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'users';
          `);
          
          for (const constraint of constraintRows) {
            await client.query(`
              ALTER TABLE "${constraint.table_name}" DROP CONSTRAINT "${constraint.constraint_name}";
            `);
            console.log(`Dropped foreign key constraint ${constraint.constraint_name} from ${constraint.table_name}`);
          }
          
          // Drop the users table
          await client.query(`DROP TABLE users CASCADE;`);
          console.log('Dropped original users table');
          
          // Create new users table with UUID
          await client.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            
            CREATE TABLE users (
              id UUID NOT NULL DEFAULT uuid_generate_v4(),
              email VARCHAR(255),
              password VARCHAR(255),
              first_name VARCHAR(255),
              last_name VARCHAR(255),
              avatar_url VARCHAR(255),
              "isActive" BOOLEAN NOT NULL DEFAULT true,
              "isVerified" BOOLEAN NOT NULL DEFAULT false,
              verification_token VARCHAR(255),
              reset_password_token VARCHAR(255),
              reset_password_expires TIMESTAMP,
              "referrerId" UUID,
              role TEXT NOT NULL DEFAULT 'user',
              last_login_at TIMESTAMP,
              last_login_ip VARCHAR(50),
              created_at TIMESTAMP NOT NULL DEFAULT now(),
              updated_at TIMESTAMP NOT NULL DEFAULT now(),
              "walletAddress" VARCHAR(255),
              CONSTRAINT PK_users PRIMARY KEY (id)
            );
            
            CREATE INDEX IDX_users_email ON users (email);
            CREATE INDEX IDX_users_wallet ON users ("walletAddress");
          `);
          
          console.log('Created new users table with UUID primary key');
          
          // Check if users_backup table exists
          const { rows: backupExists } = await client.query(`
            SELECT EXISTS (
              SELECT 1 FROM pg_tables 
              WHERE schemaname = 'public' 
              AND tablename = 'users_backup'
            );
          `);
          
          if (backupExists[0].exists) {
            // Copy data from backup - get the column names first
            const { rows: backupColumnsResult } = await client.query(`
              SELECT column_name
              FROM information_schema.columns
              WHERE table_name = 'users_backup';
            `);
            
            const backupColumns = backupColumnsResult.map(col => col.column_name);
            console.log('Columns in backup table:', backupColumns);
            
            // Build insertion query dynamically based on existing columns
            try {
              // Map the source columns to target columns
              const columnMappings = {
                email: 'email',
                password: 'password',
                wallet_address: 'walletAddress',
                role: 'role',
                last_login: 'last_login_at',
                last_ip: 'last_login_ip',
                created_at: 'created_at',
                updated_at: 'updated_at'
              };
              
              // Build the column parts of the query
              const targetColumns = [];
              const sourceColumns = [];
              
              Object.entries(columnMappings).forEach(([source, target]) => {
                if (backupColumns.includes(source)) {
                  targetColumns.push(`"${target}"`);
                  sourceColumns.push(`"${source}"`);
                }
              });
              
              // Only proceed if we have columns to migrate
              if (targetColumns.length > 0) {
                const insertQuery = `
                  INSERT INTO users (${targetColumns.join(', ')})
                  SELECT ${sourceColumns.join(', ')}
                  FROM users_backup;
                `;
                
                await client.query(insertQuery);
                console.log('Data migrated from backup to new users table');
              } else {
                console.log('No columns to migrate');
              }
            } catch (error) {
              console.error('Error migrating data:', error);
            }
          }
        } catch (error) {
          console.error('Error recreating users table:', error);
          // Try to continue with existing table
        }
      } else {
        // If the table has UUID id or another type, check/add missing columns
        const requiredColumns = [
          { name: 'first_name', type: 'VARCHAR(255)' },
          { name: 'last_name', type: 'VARCHAR(255)' },
          { name: 'avatar_url', type: 'VARCHAR(255)' },
          { name: 'verification_token', type: 'VARCHAR(255)' },
          { name: 'reset_password_token', type: 'VARCHAR(255)' },
          { name: 'reset_password_expires', type: 'TIMESTAMP' }
        ];
        
        for (const col of requiredColumns) {
          if (!columns.includes(col.name)) {
            try {
              await client.query(`ALTER TABLE users ADD COLUMN "${col.name}" ${col.type};`);
              console.log(`Added missing column ${col.name} to users table`);
            } catch (error) {
              console.error(`Error adding column ${col.name}:`, error.message);
            }
          }
        }
        
        // Check if walletAddress column needs to be renamed
        if (!columns.includes('walletAddress') && columns.includes('wallet_address')) {
          try {
            await client.query(`ALTER TABLE users RENAME COLUMN wallet_address TO "walletAddress";`);
            console.log('Renamed wallet_address to walletAddress');
          } catch (error) {
            console.error('Error renaming wallet_address column:', error.message);
          }
        } else if (!columns.includes('walletAddress') && !columns.includes('wallet_address')) {
          try {
            await client.query(`ALTER TABLE users ADD COLUMN "walletAddress" VARCHAR(255);`);
            console.log('Added missing walletAddress column');
          } catch (error) {
            console.error('Error adding walletAddress column:', error.message);
          }
        }
      }
    } else {
      // If users table doesn't exist, create it
      console.log('Users table does not exist, creating it...');
      try {
        await client.query(`
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          
          CREATE TABLE users (
            id UUID NOT NULL DEFAULT uuid_generate_v4(),
            email VARCHAR(255),
            password VARCHAR(255),
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            avatar_url VARCHAR(255),
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "isVerified" BOOLEAN NOT NULL DEFAULT false,
            verification_token VARCHAR(255),
            reset_password_token VARCHAR(255),
            reset_password_expires TIMESTAMP,
            "referrerId" UUID,
            role TEXT NOT NULL DEFAULT 'user',
            last_login_at TIMESTAMP,
            last_login_ip VARCHAR(50),
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now(),
            "walletAddress" VARCHAR(255),
            CONSTRAINT PK_users PRIMARY KEY (id)
          );
          
          CREATE INDEX IDX_users_email ON users (email);
          CREATE INDEX IDX_users_wallet ON users ("walletAddress");
        `);
        console.log('Created users table with proper structure');
      } catch (error) {
        if (error.code === '42P07') { // relation already exists
          console.log('Users table already exists (detected during creation attempt)');
          // In this case we should check and update the structure
          const { rows: columnsResult } = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users';
          `);
          
          const columns = columnsResult.map(col => col.column_name);
          console.log('Existing columns in users table:', columns);
          
          // Check for missing columns and add them
          const requiredColumns = [
            { name: 'first_name', type: 'VARCHAR(255)' },
            { name: 'last_name', type: 'VARCHAR(255)' },
            { name: 'avatar_url', type: 'VARCHAR(255)' }
          ];
          
          for (const col of requiredColumns) {
            if (!columns.includes(col.name)) {
              try {
                await client.query(`ALTER TABLE users ADD COLUMN "${col.name}" ${col.type};`);
                console.log(`Added missing column ${col.name} to users table`);
              } catch (error) {
                console.error(`Error adding column ${col.name}:`, error.message);
              }
            }
          }
        } else {
          throw error;
        }
      }
    }
    
    // Check and create wallets table if it doesn't exist
    const { rows: walletsTableCheck } = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'wallets'
      );
    `);
    
    const walletsTableExists = walletsTableCheck[0].exists;
    console.log(`Wallets table exists: ${walletsTableExists}`);
    
    if (!walletsTableExists) {
      try {
        await client.query(`
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          
          CREATE TABLE wallets (
            id UUID NOT NULL DEFAULT uuid_generate_v4(),
            address VARCHAR(255) NOT NULL,
            "privateKey" VARCHAR(255),
            chain VARCHAR(50) DEFAULT 'ETH',
            user_id UUID NOT NULL,
            "isActive" BOOLEAN DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT PK_wallets PRIMARY KEY (id)
          );
          
          CREATE INDEX IDX_wallets_address ON wallets (address);
          CREATE INDEX IDX_wallets_user_id ON wallets (user_id);
        `);
        
        console.log('Created wallets table');
        
        // Add foreign key if users table exists
        try {
          await client.query(`
            ALTER TABLE wallets 
            ADD CONSTRAINT FK_wallets_users 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
          `);
          console.log('Added foreign key constraint to wallets table');
        } catch (e) {
          console.error('Error adding foreign key. This may be expected if the users table has a different structure:', e.message);
        }
      } catch (error) {
        if (error.code === '42P07') { // relation already exists
          console.log('Wallets table already exists (detected during creation attempt)');
        } else {
          throw error;
        }
      }
    } else {
      // Check wallet table structure for the user_id column
      const { rows: walletsColumnsResult } = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'wallets';
      `);
      
      const walletsColumns = walletsColumnsResult.map(col => col.column_name);
      console.log('Existing columns in wallets table:', walletsColumns);
      
      // Fix user_id vs userId inconsistency
      if (!walletsColumns.includes('user_id') && walletsColumns.includes('userId')) {
        try {
          await client.query(`ALTER TABLE wallets RENAME COLUMN "userId" TO user_id;`);
          console.log('Renamed userId to user_id in wallets table');
        } catch (error) {
          console.error('Error renaming userId column:', error.message);
        }
      } else if (!walletsColumns.includes('user_id') && !walletsColumns.includes('userId')) {
        try {
          await client.query(`ALTER TABLE wallets ADD COLUMN user_id UUID;`);
          console.log('Added missing user_id column to wallets table');
        } catch (error) {
          console.error('Error adding user_id column:', error.message);
        }
      }
    }

    console.log('Database update completed successfully!');

  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

main();