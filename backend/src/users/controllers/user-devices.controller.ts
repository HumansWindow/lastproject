import { Controller, Get, Post, Param, Delete, UseGuards, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserDevicesService } from '../services/user-devices.service';
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface';

@ApiTags('user-devices')
@Controller('user/devices')
export class UserDevicesController {
  private readonly logger = new Logger(UserDevicesController.name);
  
  constructor(private readonly userDevicesService: UserDevicesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all devices for the current user' })
  @ApiResponse({ status: 200, description: 'Returns all devices for the user' })
  async getUserDevices(@Req() req: RequestWithUser) {
    return this.userDevicesService.findByUserId(req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a device' })
  @ApiResponse({ status: 200, description: 'Device removed successfully' })
  async removeDevice(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.userDevicesService.delete(id);
  }

  @Post('reset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset device associations for the current user' })
  @ApiResponse({ status: 200, description: 'Device associations reset successfully' })
  async resetDevices(@Req() req: RequestWithUser) {
    return this.userDevicesService.resetDeviceAssociations(req.user.id);
  }
}
