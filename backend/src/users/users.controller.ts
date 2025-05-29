import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';
import { User } from './entities/user.entity';

// Define request user type to avoid TypeScript errors
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve all users' })
  @ApiResponse({ status: 200, description: 'List of users returned.' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return the user profile' })
  async getProfile(@Req() req: RequestWithUser) {
    try {
      return await this.usersService.findOne(req.user.id);
    } catch (error) {
      // Properly handle the error by checking its type and providing useful information
      if (error?.message?.includes('not found')) {
        throw new NotFoundException(`User profile with ID ${req.user.id} not found`);
      }
      // Re-throw the original error to preserve the stack trace and error information
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific user' })
  @ApiResponse({ status: 200, description: 'Return the user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    // Only admins can view other users
    if (id !== req.user.id && !req.user.isAdmin) {
      throw new ForbiddenException('You can only access your own profile');
    }

    const user = await this.usersService.findOne(id);
    // No need to manually exclude password as it's now in the Profile entity
    return user;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    if (id !== req.user.id && !req.user.isAdmin) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Add this new endpoint (REMOVE IN PRODUCTION - FOR DEVELOPMENT ONLY)
  @Get('debug/wallet-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async findWalletUsers() {
    const users = await this.usersService.findWalletUsers();
    
    // Remove sensitive information
    return users.map(user => ({
      id: user.id,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      deviceCount: user.devices?.length || 0,
      sessionCount: user.sessions?.length || 0,
    }));
  }
}
