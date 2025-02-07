const { Model, DataTypes } = require('sequelize');

class Release extends Model {
  static associate(models) {
    this.hasMany(models.Item, { foreignKey: 'releaseId', as: 'items' });
  }

  // Static method to parse year and month
  static parseNameForDate(name, applicatie) {
    const regex = /^(\d{4})\.(\d{3})$/;
    const match = name.match(regex);

    if (!match) {
      console.warn(`⚠️ Warning: Invalid format detected: "${name}"`);
      return { year: null, month: null };
    }

    const year = parseInt(match[1], 10);
    const version = parseInt(match[2], 10);
    let month = null;

    if (applicatie === 'Socrates') {
      if (version <= 20) month = 1;
      else month = Math.ceil((version - 10) / 10);
    } else if (applicatie === 'S&I') {
      month = version - 210 + 1;
    }

    if (month >= 1 && month <= 12) {
      return { year, month };
    } else {
      console.warn(`⚠️ Warning: Unrecognized versioning rule for "${name}"`);
      return { year, month: null };
    }
  }
}

module.exports = (sequelize) => {
  Release.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      applicatie: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Release',
      tableName: 'Releases',
      timestamps: true,
      hooks: {
        beforeValidate: (release) => {
          console.log(`🔍 Processing release: ${release.name} - App: ${release.applicatie}`);
          if (release.name && release.applicatie) {
            const { year, month } = Release.parseNameForDate(release.name, release.applicatie);
            console.log(`🛠 Extracted Year: ${year}, Month: ${month} from ${release.name}`);
            release.year = year;
            release.month = month;
          }
        },
      },
    }
  );

  return Release;
};