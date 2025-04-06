/// <reference types="jest" />

// This file exists to help TypeScript find the Jest type definitions
declare global {
  // Basic Jest globals
  const describe: (name: string, fn: () => void) => void;
  const it: (name: string, fn: () => void | Promise<void>) => void;
  const test: typeof it;
  const expect: jest.Expect;
  const beforeAll: (fn: () => void | Promise<void>) => void;
  const afterAll: (fn: () => void | Promise<void>) => void;
  const beforeEach: (fn: () => void | Promise<void>) => void;
  const afterEach: (fn: () => void | Promise<void>) => void;
  
  // Jest object for mocking
  namespace jest {
    interface Expect {
      (value: any): any;
    }
    
    function fn(): any;
    function fn<T>(): jest.Mock<T>;
    function spyOn(object: any, method: string): any;
    function mock(moduleName: string): any;
    function requireActual(moduleName: string): any;
  }
}

// Need to export something to make this a module
export {};