import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixWalletUserIdInconsistency1743120000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if userId column exists before trying to rename it
    const hasUserIdColumn = await this.columnExists(queryRunner, 'wallets', 'userId');
    const hasUserIdUnderscoreColumn = await this.columnExists(queryRunner, 'wallets', 'user_id');
    
    // First, make sure we have only one constraint
    await queryRunner.query(`
      ALTER TABLE "wallets" 
      DROP CONSTRAINT IF EXISTS "FK_2ecdb33f23e9a6fc392025c0b97"
    `);
    
    await queryRunner.query(`
      ALTER TABLE "wallets" 
      DROP CONSTRAINT IF EXISTS "FK_92558c08091598f7a4439586cda"
    `);

    // Then make sure our column is properly set up
    if (hasUserIdColumn && !hasUserIdUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "wallets" 
        RENAME COLUMN "userId" TO "user_id" 
      `);
    }

    // Add the foreign key constraint with the correct name
    await queryRunner.query(`
      ALTER TABLE "wallets" 
      ADD CONSTRAINT "FK_wallets_user_id" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "wallets" 
      DROP CONSTRAINT IF EXISTS "FK_wallets_user_id"
    `);

    const hasUserIdUnderscoreColumn = await this.columnExists(queryRunner, 'wallets', 'user_id');
    const hasUserIdColumn = await this.columnExists(queryRunner, 'wallets', 'userId');
    
    if (hasUserIdUnderscoreColumn && !hasUserIdColumn) {
      await queryRunner.query(`
        ALTER TABLE "wallets" 
        RENAME COLUMN "user_id" TO "userId"
      `);
    }

    await queryRunner.query(`
      ALTER TABLE "wallets" 
      ADD CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97" 
      FOREIGN KEY ("userId") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);
  }

  private async columnExists(queryRunner: QueryRunner, table: string, column: string): Promise<boolean> {
    const query = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${table}' AND column_name = '${column}'
    `;
    const result = await queryRunner.query(query);
    return result && result.length > 0;
  }
}
