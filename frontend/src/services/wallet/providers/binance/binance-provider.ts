import { MessageFormatter } from '../../utils/message-formatter';

export class BinanceWalletProvider {
  private initialized = false;

  /**
   * Initialize the provider and check availability
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Wait for BinanceChain to be injected
    let retries = 0;
    while (!window.BinanceChain && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }

    if (!window.BinanceChain) {
      throw new Error('Binance wallet not found after waiting');
    }

    this.initialized = true;
  }

  /**
   * Get connected accounts
   */
  async getAccounts(): Promise<string[]> {
    if (!this.initialized) await this.initialize();
    
    try {
      const accounts = await window.BinanceChain.request({ method: 'eth_accounts' });
      return accounts ?? [];
    } catch (error) {
      console.error('Error getting Binance accounts:', error);
      return [];
    }
  }

  /**
   * Sign a message using Binance wallet
   * Implements multiple signing methods with fallback
   */
  async signMessage(message: string, address: string): Promise<{success: boolean; signature?: string; error?: string}> {
    if (!this.initialized) await this.initialize();

    // Ensure message is properly formatted
    if (!MessageFormatter.validate(message)) {
      return {
        success: false,
        error: 'Invalid message format'
      };
    }

    const formattedMessage = MessageFormatter.format(message, { address, providerType: 'binance' });

    // Try multiple signing methods in sequence
    try {
      // Method 1: Try eth_sign first (most reliable for Binance wallet)
      try {
        const signature = await window.BinanceChain.request({
          method: 'eth_sign',
          params: [address, formattedMessage],
        });
        return { success: true, signature };
      } catch (ethSignError) {
        console.warn('eth_sign failed for Binance wallet, trying personal_sign...', ethSignError);
      }

      // Method 2: Try personal_sign as fallback
      try {
        const signature = await window.BinanceChain.request({
          method: 'personal_sign',
          params: [formattedMessage, address],
        });
        return { success: true, signature };
      } catch (personalSignError) {
        console.warn('personal_sign failed for Binance wallet, trying legacy sign...', personalSignError);
      }

      // Method 3: Try legacy method as last resort
      const signature = await window.BinanceChain.request({
        method: 'eth_signTypedData',
        params: [[{
          type: 'string',
          name: 'Message',
          value: formattedMessage
        }], address],
      });

      return { success: true, signature };

    } catch (error) {
      console.error('All Binance signing methods failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during signing'
      };
    }
  }

  /**
   * Check if Binance wallet is available
   */
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.BinanceChain;
  }
}
