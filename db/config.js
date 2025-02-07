require('dotenv').config();

const config = {
  development: {
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './db/dev.sqlite3',
    logging: process.env.DB_LOGGING === 'true', // Enable logging based on environment
  },
  production: {
    dialect: process.env.DB_DIALECT || 'mssql', // Default to MSSQL for CosmosDB
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 1433,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: process.env.DB_LOGGING === 'true',
    dialectOptions: {
      encrypt: true, // Required for CosmosDB connections
    },
  },
  test: {
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './db/test.sqlite3', // Separate storage for tests
    logging: false, // Disable logging during testing
  },
};

module.exports = config;