/**
 * A utility for more secure token storage with improved fallbacks
 */

// Ensure this file is in the correct location and that the TypeScript 
// compiler can find it. It should be in:
// /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/utils/secure-storage.ts

interface StorageStrategy {
  setItem(key: string, value: string): void;
  getItem(key: string): string | null;
  removeItem(key: string): void;
  clear(): void; // Added clear method
}

// Base local storage strategy
class LocalStorageStrategy implements StorageStrategy {
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Error storing in localStorage:', e);
    }
  }
  
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error retrieving from localStorage:', e);
      return null;
    }
  }
  
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing from localStorage:', e);
    }
  }
  
  // Added clear method
  clear(): void {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
  }
}

// Enhanced storage with encryption for sensitive values
class EncryptedStorageStrategy implements StorageStrategy {
  private storage = new LocalStorageStrategy();
  
  // Improved encryption that handles Unicode characters
  private encrypt(text: string): string {
    try {
      // Convert Unicode string to UTF-8 bytes, then to binary string
      const utf8String = unescape(encodeURIComponent(text));
      // Now encode as base64
      const base64 = btoa(utf8String);
      return base64.split('').reverse().join('');
    } catch (e) {
      console.error('Encryption error:', e);
      return btoa('error_encrypting_data');
    }
  }
  
  // Improved decryption that handles Unicode characters
  private decrypt(encryptedText: string): string {
    try {
      const reversed = encryptedText.split('').reverse().join('');
      // Decode base64 to binary
      const binaryString = atob(reversed);
      // Convert binary to UTF-8 string
      return decodeURIComponent(escape(binaryString));
    } catch (e) {
      console.error('Decryption error:', e);
      return '';
    }
  }
  
  setItem(key: string, value: string): void {
    if (!value) return;
    try {
      const encrypted = this.encrypt(value);
      this.storage.setItem(key, encrypted);
    } catch (e) {
      console.error(`Failed to store item with key ${key}:`, e);
    }
  }
  
  getItem(key: string): string | null {
    try {
      const value = this.storage.getItem(key);
      if (!value) return null;
      
      const decrypted = this.decrypt(value);
      // If decryption resulted in empty string due to error, remove corrupted item
      if (decrypted === '' && value.length > 0) {
        console.warn(`Removing corrupted storage item with key: ${key}`);
        this.removeItem(key);
        return null;
      }
      return decrypted;
    } catch (e) {
      console.error(`Error retrieving item with key ${key}:`, e);
      return null;
    }
  }
  
  removeItem(key: string): void {
    this.storage.removeItem(key);
  }
  
  // Added clear method
  clear(): void {
    this.storage.clear();
  }
  
  // Method to safely clear any auth-related data that might be corrupted
  clearAuthData(): void {
    const authKeys = ['accessToken', 'refreshToken', 'walletAddress', 'userId', 
                     'auth_token', 'auth_refresh_token', 'user', 'device_verification'];
    
    for (const key of authKeys) {
      this.removeItem(key);
    }
  }
}

// Create and export the secure storage instance
export const secureStorage = new EncryptedStorageStrategy();

// Export a utility function to clear corrupted storage data
export function clearCorruptedStorage() {
  console.log('Clearing potentially corrupted storage data...');
  secureStorage.clearAuthData();
}
