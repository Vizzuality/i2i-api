module.exports = (sequelize, DataTypes) => {
    const answer = sequelize.define('answer', {
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
            underscored: true,
            classMethods: {
                associate: (models) => {
                    answer.belongsTo(models.country4year, {
                        onDelete: 'CASCADE',
                        foreignKey: {
                            name: 'country_4_year_id',
                            allowNull: false
                        }
                    });
                }
            }
        });

    return answer;
};
