// Global Jest type declarations
declare global {
  const jest: any;
  const describe: (name: string, fn: () => void) => void;
  const it: (name: string, fn: () => void) => void;
  const expect: any;
  const beforeEach: (fn: () => void) => void;
  const beforeAll: (fn: () => void) => void;
  const afterEach: (fn: () => void) => void;
  const afterAll: (fn: () => void) => void;
}

export {};