import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export const getCorsConfig = (configService: ConfigService): CorsOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS', '');

  let origins: RegExp | string | Array<RegExp | string>;
  if (nodeEnv === 'production') {
    origins = allowedOrigins
      ? allowedOrigins.split(',')
      : ['https://alivehuman.com', 'https://app.alivehuman.com'];
  } else {
    origins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8000',
      'http://localhost:8080',
    ];
  }

  return {
    origin: origins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders:
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Headers',
    exposedHeaders: 'X-Total-Count',
    maxAge: 86400,
  };
};
