import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import * as os from 'os';
import * as process from 'process';

@ApiTags('admin/system')
@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SystemMonitoringController {
  private startTime = Date.now();

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'Returns system health metrics' })
  async getHealthStatus() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      status: 'ok',
      uptime: this.getUptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usedProcess: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        }
      },
      cpu: {
        load: os.loadavg(),
        cores: os.cpus().length,
        usage: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      },
      platform: {
        type: os.type(),
        release: os.release(),
        platform: os.platform(),
        arch: os.arch()
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'Returns detailed system metrics' })
  async getMetrics() {
    // This would typically connect to a metrics collection system like Prometheus
    // For now, returning basic system metrics
    return {
      activeConnections: Math.floor(Math.random() * 100), // Placeholder
      requestsPerMinute: Math.floor(Math.random() * 500), // Placeholder
      averageResponseTime: Math.random() * 100, // Placeholder in ms
      errorRate: Math.random() * 0.05, // Placeholder (0-5%)
      timestamp: new Date().toISOString()
    };
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get recent system logs' })
  @ApiResponse({ status: 200, description: 'Returns recent system logs' })
  async getSystemLogs() {
    // This would typically connect to your logging system
    // For now, returning placeholder data
    return {
      logs: [],
      total: 0
    };
  }

  private getUptime(): string {
    const uptimeMs = Date.now() - this.startTime;
    const uptimeSec = Math.floor(uptimeMs / 1000);
    const days = Math.floor(uptimeSec / (24 * 60 * 60));
    const hours = Math.floor((uptimeSec % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptimeSec % (60 * 60)) / 60);
    const seconds = Math.floor(uptimeSec % 60);
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
}