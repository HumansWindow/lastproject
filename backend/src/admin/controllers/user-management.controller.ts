import { Controller, Get, Param, Patch, Body, Query, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserManagementService } from '../services/user-management.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('admin/users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns a list of users' })
  async getUsers(@Query() query: any) {
    return this.userManagementService.getUsers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific user by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns user details' })
  async getUser(@Param('id') id: string) {
    return this.userManagementService.getUser(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status (admin only)' })
  @ApiResponse({ status: 200, description: 'User status updated' })
  async updateUserStatus(@Param('id') id: string, @Body() statusDto: any) {
    return this.userManagementService.updateUserStatus(id, statusDto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get user sessions (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns user sessions' })
  async getUserSessions(@Query() query: any) {
    return this.userManagementService.getUserSessions(query);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Terminate user session (admin only)' })
  @ApiResponse({ status: 200, description: 'Session terminated' })
  async terminateSession(@Param('id') id: string) {
    return this.userManagementService.terminateSession(id);
  }
}