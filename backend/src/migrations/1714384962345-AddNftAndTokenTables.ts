import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNftAndTokenTables1714384962345 implements MigrationInterface {
  name = 'AddNftAndTokenTables1714384962345';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create NFT table
    await queryRunner.query(`
      CREATE TABLE "nfts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tokenId" varchar(255) NOT NULL,
        "contractAddress" varchar(255) NOT NULL,
        "chainId" integer NOT NULL,
        "ownerId" uuid NOT NULL,
        "metadataUri" varchar(255),
        "metadata" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nfts" PRIMARY KEY ("id")
      )
    `);

    // Create TokenTransaction table with enum type
    await queryRunner.query(`
      CREATE TYPE "transaction_type_enum" AS ENUM (
        'mint', 
        'transfer', 
        'burn', 
        'airdrop', 
        'referral_reward'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "token_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "senderId" uuid NOT NULL,
        "receiverId" uuid,
        "amount" decimal(36,18) NOT NULL,
        "type" "transaction_type_enum" NOT NULL DEFAULT 'transfer',
        "transactionHash" varchar(255),
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_token_transactions" PRIMARY KEY ("id")
      )
    `);

    // Foreign keys for NFT
    await queryRunner.query(`
      ALTER TABLE "nfts" ADD CONSTRAINT "FK_nfts_owner" 
      FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Foreign keys for TokenTransaction
    await queryRunner.query(`
      ALTER TABLE "token_transactions" ADD CONSTRAINT "FK_token_transactions_sender" 
      FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "token_transactions" ADD CONSTRAINT "FK_token_transactions_receiver" 
      FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // Create indices for better performance
    await queryRunner.query(`CREATE INDEX "IDX_nfts_tokenId" ON "nfts" ("tokenId")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_nfts_contractAddress" ON "nfts" ("contractAddress")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_nfts_ownerId" ON "nfts" ("ownerId")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_token_transactions_senderId" ON "token_transactions" ("senderId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_token_transactions_receiverId" ON "token_transactions" ("receiverId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_token_transactions_type" ON "token_transactions" ("type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_token_transactions_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_token_transactions_receiverId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_token_transactions_senderId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_nfts_ownerId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_nfts_contractAddress"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_nfts_tokenId"`);

    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "token_transactions" DROP CONSTRAINT IF EXISTS "FK_token_transactions_receiver"`,
    );
    await queryRunner.query(
      `ALTER TABLE "token_transactions" DROP CONSTRAINT IF EXISTS "FK_token_transactions_sender"`,
    );
    await queryRunner.query(`ALTER TABLE "nfts" DROP CONSTRAINT IF EXISTS "FK_nfts_owner"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "token_transactions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transaction_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "nfts"`);
  }
}
