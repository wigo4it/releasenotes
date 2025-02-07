const { Sequelize } = require('sequelize');
const config = require('../db/config');

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

const sequelize = new Sequelize(
  dbConfig.database || undefined,
  dbConfig.username || undefined,
  dbConfig.password || undefined,
  {
    host: dbConfig.host || undefined,
    port: dbConfig.port || undefined,
    dialect: dbConfig.dialect,
    storage: dbConfig.storage || undefined, // SQLite-specific
    logging: dbConfig.logging,
    dialectOptions: dbConfig.dialectOptions || {},
    retry: {
      max: 5, // Retry up to 5 times
      match: [
        /SQLITE_BUSY/, // Retry on SQLite busy errors
        /SQLITE_LOCKED/, // Retry on SQLite locked errors
      ],
      backoffBase: 100, // Initial backoff duration in ms
      backoffExponent: 2, // Exponential backoff multiplier
    },
    pool: {
      max: 5, // Maximum number of connections
      min: 1, // Minimum number of connections
      acquire: 30000, // Maximum time (ms) to acquire a connection
      idle: 10000, // Maximum time (ms) a connection can be idle
    },
  }
);

module.exports = sequelize;
