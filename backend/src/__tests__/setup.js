/* eslint-disable */
// This file is being replaced by setup.ts
// Please use the TypeScript version instead at:
// /home/alivegod/Desktop/LastProject/backend/src/__tests__/setup.ts

// Basic setup for Jest tests without NestJS dependencies
console.log('Setting up test environment');

// Increase timeout to prevent timeout errors
// Use global jest directly instead of globalThis.jest
jest.setTimeout(30000); // 30 seconds timeout

// Mock global fetch if not mocked in individual test files
if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
    })
  );
}

// Setup for ESM modules
process.env.NODE_ENV = 'test';

// Add global cleanup to ensure tests finish properly
afterAll(() => {
  console.log('Tearing down test environment');
}, 10000);
