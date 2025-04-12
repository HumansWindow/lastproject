import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsNumber, IsLatitude, IsLongitude, IsEnum, IsUrl, IsBoolean } from 'class-validator';

export class CreateProfileDto {
  @ApiPropertyOptional({ description: 'Email address (optional)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Password for email-based login (optional)' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Display name' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Unique identifier for the user' })
  @IsOptional()
  @IsString()
  uniqueId?: string;

  @ApiPropertyOptional({ description: 'Country of residence' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'City of residence' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province of residence' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Full address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Preferred language', default: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Biography text' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Personal website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Twitter handle' })
  @IsOptional()
  @IsString()
  twitterHandle?: string;

  @ApiPropertyOptional({ description: 'Instagram handle' })
  @IsOptional()
  @IsString()
  instagramHandle?: string;

  @ApiPropertyOptional({ description: 'Linkedin profile URL' })
  @IsOptional()
  @IsUrl()
  linkedinProfile?: string;

  @ApiPropertyOptional({ description: 'Telegram username' })
  @IsOptional()
  @IsString()
  telegramHandle?: string;

  @ApiPropertyOptional({ description: 'Location visibility setting', enum: ['public', 'friends', 'private'], default: 'private' })
  @IsOptional()
  @IsEnum(['public', 'friends', 'private'])
  locationVisibility?: 'public' | 'friends' | 'private';

  @ApiPropertyOptional({ description: 'Profile visibility setting', enum: ['public', 'friends', 'private'], default: 'public' })
  @IsOptional()
  @IsEnum(['public', 'friends', 'private'])
  profileVisibility?: 'public' | 'friends' | 'private';
}

export class UpdateProfileDto extends CreateProfileDto {
  // UpdateProfileDto extends CreateProfileDto since all fields are optional in both
}

export class ProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional()
  uniqueId?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  language: string;

  @ApiPropertyOptional()
  timezone?: string;

  @ApiPropertyOptional()
  website?: string;

  @ApiPropertyOptional()
  twitterHandle?: string;

  @ApiPropertyOptional()
  instagramHandle?: string;

  @ApiPropertyOptional()
  linkedinProfile?: string;

  @ApiPropertyOptional()
  telegramHandle?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UpdateLocationDto {
  @ApiProperty({ description: 'Latitude coordinate' })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ description: 'Country of residence' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'City of residence' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province of residence' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Full address' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateProfileEmailDto {
  @ApiProperty({ description: 'New email address' })
  @IsEmail()
  email: string;
}

export class UpdateProfilePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'New password' })
  @IsString()
  newPassword: string;
}

export class UpdateNotificationSettingsDto {
  @ApiProperty({ description: 'Email notification preference' })
  @IsBoolean()
  emailNotifications: boolean;

  @ApiProperty({ description: 'Push notification preference' })
  @IsBoolean()
  pushNotifications: boolean;
}