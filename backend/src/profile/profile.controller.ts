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
  InternalServerErrorException,
  Logger,
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
import { ProfileErrorHandlerService } from './profile-error-handler.service';
import { GeoLocationService } from './geo-location.service';
import {
  CreateProfileDto,
  UpdateProfileDto,
  ProfileResponseDto,
  UpdateLocationDto,
  UpdateProfileEmailDto,
  UpdateProfilePasswordDto,
  UpdateNotificationSettingsDto,
  CompleteLaterDto,
} from './dto/profile.dto';
import { GeoLocationDto } from './dto/geo-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(
    private readonly profileService: ProfileService,
    private readonly errorHandler: ProfileErrorHandlerService,
    private readonly geoLocationService: GeoLocationService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new profile for the authenticated user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Profile successfully created', type: ProfileResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Profile already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data or database naming inconsistency' })
  @ApiBearerAuth()
  async create(@Request() req, @Body() createProfileDto: CreateProfileDto) {
    try {
      // Extract userId from req.user - handle both property names
      const userId = req.user.userId || req.user.id;
      if (!userId) {
        throw new BadRequestException('User ID missing from authentication token');
      }
      
      return await this.profileService.create(userId, createProfileDto);
    } catch (error) {
      if (error.message?.includes('already exists')) {
        throw new BadRequestException('Profile already exists for this user');
      }
      
      // Check specifically for field naming inconsistency errors
      if (error.response?.fieldNamingError) {
        this.logger.error(`Field naming inconsistency detected in profile creation: ${error.response.message}`);
        throw error; // Re-throw the already formatted error
      }
      
      // Re-throw known exceptions
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      // For other errors, provide better logging and response
      this.logger.error(`Error creating profile: ${error.message}`, error.stack);
      throw new InternalServerErrorException('An error occurred while creating the profile');
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

  @Get('detect-location')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Detect user location from IP address' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Location detected successfully', type: GeoLocationDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Failed to detect location' })
  @ApiBearerAuth()
  async detectLocation(@Request() req): Promise<GeoLocationDto> {
    try {
      const { location, language } = await this.geoLocationService.getLocationAndLanguage(req);
      
      return {
        country: location.country,
        countryCode: location.countryCode,
        city: location.city,
        region: location.region,
        timezone: location.timezone,
        language: language,
        requiresConfirmation: true
      };
    } catch (error) {
      this.logger.error(`Error detecting location: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to detect location');
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

  @Post('complete-later')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark profile as "complete later" for the authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile marked as complete later', type: ProfileResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Database field inconsistency detected' })
  @ApiBearerAuth()
  async completeLater(@Request() req, @Body() completeLaterDto: CompleteLaterDto) {
    try {
      // Extract userId from req.user - handle both property names
      const userId = req.user.userId || req.user.id;
      if (!userId) {
        throw new BadRequestException('User ID missing from authentication token');
      }
      
      // If "complete later" is true, try to detect location and save it
      let profileData = completeLaterDto;
      if (completeLaterDto.completeLater) {
        try {
          // Try to detect location data
          const { location, language } = await this.geoLocationService.getLocationAndLanguage(req);
          
          // Merge the detected data with complete later flag
          profileData = {
            ...completeLaterDto,
            country: location.country,
            city: location.city,
            timezone: location.timezone,
            language: language
          };
          
          this.logger.log(`Auto-detected profile data for later completion: ${JSON.stringify({
            country: location.country,
            language,
          })}`);
        } catch (geoError) {
          // Just log the error but continue with basic complete later
          this.logger.error(`Failed to auto-detect location for complete-later: ${geoError.message}`);
        }
      }
      
      return await this.profileService.markCompleteLater(userId, profileData);
    } catch (error) {
      // Check specifically for field naming inconsistency errors
      if (error.response?.fieldNamingError) {
        this.logger.error(`Field naming inconsistency detected in complete-later: ${error.response.message}`);
        throw error; // Re-throw the already formatted error
      }
      
      // For other errors, provide better logging
      this.logger.error(`Error marking profile as complete later: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  @Post('complete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Complete user profile after wallet authentication' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile completed successfully', type: ProfileResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Profile not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data or database naming inconsistency' })
  @ApiBearerAuth()
  async completeProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    try {
      // Extract userId from req.user - handle both property names
      const userId = req.user.userId || req.user.id;
      if (!userId) {
        throw new BadRequestException('User ID missing from authentication token');
      }
      
      // If country/language not provided, try to auto-detect
      if (!updateProfileDto.country || !updateProfileDto.language) {
        try {
          const { location, language } = await this.geoLocationService.getLocationAndLanguage(req);
          
          // Add detected data only for fields that aren't already set
          const enhancedProfileDto = {
            ...updateProfileDto,
            country: updateProfileDto.country || location.country,
            city: updateProfileDto.city || location.city,
            timezone: updateProfileDto.timezone || location.timezone,
            language: updateProfileDto.language || language
          };
          
          updateProfileDto = enhancedProfileDto;
          
          this.logger.log(`Enhanced profile data with auto-detected values: ${JSON.stringify({
            country: updateProfileDto.country,
            language: updateProfileDto.language
          })}`);
        } catch (geoError) {
          this.logger.error(`Failed to auto-detect location for profile completion: ${geoError.message}`);
          // Continue with original data if detection fails
        }
      }
      
      // Check if profile exists before attempting to update
      const exists = await this.profileService.exists(userId);
      
      if (exists) {
        // Update existing profile
        return this.profileService.update(userId, updateProfileDto);
      } else {
        // Create new profile if it doesn't exist
        return this.profileService.create(userId, updateProfileDto);
      }
    } catch (error) {
      // Check specifically for field naming inconsistency errors
      if (error.response?.fieldNamingError) {
        this.logger.error(`Field naming inconsistency detected in profile completion: ${error.response.message}`, 
          error.response.details);
        throw error; // Re-throw the already formatted error
      }
      
      // Handle other common errors
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error completing profile: ${error.message}`, error.stack);
      throw new InternalServerErrorException('An error occurred while completing your profile');
    }
  }

  // Helper method to extract user ID safely
  private extractUserId(req: any): string {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID missing from authentication token');
    }
    return userId;
  }
}