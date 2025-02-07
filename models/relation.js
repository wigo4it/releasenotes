const { Model, DataTypes } = require('sequelize');

class Relation extends Model {
  static associate(models) {
    this.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
  }
}

module.exports = (sequelize) => {
  Relation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: { type: DataTypes.STRING, allowNull: true },
      freshid: { type: DataTypes.STRING, allowNull: true },
      type: { type: DataTypes.STRING, allowNull: true },
      itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Items',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    {
      sequelize,
      modelName: 'Relation',
      tableName: 'Relations',
      timestamps: true,
    }
  );

  return Relation;
};
