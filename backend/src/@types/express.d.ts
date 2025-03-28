import { AuthUser } from '../blockchain/hotwallet/middleware/auth.middleware';

declare global {
  namespace Express {
    // Extend the User interface from Passport
    interface User extends AuthUser {}
  }
}

// This is required to make this file a module
export {};
