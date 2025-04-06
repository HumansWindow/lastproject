import { Request } from 'express';
import { User } from '../../users/entities/user.entity';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

// Add a more flexible version for tests
export interface TestRequestWithUser extends RequestWithUser {
  user: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

// Add type assertion helper for tests
export function createTestRequest(user: { id: string, email: string, isAdmin?: boolean }): RequestWithUser {
  return { 
    user: {
      ...user,
      isAdmin: user.isAdmin ?? false
    } 
  } as RequestWithUser;
}
