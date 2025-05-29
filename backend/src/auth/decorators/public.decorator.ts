import { SetMetadata } from '@nestjs/common';

/**
 * Public decorator - marks routes that should be accessible without authentication
 * Example usage: @Public()
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);