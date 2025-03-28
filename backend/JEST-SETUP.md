# Jest Testing Setup

This document explains how to set up Jest testing for this project.

## Installing Jest Type Definitions

If you're facing TypeScript errors related to missing Jest types, run:

```bash
npm run install:jest-types
```

This will:
1. Install `@types/jest` package
2. Update `.gitignore` to preserve the types (if needed)

## Running Tests

To run tests:

```bash
npm test
```

To run tests in watch mode:

```bash
npm run test:watch
```

For test coverage:

```bash
npm run test:cov
```

## Test Configuration

The project has two TypeScript configurations:
- `tsconfig.json` - For regular compilation
- `tsconfig.test.json` - Special settings for test files

The Jest configuration is in `jest.config.js`.

## Writing Tests

Place your test files in the appropriate location:
- Unit tests: `src/__tests__/`
- E2E tests: `test/`

Follow the naming convention: `*.spec.ts` for test files.
