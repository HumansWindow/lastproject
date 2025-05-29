import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios'; // Fixed import for HttpService
import { Request } from 'express';
import { catchError, map, firstValueFrom } from 'rxjs';

/**
 * Interface for geoIP response data
 */
export interface GeoLocationData {
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  timezone?: string;
  languages?: string[];
  language?: string; // Add language field for convenience
}

/**
 * Interface for IP API response
 */
interface IpApiResponse {
  country: string;
  countryCode: string;
  city: string;
  regionName: string;
  timezone: string;
  [key: string]: any; // Allow other fields
}

/**
 * Service for detecting user's location based on IP address
 */
@Injectable()
export class GeoLocationService {
  private readonly logger = new Logger(GeoLocationService.name);
  private readonly geoIpApiUrl: string;
  private readonly ipDetectionEnabled: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    // Configure IP detection service URL - can be moved to env variables
    this.geoIpApiUrl = this.configService.get('GEO_IP_API_URL') || 'http://ip-api.com/json';
    this.ipDetectionEnabled = this.configService.get('ENABLE_IP_DETECTION') !== 'false';
  }

  /**
   * Extract client IP address from request
   */
  private extractIpAddress(req: Request): string {
    // Try various headers where IP might be found
    const ip = 
      req.headers['x-forwarded-for'] || 
      req.headers['x-real-ip'] || 
      req.connection.remoteAddress ||
      req.socket.remoteAddress;

    // Handle comma-separated IPs (from proxies)
    if (typeof ip === 'string') {
      return ip.split(',')[0].trim();
    }
    
    // Handle array of IPs
    if (Array.isArray(ip)) {
      return ip[0];
    }

    return '127.0.0.1'; // Default to localhost if no IP found
  }

  /**
   * Detect user's location based on their IP address
   */
  async detectLocation(req: Request): Promise<GeoLocationData> {
    try {
      if (!this.ipDetectionEnabled) {
        this.logger.log('IP detection is disabled - returning default data');
        return { 
          country: undefined,
          countryCode: undefined, 
          timezone: undefined 
        };
      }

      const ipAddress = this.extractIpAddress(req);
      this.logger.debug(`Detecting location for IP: ${ipAddress}`);

      // Skip detection for localhost/private IPs
      if (ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
        this.logger.debug('Local/private IP detected, skipping geo-detection');
        return { 
          country: undefined,
          countryCode: undefined, 
          timezone: undefined 
        };
      }

      // Call IP detection service
      const response = await firstValueFrom(
        this.httpService.get<IpApiResponse>(`${this.geoIpApiUrl}/${ipAddress}`)
          .pipe(
            map(response => response.data),
            catchError(error => {
              this.logger.error(`Error detecting location: ${error.message}`);
              throw error; // Re-throw to be caught by the outer catch
            }),
          )
      );

      // Process and map the response, adjust fields according to your external API's response format
      const location: GeoLocationData = {
        country: response.country,
        countryCode: response.countryCode,
        city: response.city,
        region: response.regionName,
        timezone: response.timezone,
        languages: this.getLanguagesByCountry(response.countryCode)
      };

      this.logger.debug(`Detected location: ${JSON.stringify(location)}`);
      return location;
    } catch (error) {
      this.logger.error(`Failed to detect location: ${error instanceof Error ? error.message : String(error)}`);
      return { 
        country: undefined,
        countryCode: undefined,
        timezone: undefined 
      };
    }
  }

  /**
   * Get primary and secondary languages for a country
   */
  private getLanguagesByCountry(countryCode?: string): string[] {
    if (!countryCode) return ['en'];
    
    // Map of country codes to primary languages
    // This is a simplified mapping, a more comprehensive mapping should be used in production
    const countryLanguageMap: Record<string, string[]> = {
      'US': ['en'],
      'GB': ['en'],
      'CA': ['en', 'fr'],
      'AU': ['en'],
      'NZ': ['en'],
      'FR': ['fr'],
      'DE': ['de'],
      'ES': ['es'],
      'IT': ['it'],
      'JP': ['ja'],
      'CN': ['zh'],
      'KR': ['ko'],
      'RU': ['ru'],
      'BR': ['pt'],
      'IR': ['fa'],
      // Add more country-language mappings as needed
    };
    
    return countryLanguageMap[countryCode] || ['en'];
  }

  /**
   * Get browser languages from Accept-Language header
   */
  extractBrowserLanguages(req: Request): string[] {
    try {
      const acceptLanguage = req.headers['accept-language'];
      if (!acceptLanguage) return ['en'];
      
      // Parse the Accept-Language header
      return acceptLanguage
        .split(',')
        .map(lang => {
          // Extract the language code before the ';' character
          const match = lang.match(/([a-zA-Z\-]+)(?:;q=[0-9.]+)?/);
          return match ? match[1].trim().substring(0, 2).toLowerCase() : null;
        })
        .filter(Boolean) as string[];
    } catch (error) {
      this.logger.error(`Error extracting browser languages: ${error instanceof Error ? error.message : String(error)}`);
      return ['en'];
    }
  }

  /**
   * Detect best language based on browser Accept-Language header and location
   */
  detectPreferredLanguage(req: Request, geoLocation?: GeoLocationData): string {
    try {
      // Get browser languages
      const browserLanguages = this.extractBrowserLanguages(req);
      
      // Get geo-detected languages
      const geoLanguages = geoLocation?.languages || [];
      
      // Combine and prioritize: browser languages first, then geo-detected languages
      const allLanguages = [...new Set([...browserLanguages, ...geoLanguages])];
      
      // Return the first supported language or fallback to English
      const supportedLanguages = ['en', 'fr', 'es', 'de', 'fa']; // Add more as needed
      
      for (const language of allLanguages) {
        if (supportedLanguages.includes(language)) {
          return language;
        }
      }
      
      return 'en'; // Default to English
    } catch (error) {
      this.logger.error(`Error detecting preferred language: ${error instanceof Error ? error.message : String(error)}`);
      return 'en';
    }
  }

  /**
   * Get comprehensive location data and language preferences from request
   */
  async getLocationAndLanguage(req: Request): Promise<{
    location: GeoLocationData;
    language: string;
  }> {
    // Detect location from IP
    const location = await this.detectLocation(req);
    
    // Detect preferred language 
    const language = this.detectPreferredLanguage(req, location);
    
    return {
      location,
      language
    };
  }
}