import { WalletInfo } from '@/types/api-types';

/**
 * Formats a message for wallet signing to ensure it's never empty and follows standards
 */
export class MessageFormatter {
  /**
   * Format a message for signing ensuring it meets requirements
   * @param message Original message/challenge 
   * @param walletInfo Optional wallet info for provider-specific formatting
   * @returns Formatted message string
   */
  static format(message: string | undefined, walletInfo?: WalletInfo): string {
    // If message is empty/undefined, create a default structured message
    if (!message) {
      const timestamp = Date.now();
      const exp = timestamp + 3600000; // 1 hour expiry
      
      return `Sign this message to authenticate\n\nTimestamp: ${timestamp}\nExpiry: ${exp}`;
    }

    // For Binance wallet, ensure the message has a clear prefix
    if (walletInfo?.providerType === 'binance') {
      return `Binance Authentication Message\n${message}`;
    }

    return message;
  }

  /**
   * Validates that a message is properly formatted
   * @param message Message to validate
   * @returns True if valid, false otherwise
   */
  static validate(message: string | undefined): boolean {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return false;
    }
    return true;
  }
}
