import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixColumnInconsistencies1743400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing foreign key constraints on wallets table
    await this.dropConstraintsIfExist(queryRunner, 'wallets', [
      'FK_2ecdb33f23e9a6fc392025c0b97',
      'FK_92558c08091598f7a4439586cda',
      'FK_wallets_user_id'
    ]);
    
    // Check if duplicate columns exist and fix them
    const hasUserId = await this.columnExists(queryRunner, 'wallets', 'userId');
    const hasUserIdUnderscore = await this.columnExists(queryRunner, 'wallets', 'user_id');
    
    // Fix wallets table - ensure consistent user_id column
    if (hasUserId && hasUserIdUnderscore) {
      // Drop duplicate userId column if both exist
      await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "userId"`);
    } else if (hasUserId && !hasUserIdUnderscore) {
      // Rename userId to user_id for consistency
      await queryRunner.query(`ALTER TABLE "wallets" RENAME COLUMN "userId" TO "user_id"`);
    } else if (!hasUserId && !hasUserIdUnderscore) {
      // Create user_id column if neither exists
      await queryRunner.query(`ALTER TABLE "wallets" ADD "user_id" uuid`);
    }
    
    // Add proper foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "wallets" 
      ADD CONSTRAINT "FK_wallets_user_id" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the constraints added in the up method
    await this.dropConstraintsIfExist(queryRunner, 'wallets', ['FK_wallets_user_id']);
    
    // Re-add the original constraints (simplified for rollback)
    await queryRunner.query(`
      ALTER TABLE "wallets" 
      ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);
  }

  // Helper to check if column exists
  private async columnExists(queryRunner: QueryRunner, table: string, column: string): Promise<boolean> {
    const query = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${table}' AND column_name = '${column}'
    `;
    const result = await queryRunner.query(query);
    return result && result.length > 0;
  }
  
  // Helper to drop constraints if they exist
  private async dropConstraintsIfExist(queryRunner: QueryRunner, table: string, constraintNames: string[]): Promise<void> {
    for (const constraintName of constraintNames) {
      try {
        await queryRunner.query(`
          ALTER TABLE "${table}" 
          DROP CONSTRAINT IF EXISTS "${constraintName}"
        `);
      } catch (error) {
        // Ignore errors if constraint doesn't exist
      }
    }
  }
}
