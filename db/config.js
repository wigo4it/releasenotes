require('dotenv').config();

const config = {
  development: {
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './db/dev.sqlite3',
    logging: process.env.DB_LOGGING === 'true', // Enable logging based on environment
  },
  production: {
    dialect: process.env.DB_DIALECT || 'sqlite', // Use SQLite for production
    storage: process.env.DB_STORAGE || './db/prod.sqlite3', // Separate storage for production
    logging: process.env.DB_LOGGING === 'true',
  },
  test: {
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './db/test.sqlite3', // Separate storage for tests
    logging: false, // Disable logging during testing
  },
};

module.exports = config;