import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUserSessionsAndDevicesTables1743281500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if user_agent column exists in user_sessions table
    const userAgentColumnExists = await queryRunner.hasColumn('user_sessions', 'user_agent');
    if (!userAgentColumnExists) {
      await queryRunner.query(`
        ALTER TABLE "user_sessions" ADD COLUMN "user_agent" TEXT NULL;
      `);
      console.log('Added user_agent column to user_sessions table');
    }

    // Check if deviceId column exists and device_id doesn't exist in user_devices table
    // This is to handle a potential mismatch where the entity uses deviceId but DB has device_id
    const deviceIdColumnExists = await queryRunner.hasColumn('user_devices', 'deviceId');
    const device_idColumnExists = await queryRunner.hasColumn('user_devices', 'device_id');

    if (deviceIdColumnExists && !device_idColumnExists) {
      await queryRunner.query(`
        ALTER TABLE "user_devices" RENAME COLUMN "deviceId" TO "device_id";
      `);
      console.log('Renamed deviceId column to device_id in user_devices table');
    } else if (!device_idColumnExists) {
      await queryRunner.query(`
        ALTER TABLE "user_devices" ADD COLUMN "device_id" VARCHAR(255) NOT NULL DEFAULT '';
      `);
      console.log('Added device_id column to user_devices table');
    }

    // Add index on device_id if it doesn't exist
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_devices_device_id" ON "user_devices" ("device_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Careful with down migrations, don't remove columns that might have important data
    // This is a safer approach for down migrations
    
    // If needed, you could revert the changes, but it's risky to remove columns
    // especially in production, so this is left as a comment
    
    // await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_devices_device_id";`);
    // await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN IF EXISTS "user_agent";`);
    // If the column was renamed, you could rename it back
    // await queryRunner.query(`ALTER TABLE "user_devices" RENAME COLUMN "device_id" TO "deviceId";`);
  }
}