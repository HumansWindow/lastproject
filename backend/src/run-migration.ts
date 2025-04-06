import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppModule } from './app.module';
import { FixUserSessionsAndDevicesTables1743281500000 } from './migrations/1743281500000-FixUserSessionsAndDevicesTables';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(getDataSourceToken());

  try {
    const migration = new FixUserSessionsAndDevicesTables1743281500000();
    await migration.up(dataSource.manager.queryRunner);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();