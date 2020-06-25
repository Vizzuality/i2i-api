module.exports = (sequelize, DataTypes) => {
  const answer = sequelize.define('answerRegion', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    rowId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'row_id'
    },
    indicatorId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'indicator_id'
    },
    childIndicatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'child_indicator_id'
    },
    answerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'answer_id'
    },
    value: {
      type: DataTypes.STRING,
      allowNull: true
    },
    weight: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    iso: {
      type: DataTypes.STRING,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'answer_region',
    classMethods: {
      associate: (models) => {
        answer.belongsTo(models.region4year, {
          onDelete: 'CASCADE',
          foreignKey: {
            allowNull: false
          }
        });
      }
    }
  });

  return answer;
};
