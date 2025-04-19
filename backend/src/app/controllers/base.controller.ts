import { Controller, Get, Post, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('base')
@Controller()
export class BaseController {
  private readonly logger = new Logger(BaseController.name);

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is running' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'AliveHuman API',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint for monitoring' })
  @ApiResponse({ status: 200, description: 'API is running' })
  healthMonitoring() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'AliveHuman API',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    };
  }

  @Get('auth/wallet/health')
  @ApiOperation({ summary: 'Wallet authentication health check' })
  @ApiResponse({ status: 200, description: 'Wallet authentication system is available' })
  walletAuthHealth() {
    this.logger.log('Wallet authentication health check called');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Wallet Authentication',
      ready: true
    };
  }

  @Post('auth/wallet/debug')
  @ApiOperation({ summary: 'Debug wallet authentication' })
  @ApiResponse({ status: 200, description: 'Debugging information' })
  async debugWalletAuth(@Body() data: any) {
    try {
      this.logger.log(`Wallet debug request received: ${JSON.stringify(data)}`);
      
      // Check database connection
      const dbStatus = process.env.DATABASE_URL ? 'configured' : 'not configured';
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        receivedData: data,
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus,
        walletAuthEndpoint: '/auth/wallet/authenticate',
        apiBaseUrl: process.env.API_URL || 'http://localhost:3001'
      };
    } catch (error) {
      this.logger.error(`Error in wallet debug endpoint: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error processing wallet debug request',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
