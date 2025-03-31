import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUserColumnsNames1743500000000 implements MigrationInterface {
  name = 'FixUserColumnsNames1743500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns exist before trying to rename them
    const hasFirstNameColumn = await this.columnExists(queryRunner, 'users', 'firstName');
    const hasLastNameColumn = await this.columnExists(queryRunner, 'users', 'lastName');
    const hasFirstNameUnderscoreColumn = await this.columnExists(queryRunner, 'users', 'first_name');
    const hasLastNameUnderscoreColumn = await this.columnExists(queryRunner, 'users', 'last_name');
    
    // If firstName exists but first_name doesn't, rename it
    if (hasFirstNameColumn && !hasFirstNameUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" RENAME COLUMN "firstName" TO "first_name"
      `);
      console.log('Renamed firstName to first_name');
    } 
    // If neither exists, add first_name
    else if (!hasFirstNameColumn && !hasFirstNameUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" ADD COLUMN "first_name" varchar(255)
      `);
      console.log('Added first_name column');
    }
    
    // If lastName exists but last_name doesn't, rename it
    if (hasLastNameColumn && !hasLastNameUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" RENAME COLUMN "lastName" TO "last_name"
      `);
      console.log('Renamed lastName to last_name');
    } 
    // If neither exists, add last_name
    else if (!hasLastNameColumn && !hasLastNameUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" ADD COLUMN "last_name" varchar(255)
      `);
      console.log('Added last_name column');
    }

    // Add other missing columns with underscore names if needed
    const hasAvatarUrlColumn = await this.columnExists(queryRunner, 'users', 'avatarUrl');
    const hasAvatarUrlUnderscoreColumn = await this.columnExists(queryRunner, 'users', 'avatar_url');
    
    if (hasAvatarUrlColumn && !hasAvatarUrlUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" RENAME COLUMN "avatarUrl" TO "avatar_url"
      `);
      console.log('Renamed avatarUrl to avatar_url');
    } else if (!hasAvatarUrlColumn && !hasAvatarUrlUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" ADD COLUMN "avatar_url" varchar(255)
      `);
      console.log('Added avatar_url column');
    }

    // Fix verification token column if needed
    const hasVerificationTokenColumn = await this.columnExists(queryRunner, 'users', 'verificationToken');
    const hasVerificationTokenUnderscoreColumn = await this.columnExists(queryRunner, 'users', 'verification_token');
    
    if (hasVerificationTokenColumn && !hasVerificationTokenUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" RENAME COLUMN "verificationToken" TO "verification_token"
      `);
      console.log('Renamed verificationToken to verification_token');
    } else if (!hasVerificationTokenColumn && !hasVerificationTokenUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" ADD COLUMN "verification_token" varchar(255)
      `);
      console.log('Added verification_token column');
    }

    // Fix reset password token column if needed
    const hasResetPasswordTokenColumn = await this.columnExists(queryRunner, 'users', 'resetPasswordToken');
    const hasResetPasswordTokenUnderscoreColumn = await this.columnExists(queryRunner, 'users', 'reset_password_token');
    
    if (hasResetPasswordTokenColumn && !hasResetPasswordTokenUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" RENAME COLUMN "resetPasswordToken" TO "reset_password_token"
      `);
      console.log('Renamed resetPasswordToken to reset_password_token');
    } else if (!hasResetPasswordTokenColumn && !hasResetPasswordTokenUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" ADD COLUMN "reset_password_token" varchar(255)
      `);
      console.log('Added reset_password_token column');
    }
    
    // Fix reset password expiration column if needed
    const hasResetPasswordExpiresColumn = await this.columnExists(queryRunner, 'users', 'resetPasswordExpires');
    const hasResetPasswordExpiresUnderscoreColumn = await this.columnExists(queryRunner, 'users', 'reset_password_expires');
    
    if (hasResetPasswordExpiresColumn && !hasResetPasswordExpiresUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" RENAME COLUMN "resetPasswordExpires" TO "reset_password_expires"
      `);
      console.log('Renamed resetPasswordExpires to reset_password_expires');
    } else if (!hasResetPasswordExpiresColumn && !hasResetPasswordExpiresUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" ADD COLUMN "reset_password_expires" TIMESTAMP
      `);
      console.log('Added reset_password_expires column');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert column name changes if needed
    const hasFirstNameUnderscoreColumn = await this.columnExists(queryRunner, 'users', 'first_name');
    const hasLastNameUnderscoreColumn = await this.columnExists(queryRunner, 'users', 'last_name');
    
    if (hasFirstNameUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" RENAME COLUMN "first_name" TO "firstName"
      `);
    }
    
    if (hasLastNameUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" RENAME COLUMN "last_name" TO "lastName"
      `);
    }
    
    // Revert other column name changes
    const hasAvatarUrlUnderscoreColumn = await this.columnExists(queryRunner, 'users', 'avatar_url');
    if (hasAvatarUrlUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" RENAME COLUMN "avatar_url" TO "avatarUrl"
      `);
    }
    
    const hasVerificationTokenUnderscoreColumn = await this.columnExists(queryRunner, 'users', 'verification_token');
    if (hasVerificationTokenUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" RENAME COLUMN "verification_token" TO "verificationToken"
      `);
    }
    
    const hasResetPasswordTokenUnderscoreColumn = await this.columnExists(queryRunner, 'users', 'reset_password_token');
    if (hasResetPasswordTokenUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" RENAME COLUMN "reset_password_token" TO "resetPasswordToken"
      `);
    }
    
    const hasResetPasswordExpiresUnderscoreColumn = await this.columnExists(queryRunner, 'users', 'reset_password_expires');
    if (hasResetPasswordExpiresUnderscoreColumn) {
      await queryRunner.query(`
        ALTER TABLE "users" RENAME COLUMN "reset_password_expires" TO "resetPasswordExpires"
      `);
    }
  }

  private async columnExists(
    queryRunner: QueryRunner,
    table: string,
    column: string,
  ): Promise<boolean> {
    try {
      const result = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table}' 
        AND column_name = '${column}'
      `);
      return result.length > 0;
    } catch (error) {
      console.error(`Error checking if column ${column} exists in ${table}:`, error);
      return false;
    }
  }
}