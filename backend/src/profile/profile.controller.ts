import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import {
  CreateProfileDto,
  UpdateProfileDto,
  ProfileResponseDto,
  UpdateLocationDto,
  UpdateProfileEmailDto,
  UpdateProfilePasswordDto,
  UpdateNotificationSettingsDto,
} from './dto/profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new profile for the authenticated user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Profile successfully created', type: ProfileResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Profile already exists' })
  @ApiBearerAuth()
  async create(@Request() req, @Body() createProfileDto: CreateProfileDto) {
    try {
      return await this.profileService.create(req.user.userId, createProfileDto);
    } catch (error) {
      if (error.message.includes('already exists')) {
        throw new BadRequestException('Profile already exists for this user');
      }
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the profile of the authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile information retrieved', type: ProfileResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Profile not found' })
  @ApiBearerAuth()
  async findOwn(@Request() req) {
    try {
      return await this.profileService.findByUserId(req.user.userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null; // Return null for non-existent profile
      }
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a profile by ID' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile information retrieved', type: ProfileResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Profile not found' })
  @ApiBearerAuth()
  async findById(@Param('id') id: string) {
    return this.profileService.findById(id);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update the profile of the authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile successfully updated', type: ProfileResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Profile not found' })
  @ApiBearerAuth()
  async update(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.update(req.user.userId, updateProfileDto);
  }

  @Put('location')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update the location of the authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Location successfully updated', type: ProfileResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Profile not found' })
  @ApiBearerAuth()
  async updateLocation(@Request() req, @Body() updateLocationDto: UpdateLocationDto) {
    return this.profileService.updateLocation(req.user.userId, updateLocationDto);
  }

  @Put('email')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update the email of the authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email successfully updated', type: ProfileResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already in use' })
  @ApiBearerAuth()
  async updateEmail(@Request() req, @Body() updateEmailDto: UpdateProfileEmailDto) {
    return this.profileService.updateEmail(req.user.userId, updateEmailDto);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update the password of the authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password successfully updated' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Current password is incorrect' })
  @ApiBearerAuth()
  async updatePassword(@Request() req, @Body() updatePasswordDto: UpdateProfilePasswordDto) {
    return this.profileService.updatePassword(req.user.userId, updatePasswordDto);
  }

  @Put('notifications')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update notification settings of the authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification settings successfully updated', type: ProfileResponseDto })
  @ApiBearerAuth()
  async updateNotificationSettings(@Request() req, @Body() updateNotificationSettingsDto: UpdateNotificationSettingsDto) {
    return this.profileService.updateNotificationSettings(req.user.userId, updateNotificationSettingsDto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete the profile of the authenticated user' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Profile successfully deleted' })
  @ApiBearerAuth()
  async remove(@Request() req) {
    return this.profileService.remove(req.user.userId);
  }
  
  @Get('exists')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if the authenticated user has a profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns true if profile exists, false otherwise' })
  @ApiBearerAuth()
  async exists(@Request() req) {
    return { exists: await this.profileService.exists(req.user.userId) };
  }
}