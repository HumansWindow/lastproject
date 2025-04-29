import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1714500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "first_name" varchar,
        "last_name" varchar,
        "avatar_url" varchar,
        "is_active" boolean DEFAULT true,
        "is_verified" boolean DEFAULT false,
        "role" varchar DEFAULT 'user',
        "referral_code_id" varchar,
        "referred_by_id" uuid,
        "referral_tier" integer DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "FK_users_referred_by" FOREIGN KEY ("referred_by_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "FK_users_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      );
    `);

    // Create wallets table
    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "address" varchar NOT NULL,
        "private_key" varchar,
        "chain" varchar DEFAULT 'ETH',
        "user_id" uuid NOT NULL,
        "is_active" boolean DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "FK_wallets_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);

    // Create profiles table
    await queryRunner.query(`
      CREATE TABLE "profiles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "email" varchar,
        "password" varchar,
        "first_name" varchar,
        "last_name" varchar,
        "display_name" varchar,
        "avatar_url" varchar,
        "bio" text,
        "unique_id" varchar UNIQUE,
        "visibility_level" varchar DEFAULT 'public',
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "FK_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);

    // Create user_devices table
    await queryRunner.query(`
      CREATE TABLE "user_devices" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "device_id" varchar(255) NOT NULL,
        "device_type" varchar(50) DEFAULT 'unknown',
        "name" varchar(255),
        "platform" varchar(100),
        "os_name" varchar(100),
        "os_version" varchar(100),
        "browser" varchar(100),
        "browser_version" varchar(100),
        "is_active" boolean DEFAULT true,
        "last_used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "FK_user_devices_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);

    // Create user_sessions table
    await queryRunner.query(`
      CREATE TABLE "user_sessions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "device_id" varchar(255),
        "token" varchar(500),
        "ip_address" varchar(100),
        "user_agent" text,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "is_active" boolean DEFAULT true,
        "endedAt" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "FK_user_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);

    // Create refresh_tokens table
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "token" varchar NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_wallet_address" ON "wallets" ("address");
      CREATE INDEX "IDX_wallet_user_id" ON "wallets" ("user_id");
      CREATE INDEX "IDX_profile_user_id" ON "profiles" ("user_id");
      CREATE INDEX "IDX_profile_email" ON "profiles" ("email");
      CREATE INDEX "IDX_profile_unique_id" ON "profiles" ("unique_id");
      CREATE INDEX "IDX_user_device_user_id" ON "user_devices" ("user_id");
      CREATE INDEX "IDX_user_device_device_id" ON "user_devices" ("device_id");
      CREATE INDEX "IDX_user_session_user_id" ON "user_sessions" ("user_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order to avoid foreign key constraint errors
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "user_sessions"`);
    await queryRunner.query(`DROP TABLE "user_devices"`);
    await queryRunner.query(`DROP TABLE "profiles"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}