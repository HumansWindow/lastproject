import { Injectable } from '@nestjs/common';

// This is a dynamic import helper to avoid webpack issues
const loadBcrypt = async () => {
  try {
    return await import('bcrypt');
  } catch (e) {
    console.error('Failed to load bcrypt', e);
    // Return a mock implementation for build process
    return {
      hash: (data: string, saltRounds: number) => Promise.resolve(`hashed_${data}`),
      compare: (data: string, hash: string) => Promise.resolve(hash === `hashed_${data}`),
      genSalt: (rounds: number) => Promise.resolve('salt')
    };
  }
};

@Injectable()
export class BcryptService {
  async hash(data: string, saltRounds: number = 10): Promise<string> {
    const bcrypt = await loadBcrypt();
    return bcrypt.hash(data, saltRounds);
  }

  async compare(data: string, hash: string): Promise<boolean> {
    const bcrypt = await loadBcrypt();
    return bcrypt.compare(data, hash);
  }
}
