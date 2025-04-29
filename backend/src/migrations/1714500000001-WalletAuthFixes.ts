import { MigrationInterface, QueryRunner } from 'typeorm';

export class WalletAuthFixes1714500000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure UUID extension is available
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Create unique constraint on wallet address
    await queryRunner.query(`
      ALTER TABLE "wallets" 
      ADD CONSTRAINT "UQ_wallet_address" 
      UNIQUE ("address");
    `);
    
    // Add additional index for case-insensitive wallet lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_wallet_address_lower" 
      ON "wallets" (LOWER("address"));
    `);
    
    // Update wallets table to add chain_id column for multi-chain support
    await queryRunner.query(`
      ALTER TABLE "wallets" 
      ADD COLUMN IF NOT EXISTS "chain_id" varchar DEFAULT '1';
    `);
    
    // Create a composite index on address and chain_id
    await queryRunner.query(`
      CREATE INDEX "IDX_wallet_address_chain_id" 
      ON "wallets" ("address", "chain_id");
    `);
    
    // Ensure proper foreign keys for wallet authentication
    await queryRunner.query(`
      ALTER TABLE "user_sessions" 
      ADD COLUMN IF NOT EXISTS "wallet_id" uuid,
      ADD CONSTRAINT "FK_user_sessions_wallet_id" 
      FOREIGN KEY ("wallet_id") REFERENCES "wallets" ("id") 
      ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove added constraints and indexes in reverse order
    await queryRunner.query(`
      ALTER TABLE "user_sessions" 
      DROP CONSTRAINT IF EXISTS "FK_user_sessions_wallet_id",
      DROP COLUMN IF EXISTS "wallet_id";
    `);
    
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wallet_address_chain_id"`);
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN IF EXISTS "chain_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wallet_address_lower"`);
    await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT IF EXISTS "UQ_wallet_address"`);
  }
}