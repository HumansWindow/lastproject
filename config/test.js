module.exports = {
  database: {
    url: 'mongodb://localhost:27017/test_db'
  },
  jwt: {
    secret: 'test-secret-key',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d'
  },
  // Other test-specific configurations
};
