import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsNumber, IsLatitude, IsLongitude, IsEnum, IsUrl, IsBoolean } from 'class-validator';

// Define visibility enum for use in DTOs and Swagger
export enum VisibilityLevel {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private'
}

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

  @ApiPropertyOptional({ 
    description: 'Location visibility setting', 
    enum: VisibilityLevel,
    default: VisibilityLevel.PRIVATE 
  })
  @IsOptional()
  @IsEnum(VisibilityLevel)
  locationVisibility?: VisibilityLevel;

  @ApiPropertyOptional({ 
    description: 'Profile visibility setting', 
    enum: VisibilityLevel,
    default: VisibilityLevel.PUBLIC 
  })
  @IsOptional()
  @IsEnum(VisibilityLevel)
  profileVisibility?: VisibilityLevel;
}

export class UpdateProfileDto extends CreateProfileDto {
  // UpdateProfileDto extends CreateProfileDto since all fields are optional in both
}

export class ProfileResponseDto {
  @ApiProperty({
    description: 'Profile ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  userId: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'user@example.com'
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'First name',
    example: 'John'
  })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe'
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Display name',
    example: 'JohnD'
  })
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg'
  })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Biography text',
    example: 'Software developer with 5 years experience'
  })
  bio?: string;

  @ApiPropertyOptional({
    description: 'Unique identifier',
    example: 'john_doe_123'
  })
  uniqueId?: string;

  @ApiPropertyOptional({
    description: 'Country of residence',
    example: 'United States'
  })
  country?: string;

  @ApiPropertyOptional({
    description: 'City of residence',
    example: 'New York'
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'State/Province of residence',
    example: 'NY'
  })
  state?: string;

  @ApiProperty({
    description: 'Preferred language',
    example: 'en',
    default: 'en'
  })
  language: string;

  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'America/New_York'
  })
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Personal website',
    example: 'https://example.com'
  })
  website?: string;

  @ApiPropertyOptional({
    description: 'Twitter handle',
    example: '@johndoe'
  })
  twitterHandle?: string;

  @ApiPropertyOptional({
    description: 'Instagram handle',
    example: '@johndoe'
  })
  instagramHandle?: string;

  @ApiPropertyOptional({
    description: 'LinkedIn profile',
    example: 'https://linkedin.com/in/johndoe'
  })
  linkedinProfile?: string;

  @ApiPropertyOptional({
    description: 'Telegram handle',
    example: '@johndoe'
  })
  telegramHandle?: string;

  @ApiPropertyOptional({
    description: 'Location visibility setting',
    enum: VisibilityLevel,
    default: VisibilityLevel.PRIVATE
  })
  locationVisibility?: VisibilityLevel;

  @ApiPropertyOptional({
    description: 'Profile visibility setting',
    enum: VisibilityLevel,
    default: VisibilityLevel.PUBLIC
  })
  profileVisibility?: VisibilityLevel;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-04-14T08:22:31.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-04-14T08:22:31.000Z'
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Flag indicating if user chose to complete profile later',
    example: true
  })
  completeLater?: boolean;
}

export class UpdateLocationDto {
  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

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
  @ApiPropertyOptional({ description: 'New email address' })
  @IsOptional()
  @IsEmail()
  email?: string;
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
  @ApiPropertyOptional({ description: 'Email notification preference' })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Push notification preference' })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;
}

export class CompleteLaterDto {
  @ApiProperty({ 
    description: 'Flag indicating user wants to complete profile later', 
    default: true 
  })
  @IsBoolean()
  completeLater: boolean;
}