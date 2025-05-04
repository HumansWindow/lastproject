/**
 * Jest test setup file
 * This file contains common mock setups used across tests
 */

// Mock bcrypt for password hashing
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('mocked-hash'),
  compare: jest.fn().mockImplementation((plain, hash) => Promise.resolve(plain === 'correct-password'))
}));

// Mock app-root-path for file operations
jest.mock('app-root-path', () => ({
  path: '/mocked/root/path',
  resolve: (relativePath) => `/mocked/root/path/${relativePath}`
}));

// Create mock for TypeORM query builder
global.createMockQueryBuilder = (resultValue) => {
  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(resultValue),
    getMany: jest.fn().mockResolvedValue(Array.isArray(resultValue) ? resultValue : [resultValue]),
    getManyAndCount: jest.fn().mockResolvedValue([Array.isArray(resultValue) ? resultValue : [resultValue], Array.isArray(resultValue) ? resultValue.length : 1]),
    execute: jest.fn().mockResolvedValue(resultValue)
  };
  
  return queryBuilder;
};

// Helper to create a repository mock with standard methods
global.createMockRepository = (entityMocks = []) => {
  const queryBuilder = createMockQueryBuilder(entityMocks);
  
  return {
    find: jest.fn().mockResolvedValue(entityMocks),
    findOne: jest.fn().mockImplementation(({ where }) => {
      if (!where || !where.id || !entityMocks.length) return Promise.resolve(null);
      const found = entityMocks.find(entity => entity.id === where.id);
      return Promise.resolve(found || null);
    }),
    findAndCount: jest.fn().mockResolvedValue([entityMocks, entityMocks.length]),
    count: jest.fn().mockResolvedValue(entityMocks.length),
    create: jest.fn().mockImplementation(entity => ({ ...entity, id: entity.id || 'new-mock-id' })),
    save: jest.fn().mockImplementation(entity => Promise.resolve(entity)),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    remove: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
  };
};

// Helper for mocking config service
global.createMockConfigService = (configValues = {}) => {
  return {
    get: jest.fn().mockImplementation((key, defaultValue) => {
      return key in configValues ? configValues[key] : defaultValue;
    })
  };
};

// Console spy for testing console outputs
global.spyOnConsole = () => {
  const originalConsole = { ...console };
  
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });
  
  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
    console.warn.mockRestore();
    console.info.mockRestore();
    console.debug.mockRestore();
  });
  
  return originalConsole;
};

// File system mock helper
global.createFileSystemMock = () => {
  jest.mock('fs', () => ({
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    readFileSync: jest.fn().mockReturnValue('mock file content'),
    unlinkSync: jest.fn(),
    promises: {
      readFile: jest.fn().mockResolvedValue('mock file content'),
      writeFile: jest.fn().mockResolvedValue(undefined),
      unlink: jest.fn().mockResolvedValue(undefined),
      mkdir: jest.fn().mockResolvedValue(undefined)
    }
  }));
  
  jest.mock('path', () => ({
    join: jest.fn((...paths) => paths.join('/')),
    resolve: jest.fn((...paths) => paths.join('/')),
    dirname: jest.fn(path => path.split('/').slice(0, -1).join('/')),
    basename: jest.fn(path => path.split('/').pop()),
    extname: jest.fn(path => {
      const parts = path.split('.');
      return parts.length > 1 ? `.${parts.pop()}` : '';
    })
  }));
};