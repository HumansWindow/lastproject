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
}

// Enhanced storage with encryption for sensitive values
class EncryptedStorageStrategy implements StorageStrategy {
  private storage = new LocalStorageStrategy();
  
  // Simple encryption for demo purposes
  private encrypt(text: string): string {
    // In production, use a proper encryption library
    const base64 = btoa(text);
    return base64.split('').reverse().join('');
  }
  
  // Simple decryption for demo purposes
  private decrypt(encryptedText: string): string {
    // In production, use a proper encryption library
    try {
      const reversed = encryptedText.split('').reverse().join('');
      return atob(reversed);
    } catch (e) {
      console.error('Decryption error:', e);
      return '';
    }
  }
  
  setItem(key: string, value: string): void {
    const encrypted = this.encrypt(value);
    this.storage.setItem(key, encrypted);
  }
  
  getItem(key: string): string | null {
    const value = this.storage.getItem(key);
    if (!value) return null;
    return this.decrypt(value);
  }
  
  removeItem(key: string): void {
    this.storage.removeItem(key);
  }
}

// Create and export the secure storage instance
export const secureStorage = new EncryptedStorageStrategy();
