import { Injectable, Logger } from '@nestjs/common';
import { TypeORMError } from 'typeorm';

@Injectable()
export class ProfileErrorHandlerService {
  private readonly logger = new Logger(ProfileErrorHandlerService.name);

  /**
   * Parse database errors and return user-friendly messages
   * Specifically designed to catch field naming inconsistencies
   */
  parseDbError(error: any): { message: string; details?: any } {
    // Log the original error for debugging
    this.logger.error(`Database error: ${error.message}`, error.stack);
    
    // Default error message
    let userMessage = 'An error occurred while processing your request';
    let details = null;

    // Handle TypeORM specific errors
    if (error instanceof TypeORMError || error.name === 'QueryFailedError') {
      // Handle Postgres errors based on error codes
      if (error.code) {
        switch (error.code) {
          // Foreign key violation
          case '23503':
            userMessage = 'This operation references data that does not exist';
            break;
          
          // Unique constraint violation
          case '23505':
            userMessage = 'This record already exists';
            // Extract constraint name if available
            const match = /constraint "(.+)"/.exec(error.detail);
            if (match && match[1]) {
              if (match[1].includes('email')) {
                userMessage = 'This email address is already in use';
              } else if (match[1].includes('unique')) {
                userMessage = 'This unique identifier is already in use';
              }
            }
            break;
          
          // Not null violation
          case '23502':
            const column = /column "(.+)"/.exec(error.message);
            userMessage = column 
              ? `The ${column[1]} field is required` 
              : 'A required field is missing';
            break;

          // Specific error for the user_id/userId inconsistency
          default:
            if (error.message.includes('no field "userId"')) {
              userMessage = 'Database naming inconsistency detected: field "userId" referenced but only "user_id" exists';
              details = {
                type: 'FIELD_NAMING_INCONSISTENCY',
                problematicField: 'userId',
                correctField: 'user_id',
                recommendation: 'Use snake_case (user_id) for database fields and camelCase (userId) in application code'
              };
              
              // Log additional details for this specific error
              this.logger.error(
                'Field naming inconsistency detected', 
                { 
                  error: error.message, 
                  details 
                }
              );
            } 
            else if (error.message.includes('no field "user_id"')) {
              userMessage = 'Database naming inconsistency detected: field "user_id" referenced but only "userId" exists';
              details = {
                type: 'FIELD_NAMING_INCONSISTENCY',
                problematicField: 'user_id',
                correctField: 'userId', 
                recommendation: 'Use snake_case (user_id) for database fields and camelCase (userId) in application code'
              };
              
              this.logger.error(
                'Field naming inconsistency detected', 
                { 
                  error: error.message, 
                  details 
                }
              );
            }
            else if (error.message.includes('column') && (error.message.includes('does not exist'))) {
              // Handle general column does not exist errors
              const columnMatch = /column "(.+)" does not exist/.exec(error.message);
              const column = columnMatch ? columnMatch[1] : 'unknown';
              
              userMessage = `Database error: Column "${column}" does not exist`;
              details = {
                type: 'MISSING_COLUMN',
                column,
                potentialFix: `Check if this column should be "${this.suggestColumnName(column)}"`
              };
            }
            break;
        }
      }
    }

    return { 
      message: userMessage, 
      details 
    };
  }
  
  /**
   * For a given problematic field name, suggest the correct naming convention
   */
  private suggestColumnName(columnName: string): string {
    // If it's camelCase (contains uppercase letters but doesn't start with one)
    if (/^[a-z]+[A-Z]/.test(columnName)) {
      // Convert camelCase to snake_case (userId -> user_id)
      return columnName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    }
    
    // If it's snake_case (contains underscores)
    if (columnName.includes('_')) {
      // Convert snake_case to camelCase (user_id -> userId)
      return columnName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    
    return columnName;
  }
  
  /**
   * Check if an error is related to field naming inconsistencies
   */
  isNamingInconsistencyError(error: any): boolean {
    if (!error || !error.message) return false;
    
    return (
      error.message.includes('no field "userId"') ||
      error.message.includes('no field "user_id"') ||
      error.message.includes('no field "deviceId"') ||
      error.message.includes('no field "device_id"') ||
      error.message.includes('no field "profileId"') ||
      error.message.includes('no field "profile_id"') ||
      error.message.includes('no field "walletId"') ||
      error.message.includes('no field "wallet_id"')
    );
  }
}