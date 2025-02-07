const sequelize = require('./sequelize');
const Item = require('../models/item')(sequelize);
const Relation = require('../models/relation')(sequelize);
const Release = require('../models/release')(sequelize);

Item.associate({ Release, Relation });
Relation.associate({ Item });
Release.associate({ Item });

module.exports = { sequelize, Item, Relation, Release };