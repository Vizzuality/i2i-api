module.exports = (sequelize, DataTypes) => {
  const region4year = sequelize.define('region4year', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    year: {
      type: DataTypes.INTEGER
    },
    total: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    dataUrl: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    classMethods: {
      associate: (models) => {
        region4year.belongsTo(models.region, {
          onDelete: 'CASCADE',
          foreignKey: {
            allowNull: false
          }
        });
        region4year.hasMany(models.answerRegion);
        region4year.hasMany(models.originalAnswerRegion);
      }
    }
  });

  return region4year;
};
