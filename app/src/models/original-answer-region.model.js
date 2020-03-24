module.exports = (sequelize, DataTypes) => {
    const originalAnswer = sequelize.define('originalAnswerRegion', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        answer: {
            type: DataTypes.JSONB,
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
            tableName: 'original_answer_region',
            classMethods: {
                associate: (models) => {
                    originalAnswer.belongsTo(models.region4year, {
                        onDelete: 'CASCADE',
                        foreignKey: {
                            name: 'region_4_year_id',
                            allowNull: false
                        }
                    });
                }
            }
        });

    return originalAnswer;
};
