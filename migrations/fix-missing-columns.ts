import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixMissingColumns1715050152861 implements MigrationInterface {
    name = 'FixMissingColumns1715050152861';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if columns exist before adding them
        
        // Add missing columns to user_devices table
        const userDevicesTableExists = await queryRunner.hasTable('user_devices');
        if (userDevicesTableExists) {
            const hasCreatedAt = await queryRunner.hasColumn('user_devices', 'created_at');
            if (!hasCreatedAt) {
                await queryRunner.query('ALTER TABLE "public"."user_devices" ADD COLUMN "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            }
            
            const hasUpdatedAt = await queryRunner.hasColumn('user_devices', 'updated_at');
            if (!hasUpdatedAt) {
                await queryRunner.query('ALTER TABLE "public"."user_devices" ADD COLUMN "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            }
        }
        
        // Add missing columns to users table
        const usersTableExists = await queryRunner.hasTable('users');
        if (usersTableExists) {
            const hasVerificationToken = await queryRunner.hasColumn('users', 'verification_token');
            if (!hasVerificationToken) {
                await queryRunner.query('ALTER TABLE "public"."users" ADD COLUMN "verification_token" VARCHAR(255)');
            }
            
            const hasResetPasswordToken = await queryRunner.hasColumn('users', 'reset_password_token');
            if (!hasResetPasswordToken) {
                await queryRunner.query('ALTER TABLE "public"."users" ADD COLUMN "reset_password_token" VARCHAR(255)');
            }
            
            const hasResetPasswordExpires = await queryRunner.hasColumn('users', 'reset_password_expires');
            if (!hasResetPasswordExpires) {
                await queryRunner.query('ALTER TABLE "public"."users" ADD COLUMN "reset_password_expires" TIMESTAMP');
            }
        }
        
        // Add missing columns to wallets table
        const walletsTableExists = await queryRunner.hasTable('wallets');
        if (walletsTableExists) {
            const hasCreatedAt = await queryRunner.hasColumn('wallets', 'created_at');
            if (!hasCreatedAt) {
                await queryRunner.query('ALTER TABLE "public"."wallets" ADD COLUMN "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            }
            
            const hasUpdatedAt = await queryRunner.hasColumn('wallets', 'updated_at');
            if (!hasUpdatedAt) {
                await queryRunner.query('ALTER TABLE "public"."wallets" ADD COLUMN "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert changes if needed
        const userDevicesTableExists = await queryRunner.hasTable('user_devices');
        if (userDevicesTableExists) {
            await queryRunner.query('ALTER TABLE "public"."user_devices" DROP COLUMN IF EXISTS "created_at"');
            await queryRunner.query('ALTER TABLE "public"."user_devices" DROP COLUMN IF EXISTS "updated_at"');
        }
        
        const usersTableExists = await queryRunner.hasTable('users');
        if (usersTableExists) {
            await queryRunner.query('ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "verification_token"');
            await queryRunner.query('ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "reset_password_token"');
            await queryRunner.query('ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "reset_password_expires"');
        }
        
        const walletsTableExists = await queryRunner.hasTable('wallets');
        if (walletsTableExists) {
            await queryRunner.query('ALTER TABLE "public"."wallets" DROP COLUMN IF EXISTS "created_at"');
            await queryRunner.query('ALTER TABLE "public"."wallets" DROP COLUMN IF EXISTS "updated_at"');
        }
    }
}
