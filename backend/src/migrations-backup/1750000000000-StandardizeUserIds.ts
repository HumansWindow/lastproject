import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to standardize user ID fields across all tables
 * - Ensure all tables use UUID for user ID foreign keys
 * - Ensure consistent column naming (user_id) in database
 * - Fix any inconsistent foreign key constraints
 */
export class StandardizeUserIds1750000000000 implements MigrationInterface {
  name = 'StandardizeUserIds1750000000000';

  /**
   * Check if a table exists
   */
  private async tableExists(queryRunner: QueryRunner, table: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [table]);
    return result[0].exists;
  }

  /**
   * Check if a column exists in a table
   */
  private async columnExists(queryRunner: QueryRunner, table: string, column: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      )
    `, [table, column]);
    return result[0].exists;
  }

  /**
   * Get column data type
   */
  private async getColumnType(queryRunner: QueryRunner, table: string, column: string): Promise<string> {
    const result = await queryRunner.query(`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = $1 AND column_name = $2
    `, [table, column]);
    
    return result.length ? result[0].data_type : null;
  }

  /**
   * Check if a constraint exists
   */
  private async constraintExists(queryRunner: QueryRunner, constraintName: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM pg_constraint
        WHERE conname = $1
      )
    `, [constraintName]);
    return result[0].exists;
  }

  /**
   * Drop constraints if they exist
   */
  private async dropConstraintsIfExist(queryRunner: QueryRunner, table: string, constraints: string[]): Promise<void> {
    for (const constraint of constraints) {
      const exists = await this.constraintExists(queryRunner, constraint);
      if (exists) {
        await queryRunner.query(`ALTER TABLE "${table}" DROP CONSTRAINT "${constraint}"`);
        console.log(`Dropped constraint ${constraint} from ${table}`);
      }
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting user ID standardization migration...');

    // Fix diaries table first (using integer user_id)
    const diariesExists = await this.tableExists(queryRunner, 'diaries');
    if (diariesExists) {
      console.log('Processing diaries table...');
      
      // Check if userId column exists 
      const hasUserIdColumn = await this.columnExists(queryRunner, 'diaries', 'userId');
      const hasUserIdUnderscoreColumn = await this.columnExists(queryRunner, 'diaries', 'user_id');
      
      // Get the column type of either column
      const userIdColumnType = hasUserIdColumn 
        ? await this.getColumnType(queryRunner, 'diaries', 'userId')
        : hasUserIdUnderscoreColumn 
          ? await this.getColumnType(queryRunner, 'diaries', 'user_id') 
          : null;
      
      // Drop constraints first
      await this.dropConstraintsIfExist(queryRunner, 'diaries', ['fk_user']);
      
      if (hasUserIdColumn) {
        // If userId column exists, rename it to user_id for consistency
        if (!hasUserIdUnderscoreColumn) {
          await queryRunner.query(`ALTER TABLE "diaries" RENAME COLUMN "userId" TO "user_id"`);
          console.log('Renamed diaries.userId to user_id');
        } else {
          // If both columns exist, keep user_id and drop userId
          await queryRunner.query(`ALTER TABLE "diaries" DROP COLUMN "userId"`);
          console.log('Dropped duplicate diaries.userId column');
        }
      }
      
      // Check if user_id column is not UUID
      if (userIdColumnType === 'integer') {
        console.log('Converting diaries.user_id from integer to UUID...');
        
        // Create temporary column
        await queryRunner.query(`ALTER TABLE "diaries" ADD COLUMN "user_id_uuid" uuid NULL`);
        
        // Update the UUID column based on integer IDs in users table
        await queryRunner.query(`
          UPDATE "diaries" d
          SET "user_id_uuid" = u.id
          FROM "users" u
          WHERE d.user_id::text = u.id::text
        `);
        
        // Drop original column and rename
        await queryRunner.query(`ALTER TABLE "diaries" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "diaries" RENAME COLUMN "user_id_uuid" TO "user_id"`);
        
        // Create foreign key constraint
        await queryRunner.query(`
          ALTER TABLE "diaries" 
          ADD CONSTRAINT "FK_diaries_users" 
          FOREIGN KEY ("user_id") 
          REFERENCES "users"("id") 
          ON DELETE CASCADE
        `);
        
        // Create index
        await queryRunner.query(`CREATE INDEX "IDX_diaries_user_id" ON "diaries" ("user_id")`);
      }
    }
    
    // Fix minting_queue_items table (may be using integer user_id)
    const mintingQueueExists = await this.tableExists(queryRunner, 'minting_queue_items');
    if (mintingQueueExists) {
      console.log('Processing minting_queue_items table...');
      
      // Check user_id column type
      const userIdColumnType = await this.getColumnType(queryRunner, 'minting_queue_items', 'user_id');
      
      // Drop existing constraints
      await this.dropConstraintsIfExist(queryRunner, 'minting_queue_items', ['minting_queue_items_user_id_fkey']);
      
      if (userIdColumnType === 'integer') {
        console.log('Converting minting_queue_items.user_id from integer to UUID...');
        
        // Create temporary column
        await queryRunner.query(`ALTER TABLE "minting_queue_items" ADD COLUMN "user_id_uuid" uuid NULL`);
        
        // Update the UUID column based on integer IDs in users table
        await queryRunner.query(`
          UPDATE "minting_queue_items" m
          SET "user_id_uuid" = u.id
          FROM "users" u
          WHERE m.user_id::text = u.id::text
        `);
        
        // Drop original column and rename
        await queryRunner.query(`ALTER TABLE "minting_queue_items" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "minting_queue_items" RENAME COLUMN "user_id_uuid" TO "user_id"`);
        
        // Create foreign key constraint
        await queryRunner.query(`
          ALTER TABLE "minting_queue_items" 
          ADD CONSTRAINT "FK_minting_queue_items_users" 
          FOREIGN KEY ("user_id") 
          REFERENCES "users"("id") 
          ON DELETE CASCADE
        `);
        
        // Recreate index
        await queryRunner.query(`CREATE INDEX "idx_minting_queue_user_id" ON "public"."minting_queue_items"("user_id")`);
      }
    }
    
    // Fix any remaining tables with userId column instead of user_id
    const tablesToCheck = [
      'wallets',
      'user_devices',
      'user_sessions',
      'refresh_tokens',
      'referral_codes',
      'staking_positions',
      'minting_records',
      'accounts'
    ];
    
    for (const table of tablesToCheck) {
      if (await this.tableExists(queryRunner, table)) {
        console.log(`Checking ${table} table...`);
        
        const hasUserIdColumn = await this.columnExists(queryRunner, table, 'userId');
        const hasUserIdUnderscoreColumn = await this.columnExists(queryRunner, table, 'user_id');
        
        if (hasUserIdColumn) {
          // Drop constraints that might prevent column renaming
          await this.dropConstraintsIfExist(queryRunner, table, [
            `FK_${table}_users`, 
            `FK_${table}_user_id`,
            `FK_${table}_userId`
          ]);
          
          if (!hasUserIdUnderscoreColumn) {
            // Rename column for consistency
            await queryRunner.query(`ALTER TABLE "${table}" RENAME COLUMN "userId" TO "user_id"`);
            console.log(`Renamed ${table}.userId to user_id`);
            
            // Create index if it doesn't exist
            await queryRunner.query(`
              CREATE INDEX IF NOT EXISTS "IDX_${table}_user_id" ON "${table}" ("user_id")
            `);
            
            // Re-create foreign key constraint
            await queryRunner.query(`
              ALTER TABLE "${table}" 
              ADD CONSTRAINT "FK_${table}_users" 
              FOREIGN KEY ("user_id") 
              REFERENCES "users"("id") 
              ON DELETE CASCADE
            `);
          } else {
            // If both columns exist, drop the redundant userId column
            await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "userId"`);
            console.log(`Dropped duplicate ${table}.userId column`);
          }
        }
      }
    }
    
    console.log('User ID standardization migration completed successfully.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No rollback provided as this is a standardization migration
    // and reverting would decrease consistency
    console.log('This migration cannot be reverted due to its standardization nature.');
  }
}