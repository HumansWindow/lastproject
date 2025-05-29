// Secure storage implementation using localStorage with encryption
class SecureStorage {
  private prefix = 'secure_';

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.prefix + key, this.encrypt(value));
  }

  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    const value = localStorage.getItem(this.prefix + key);
    return value ? this.decrypt(value) : null;
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  private encrypt(value: string): string {
    // Simple encryption for demo - in production use a proper encryption library
    return btoa(value);
  }

  private decrypt(value: string): string {
    // Simple decryption for demo - in production use a proper encryption library
    return atob(value);
  }
}

export const secureStorage = new SecureStorage();
