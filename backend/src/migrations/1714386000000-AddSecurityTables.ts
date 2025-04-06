import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSecurityTables1714386000000 implements MigrationInterface {
  name = 'AddSecurityTables1714386000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add UserRole enum to users table
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM (
        'admin',
        'user',
        'moderator'
      )
    `);

    // Add role column to users table
    await queryRunner.query(`
      ALTER TABLE "users" ADD "role" "user_role_enum" NOT NULL DEFAULT 'user'
    `);

    // Add security columns to users table
    await queryRunner.query(`
      ALTER TABLE "users" ADD "lastLoginAt" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "users" ADD "lastLoginIp" varchar(255)
    `);

    // Create user_devices table
    await queryRunner.query(`
      CREATE TABLE "user_devices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "deviceId" varchar(255) NOT NULL,
        "deviceType" varchar(255) NOT NULL,
        "userAgent" varchar(255) NOT NULL,
        "name" varchar(255),
        "platform" varchar(255),
        "os" varchar(255),
        "osVersion" varchar(255),
        "browser" varchar(255),
        "browserVersion" varchar(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "visitCount" integer NOT NULL DEFAULT 0,
        "lastIpAddress" varchar(255),
        "geolocation" varchar(255),
        "firstSeenAt" TIMESTAMP NOT NULL DEFAULT now(),
        "lastSeenAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_devices" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_devices_userId" ON "user_devices" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_devices_deviceId" ON "user_devices" ("deviceId")
    `);

    // Create user_sessions table
    await queryRunner.query(`
      CREATE TABLE "user_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "deviceId" uuid,
        "token" varchar(255) NOT NULL,
        "ipAddress" varchar(255) NOT NULL,
        "userAgent" varchar(255),
        "expiresAt" TIMESTAMP,
        "isExpired" boolean NOT NULL DEFAULT false,
        "endedAt" TIMESTAMP,
        "duration" interval,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_sessions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_sessions_userId" ON "user_sessions" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_sessions_token" ON "user_sessions" ("token")
    `);

    // Foreign keys
    await queryRunner.query(`
      ALTER TABLE "user_devices" ADD CONSTRAINT "FK_user_devices_users" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_user_sessions_users" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_user_sessions_devices" 
      FOREIGN KEY ("deviceId") REFERENCES "user_devices"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop constraints
    await queryRunner.query(
      `ALTER TABLE "user_sessions" DROP CONSTRAINT IF EXISTS "FK_user_sessions_devices"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" DROP CONSTRAINT IF EXISTS "FK_user_sessions_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP CONSTRAINT IF EXISTS "FK_user_devices_users"`,
    );

    // Drop indices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_sessions_token"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_sessions_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_devices_deviceId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_devices_userId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "user_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_devices"`);

    // Drop security columns from users table
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lastLoginIp"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lastLoginAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "role"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
