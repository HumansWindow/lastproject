import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebugLogger } from './shared/utils/debug-logger.util';
// ...other imports

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
