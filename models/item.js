const { Model, DataTypes } = require('sequelize');

class Item extends Model {
  static associate(models) {
    this.belongsTo(models.Release, { foreignKey: 'releaseId', as: 'release' });
    this.hasMany(models.Relation, { foreignKey: 'itemId', as: 'relations' });
  }
}

module.exports = (sequelize) => {
  Item.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'System.Title',
        validate: { notEmpty: true },
      },
      areaPath: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'System.AreaPath',
      },
      workItemType: {
        type: DataTypes.ENUM('Bug', 'Product Backlog Item'),
        allowNull: false,
      },
      gemeente: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'dSZW.Socrates.Gemeente',
        defaultValue: 'g4',
      },
      servicepack: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        field: 'Custom.Servicepack',
        defaultValue: false,
      },
      releaseId: {
        type: DataTypes.INTEGER,
        allowNull: false, // Do NOT use `field` here
        references: {
          model: 'Releases',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userStory: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'Custom.UserStory',
      },
      acceptatiecriteria: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'Custom.Acceptatiecriteria',
      },
      stuurdatawijzigingen: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'Custom.Stuurdatawijzigingen',
      },
      batchwijzigingen: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'Custom.BatchwijzigingenofBatchparameterwijzigingen',
      },
      aandachtspunten: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'Custom.Aandachtspuntentesten',
      },
    },
    {
      sequelize,
      modelName: 'Item',
      tableName: 'Items',
      timestamps: true,
      indexes: [
        { fields: ['releaseId'] },
        { fields: ['workItemType'] },
      ],
    }
  );

  return Item;
};