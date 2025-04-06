import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1714384861234 implements MigrationInterface {
  name = 'InitialSchema1714384861234';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "password" varchar(255),
        "firstName" varchar(255),
        "lastName" varchar(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "isVerified" boolean NOT NULL DEFAULT false,
        "verificationToken" varchar(255),
        "verificationTokenExpires" TIMESTAMP,
        "resetPasswordToken" varchar(255),
        "resetPasswordExpires" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "referrerId" uuid,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Self-reference for referrer - changed to defer constraints to avoid issues with circular references
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "FK_users_referrer" 
      FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED
    `);

    // Wallets table
    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "address" varchar(255) NOT NULL,
        "chainId" integer NOT NULL,
        "userId" uuid NOT NULL,
        "isPrimary" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wallets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wallets_address_chainId" UNIQUE ("address", "chainId")
      )
    `);

    // Foreign key from wallets to users
    await queryRunner.query(`
      ALTER TABLE "wallets" ADD CONSTRAINT "FK_wallets_users" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Referral codes table
    await queryRunner.query(`
      CREATE TABLE "referral_codes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar(20) NOT NULL,
        "userId" uuid NOT NULL,
        "usageLimit" integer NOT NULL DEFAULT 100,
        "usageCount" integer NOT NULL DEFAULT 0,
        "expiresAt" TIMESTAMP,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_referral_codes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_referral_codes_code" UNIQUE ("code")
      )
    `);

    // Foreign key from referral codes to users
    await queryRunner.query(`
      ALTER TABLE "referral_codes" ADD CONSTRAINT "FK_referral_codes_users" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Create indices for better performance
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_wallets_address" ON "wallets" ("address")`);
    await queryRunner.query(`CREATE INDEX "IDX_wallets_userId" ON "wallets" ("userId")`);
    await queryRunner.query(`
      CREATE INDEX "IDX_referral_codes_userId" ON "referral_codes" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_referral_codes_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wallets_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wallets_address"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);

    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "referral_codes" DROP CONSTRAINT IF EXISTS "FK_referral_codes_users"`,
    );
    await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT IF EXISTS "FK_wallets_users"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_referrer"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "referral_codes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wallets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
