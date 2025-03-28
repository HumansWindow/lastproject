import { jest } from '@jest/globals';

// Extend global Jest namespace only if needed
// Make sure there are no duplicate declarations

// Use module augmentation pattern to avoid conflicts
// with the setup.ts declarations
declare global {
  // Remove declarations that are now handled in setup.ts
  // or use a different namespace
  namespace NodeJS {
    interface Global {
      // These will be implemented in setup.ts
      mockWithAny: <T>(implementation?: any) => jest.Mock<T>;
      createMockedFunction: <TReturn, TArgs extends any[]>(
        returnValue?: TReturn
      ) => jest.Mock<TReturn, TArgs>;
    }
  }
}

// Export empty to make this a module
export {};
