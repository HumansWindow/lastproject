import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for geo-location detection results
 */
export class GeoLocationDto {
  @ApiPropertyOptional({ 
    description: 'Detected country name',
    example: 'United States' 
  })
  country?: string;

  @ApiPropertyOptional({ 
    description: 'Country code (ISO)',
    example: 'US' 
  })
  countryCode?: string;

  @ApiPropertyOptional({ 
    description: 'Detected city name',
    example: 'San Francisco' 
  })
  city?: string;

  @ApiPropertyOptional({ 
    description: 'Detected region/state',
    example: 'California' 
  })
  region?: string;

  @ApiPropertyOptional({ 
    description: 'Detected timezone',
    example: 'America/Los_Angeles' 
  })
  timezone?: string;

  @ApiPropertyOptional({ 
    description: 'Detected primary language',
    example: 'en' 
  })
  language?: string;

  @ApiPropertyOptional({ 
    description: 'Whether the detected data should be confirmed by user',
    example: true,
    default: true
  })
  requiresConfirmation?: boolean;
}