import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Connection } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const connection = app.get(Connection);
  
  console.log('Starting user_sessions schema fix...');
  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Check if the table has both user_id and userId columns
    const columnsResult = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_sessions' AND table_schema = 'public'
    `);
    
    const columns = columnsResult.map(col => col.column_name);
    const hasUserId = columns.includes('user_id');
    const hasUserIdColumn = columns.includes('userId');
    
    console.log('Current columns in user_sessions table:', columns);

    if (hasUserId && !hasUserIdColumn) {
      // Need to add userId column that maps to user_id
      console.log('Adding userId column and copying data from user_id...');
      await queryRunner.query(`
        ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS "userId" uuid;
        UPDATE public.user_sessions SET "userId" = user_id;
        ALTER TABLE public.user_sessions ALTER COLUMN "userId" SET NOT NULL;
      `);
    } else if (!hasUserId && hasUserIdColumn) {
      // Need to add user_id column that maps to userId
      console.log('Adding user_id column and copying data from userId...');
      await queryRunner.query(`
        ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS user_id uuid;
        UPDATE public.user_sessions SET user_id = "userId";
        ALTER TABLE public.user_sessions ALTER COLUMN user_id SET NOT NULL;
      `);
    } else if (hasUserId && hasUserIdColumn) {
      // Ensure data is synced between them
      console.log('Syncing data between user_id and userId columns...');
      await queryRunner.query(`
        UPDATE public.user_sessions SET user_id = "userId" WHERE user_id IS NULL;
        UPDATE public.user_sessions SET "userId" = user_id WHERE "userId" IS NULL;
      `);
    } else {
      // Neither column exists, create both
      console.log('Creating both user_id and userId columns...');
      await queryRunner.query(`
        ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL;
        ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS "userId" uuid NOT NULL;
      `);
    }

    // Commit changes
    await queryRunner.commitTransaction();
    console.log('User sessions schema fixed successfully');
  } catch (err) {
    console.error('Error fixing user_sessions schema:', err);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
