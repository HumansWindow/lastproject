import { Test } from '@nestjs/testing';
import { TestModule } from './test.module';
import { getConnectionManager } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({
  path: path.resolve(process.cwd(), '.env.test'),
});

// Import any necessary test libraries or configurations
import { jest } from '@jest/globals';

// Mock any global services that might be required in all tests
jest.setTimeout(30000); // Set a longer timeout for all tests

// Special setup for handling the TypeScript error issues in tests
// Use type assertion to prevent type errors
(global as any).mockWithAny = <T>(implementation?: any): jest.Mock<any> => {
  return jest.fn(implementation) as any;
};

// Special function to create a typed mock for service methods
// Use type assertion to solve the TypeScript constraint error
(global as any).createMockedFunction = <TReturn, TArgs extends any[]>(
  returnValue?: TReturn
): jest.Mock<TReturn, TArgs> => {
  // Use a proper type assertion chain to avoid the conversion error
  return jest.fn(() => returnValue) as unknown as jest.Mock<TReturn, TArgs>;
};

let testingModule;
let app;
let activeConnections = [];  // Track active connections

// Increase timeout to prevent timeout errors
beforeAll(async () => {
  console.log('Setting up test environment');

  // Create the testing module using the TestModule
  testingModule = await Test.createTestingModule({
    imports: [TestModule],
  }).compile();

  // Get the app from the testing module
  app = testingModule.createNestApplication();
  await app.init();
}, 30000); // Increase timeout to 30 seconds

afterAll(async () => {
  console.log('Tearing down test environment');

  if (app) {
    await app.close();
  }
  
  if (testingModule) {
    await testingModule.close();
  }

  try {
    const connections = getConnectionManager().connections;
    for (const connection of connections) {
      if (connection.isConnected) {
        await connection.close();
      }
    }
  } catch (error) {
    console.warn('Error closing connections:', error.message);
  }

  // Add delay to ensure cleanup
  await new Promise(resolve => setTimeout(resolve, 500));
}, 10000); // Increase timeout here as well

// Export an interface to track active connections
export interface ConnectionTracker {
  activeConnections: any[];
  trackConnection: (connection: any) => void;
}

export const connectionTracker: ConnectionTracker = {
  activeConnections: [],
  trackConnection: (connection: any) => {
    connectionTracker.activeConnections.push(connection);
  }
};

// Basic setup for Jest tests
jest.setTimeout(30000); // 30 seconds timeout

// Mock global fetch if not mocked in individual test files
if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
    })
  ) as jest.Mock;
}

// Setup for ESM modules
process.env.NODE_ENV = 'test';
