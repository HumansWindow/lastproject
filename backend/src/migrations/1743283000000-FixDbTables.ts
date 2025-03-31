import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDbTables1743283000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, check database schema to see if columns exist
    
    // Add user_agent column to user_sessions if it doesn't exist
    try {
      const userAgentExists = await queryRunner.hasColumn('user_sessions', 'user_agent');
      if (!userAgentExists) {
        console.log('Adding user_agent column to user_sessions table');
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "user_agent" TEXT NULL`);
      }
    } catch (error) {
      console.error('Error checking/adding user_agent column:', error);
    }
    
    // Fix the deviceId/device_id issue in user_devices table
    try {
      const deviceIdColExists = await queryRunner.hasColumn('user_devices', 'deviceId');
      const device_id_ColExists = await queryRunner.hasColumn('user_devices', 'device_id');
      
      if (deviceIdColExists && !device_id_ColExists) {
        // If only deviceId exists but not device_id, rename the column
        console.log('Renaming deviceId column to device_id in user_devices table');
        await queryRunner.query(`ALTER TABLE "user_devices" RENAME COLUMN "deviceId" TO "device_id"`);
      } else if (!deviceIdColExists && !device_id_ColExists) {
        // If neither column exists, add the device_id column
        console.log('Adding device_id column to user_devices table');
        await queryRunner.query(`ALTER TABLE "user_devices" ADD "device_id" VARCHAR(255) NOT NULL DEFAULT ''`);
      }
      
      // Create index on device_id column if needed
      const indexExists = await queryRunner.query(
        `SELECT indexname FROM pg_indexes WHERE tablename = 'user_devices' AND indexname = 'IDX_user_devices_device_id'`
      );
      
      if (!indexExists || indexExists.length === 0) {
        console.log('Creating index on device_id column');
        await queryRunner.query(
          `CREATE INDEX "IDX_user_devices_device_id" ON "user_devices" ("device_id")`
        );
      }
    } catch (error) {
      console.error('Error fixing device_id column:', error);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // We're not implementing down migration as it could result in data loss
    console.log('Down migration not implemented to prevent data loss');
  }
}