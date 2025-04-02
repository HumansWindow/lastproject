/**
 * Jest configuration file that correctly handles TypeScript testing
 */

// Use CommonJS module.exports instead of ESM export default
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: [
    '<rootDir>/src'
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@blockchain/(.*)$': '<rootDir>/src/blockchain/$1'
  },
  setupFilesAfterEnv: ['./jest-global.d.ts'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  rootDir: '.',
  transformIgnorePatterns: [
    // Specify which modules should not be transformed
    'node_modules/(?!(tiny-secp256k1|bip39|ethers|@solana|bitcoinjs-lib)/)',
  ],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  modulePaths: ['<rootDir>'],
  forceExit: true,
  detectOpenHandles: true,
  // Add maxWorkers to limit parallel test execution for stability
  maxWorkers: '50%',
  // Increase timeout
  testTimeout: 30000
};
