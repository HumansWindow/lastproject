import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');

        // Log attempt to connect
        logger.log(
          `Attempting to connect to PostgreSQL with user: ${configService.get('DB_USERNAME')}`,
        );
        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'Aliveadmin'),
          password: configService.get('DB_PASSWORD', ''),
          database: configService.get('DB_NAME', 'Alive-Db'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') !== 'production',
          logging: configService.get('NODE_ENV') !== 'production',
          ssl:
            configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          poolSize: 10,
          migrationsRun: configService.get('NODE_ENV') === 'production',
          migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
          migrationsTableName: 'migration_table',
          cli: {
            migrationsDir: 'src/migrations',
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
