# Test Utilities Documentation

This document describes the standardized mocking approach implemented for the test suite in this project.

## Overview

We've created a centralized set of mock utilities in the `test-setup.js` file that is used across all tests. These utilities provide consistent mocking patterns for common dependencies like repositories, config services, and file systems.

## Available Mock Utilities

### Repository Mocking

```typescript
const mockRepository = createMockRepository(entityMocks);
```

Creates a mock repository with standard TypeORM repository methods. The `entityMocks` parameter is an array of entities that will be used for operations like `find()` and `findOne()`.

Example:
```typescript
const mockUsers = [
  { id: 'user1', name: 'John Doe', email: 'john@example.com' },
  { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' }
];

const mockUserRepository = createMockRepository(mockUsers);
```

### Query Builder Mocking

```typescript
const queryBuilder = createMockQueryBuilder(resultValue);
```

Creates a mock TypeORM query builder with chainable methods like `where()`, `andWhere()`, `leftJoinAndSelect()`, etc. The `resultValue` parameter is the value that will be returned by methods like `getOne()`, `getMany()`, etc.

### Config Service Mocking

```typescript
const configService = createMockConfigService(configValues);
```

Creates a mock NestJS ConfigService with a `get()` method that returns values from the `configValues` object based on the key.

Example:
```typescript
const mockConfigService = createMockConfigService({
  'API_URL': 'https://api.example.com',
  'JWT_SECRET': 'test-secret',
  'PORT': 3000
});
```

### File System Mocking

```typescript
createFileSystemMock();
```

Mocks the file system modules (`fs` and `path`) for testing file operations.

### Console Spy

```typescript
const originalConsole = spyOnConsole();
```

Sets up spies on console methods (`log`, `error`, `warn`, `info`, `debug`) and returns the original console object.

## Using Mock Utilities in Tests

Here is an example of how to use these utilities in a test file:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';

// TypeScript declaration for using global mock functions
declare const createMockRepository: any;
declare const createMockConfigService: any;

describe('UserService', () => {
  let service: UserService;
  
  const mockUsers = [
    { id: 'user1', name: 'John Doe', email: 'john@example.com' },
    { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' }
  ];

  beforeEach(async () => {
    // Create mock repositories and services
    const mockUserRepository = createMockRepository(mockUsers);
    const mockConfigService = createMockConfigService({
      'JWT_SECRET': 'test-secret'
    });
    
    // Set up the testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  // Your test cases here...
});
```

## Benefits of Using These Utilities

1. **Consistency**: All tests use the same mocking patterns, making the codebase more maintainable.
2. **Reduced Boilerplate**: Less code duplication across test files.
3. **Improved Readability**: Test files focus on test cases rather than mocking setup.
4. **Easier Debugging**: Common mocking issues are handled in one place.
5. **Better Test Coverage**: Standardized approach helps ensure all aspects are properly tested.

## Best Practices

1. Always use the centralized mocking utilities for TypeORM repositories.
2. Mock only what you need - don't add unnecessary mock behaviors.
3. When you need custom behavior, add it after creating the mock with the utility.
4. Keep mock data minimal but sufficient for the tests.
5. Use realistic values for mock data to make tests more meaningful.