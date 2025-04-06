import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebugLogger } from './shared/utils/debug-logger.util';
import { DiaryModule } from './diary/diary.module';
import { BatchModule } from './batch/batch.module';
// ...other imports

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'Aliveadmin'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_DATABASE', 'Alive-Db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('DB_SYNCHRONIZE', false),
      }),
    }),
    BatchModule,
    DiaryModule,
    // ...other imports
  ],
  providers: [
    {
      provide: 'APP_INITIALIZER',
      useFactory: (configService: ConfigService) => {
        // Initialize the debug logger with config service
        DebugLogger.setConfigService(configService);
        return {};
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
