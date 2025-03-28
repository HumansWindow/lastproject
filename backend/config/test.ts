export default {
  database: {
    type: 'sqlite',
    database: ':memory:', // In-memory SQLite for testing
    synchronize: true,
    dropSchema: true,
    entities: ['src/**/*.entity.ts'],
  },
  jwt: {
    secret: 'test-secret-key',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d', // Added missing comma here
  },
};
