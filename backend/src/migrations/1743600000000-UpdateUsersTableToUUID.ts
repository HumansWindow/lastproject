import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUsersTableToUUID1743600000000 implements MigrationInterface {
  name = 'UpdateUsersTableToUUID1743600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // Check if the users table exists
      const tableExists = await this.tableExists(queryRunner, 'users');
      if (!tableExists) {
        console.log('Users table does not exist, creating it with UUID primary key');
        // Create users table with UUID primary key
        await queryRunner.query(`
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          
          CREATE TABLE "users" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "email" varchar(255),
            "password" varchar(255),
            "first_name" varchar(255),
            "last_name" varchar(255),
            "avatar_url" varchar(255),
            "isActive" boolean NOT NULL DEFAULT true,
            "isVerified" boolean NOT NULL DEFAULT false,
            "verification_token" varchar(255),
            "reset_password_token" varchar(255),
            "reset_password_expires" TIMESTAMP,
            "referrerId" uuid,
            "role" text NOT NULL DEFAULT 'user',
            "last_login_at" TIMESTAMP,
            "last_login_ip" varchar(50),
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "walletAddress" varchar(255),
            CONSTRAINT "PK_users" PRIMARY KEY ("id"),
            CONSTRAINT "UQ_users_email" UNIQUE ("email"),
            CONSTRAINT "UQ_users_walletAddress" UNIQUE ("walletAddress")
          );
          
          CREATE INDEX "IDX_users_email" ON "users" ("email");
        `);
      } else {
        console.log('Users table exists, checking structure');

        // Check if the id column is integer or uuid
        const idColumnType = await queryRunner.query(`
          SELECT data_type FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'id';
        `);

        if (idColumnType.length > 0 && idColumnType[0].data_type === 'integer') {
          console.log('Migrating users table from integer ID to UUID...');
          
          // Backup the current users table
          await queryRunner.query(`CREATE TABLE "users_backup" AS SELECT * FROM "users";`);
          console.log('Created users_backup table');
          
          // Drop the current users table
          await queryRunner.query(`DROP TABLE "users";`);
          console.log('Dropped original users table');
          
          // Create the new users table with UUID
          await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            
            CREATE TABLE "users" (
              "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
              "email" varchar(255),
              "password" varchar(255),
              "first_name" varchar(255),
              "last_name" varchar(255),
              "avatar_url" varchar(255),
              "isActive" boolean NOT NULL DEFAULT true,
              "isVerified" boolean NOT NULL DEFAULT false,
              "verification_token" varchar(255),
              "reset_password_token" varchar(255),
              "reset_password_expires" TIMESTAMP,
              "referrerId" uuid,
              "role" text NOT NULL DEFAULT 'user',
              "last_login_at" TIMESTAMP,
              "last_login_ip" varchar(50),
              "created_at" TIMESTAMP NOT NULL DEFAULT now(),
              "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
              "walletAddress" varchar(255),
              CONSTRAINT "PK_users" PRIMARY KEY ("id"),
              CONSTRAINT "UQ_users_email" UNIQUE ("email"),
              CONSTRAINT "UQ_users_walletAddress" UNIQUE ("walletAddress")
            );
            
            CREATE INDEX "IDX_users_email" ON "users" ("email");
          `);
          
          console.log('Created new users table with UUID primary key');
          
          // Check which columns exist in backup table
          const backupColumns = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users_backup';
          `);
          
          const columnNames = backupColumns.map(col => col.column_name);
          
          // Transfer data from backup to new table
          const emailField = columnNames.includes('email') ? 'email' : 'null';
          const passwordField = columnNames.includes('password') ? 'password' : 'null';
          const walletAddressField = columnNames.includes('wallet_address') ? 'wallet_address' : 
                                   (columnNames.includes('walletaddress') ? 'walletaddress' : 'null');
          const roleField = columnNames.includes('role') ? 'role' : 
                          (columnNames.includes('user_role') ? 'user_role' : "'user'");
          const lastLoginField = columnNames.includes('last_login') ? 'last_login' : 
                               (columnNames.includes('last_login_at') ? 'last_login_at' : 'null');
          const lastIpField = columnNames.includes('last_ip') ? 'last_ip' : 
                            (columnNames.includes('last_login_ip') ? 'last_login_ip' : 'null');
          const createdAtField = columnNames.includes('created_at') ? 'created_at' : 'now()';
          const updatedAtField = columnNames.includes('updated_at') ? 'updated_at' : 'now()';
          
          // Insert data, mapping the columns
          await queryRunner.query(`
            INSERT INTO "users" 
            ("email", "password", "walletAddress", "role", "last_login_at", "last_login_ip", "created_at", "updated_at") 
            SELECT 
              ${emailField}, 
              ${passwordField}, 
              ${walletAddressField}, 
              ${roleField},
              ${lastLoginField},
              ${lastIpField},
              ${createdAtField}, 
              ${updatedAtField}
            FROM "users_backup";
          `);
          
          console.log('Data transferred from backup to new users table');
        } else {
          console.log('Users table already has UUID primary key, checking for missing columns');
          
          // Check for missing columns and add them if needed
          const columnsToCheck = [
            { name: 'first_name', type: 'varchar(255)', nullable: true },
            { name: 'last_name', type: 'varchar(255)', nullable: true },
            { name: 'avatar_url', type: 'varchar(255)', nullable: true },
            { name: 'isActive', type: 'boolean', default: 'true', nullable: false },
            { name: 'isVerified', type: 'boolean', default: 'false', nullable: false },
            { name: 'verification_token', type: 'varchar(255)', nullable: true },
            { name: 'reset_password_token', type: 'varchar(255)', nullable: true },
            { name: 'reset_password_expires', type: 'TIMESTAMP', nullable: true },
            { name: 'referrerId', type: 'uuid', nullable: true },
          ];
          
          for (const column of columnsToCheck) {
            const columnExists = await this.columnExists(queryRunner, 'users', column.name);
            if (!columnExists) {
              let query = `ALTER TABLE "users" ADD COLUMN "${column.name}" ${column.type}`;
              if (!column.nullable) {
                query += ` NOT NULL DEFAULT ${column.default}`;
              }
              await queryRunner.query(query);
              console.log(`Added missing column ${column.name} to users table`);
            }
          }
          
          // Check if walletAddress column needs to be renamed from wallet_address
          const walletAddressExists = await this.columnExists(queryRunner, 'users', 'walletAddress');
          const wallet_addressExists = await this.columnExists(queryRunner, 'users', 'wallet_address');
          
          if (!walletAddressExists && wallet_addressExists) {
            await queryRunner.query(`
              ALTER TABLE "users" RENAME COLUMN "wallet_address" TO "walletAddress"
            `);
            console.log('Renamed wallet_address column to walletAddress');
          } else if (!walletAddressExists && !wallet_addressExists) {
            await queryRunner.query(`
              ALTER TABLE "users" ADD COLUMN "walletAddress" varchar(255)
            `);
            console.log('Added missing walletAddress column');
          }
        }
      }
      
      // Create related tables if they don't exist
      const walletsTableExists = await this.tableExists(queryRunner, 'wallets');
      if (!walletsTableExists) {
        console.log('Creating wallets table');
        await queryRunner.query(`
          CREATE TABLE "wallets" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "address" varchar(255) NOT NULL,
            "privateKey" varchar(255),
            "chain" varchar(50) DEFAULT 'ETH',
            "user_id" uuid NOT NULL,
            "isActive" boolean DEFAULT true,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_wallets" PRIMARY KEY ("id")
          );
          
          CREATE INDEX "IDX_wallets_address" ON "wallets" ("address");
          CREATE INDEX "IDX_wallets_user_id" ON "wallets" ("user_id");
          
          ALTER TABLE "wallets" ADD CONSTRAINT "FK_wallets_users" 
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        `);
      }
      
      console.log('Database migration completed successfully');

    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is risky as it would delete the users table, so we won't implement it
    console.log('Down migration not implemented for safety reasons');
  }
  
  private async tableExists(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      );
    `);
    return result[0].exists;
  }
  
  private async columnExists(
    queryRunner: QueryRunner,
    table: string,
    column: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${table}' 
      AND column_name = '${column}'
    `);
    return result.length > 0;
  }
}