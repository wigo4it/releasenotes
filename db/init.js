const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.NODE_ENV === 'sqlite',
    storage: process.env.NODE_ENV === './db/dev.sqlite',
  }
);

// Import models
const models = {
  Item: require('../models/item')(sequelize),
  Relation: require('../models/relation')(sequelize),
  Release: require('../models/release')(sequelize),
};

// Establish associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Sync database
sequelize
  .sync({ force: process.env.DB_SYNC_FORCE === 'true' })
  .then(() => console.log('Database synced successfully.'))
  .catch((err) => console.error('Error syncing database:', err));

module.exports = { sequelize, models };