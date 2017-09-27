module.exports = function (sequelize, DataTypes) {
    const originalAnswer = sequelize.define('originalAnswer', {
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
        tableName: 'original_answer',
        classMethods: {
            associate: (models) => {
                originalAnswer.belongsTo(models.country4year, {
                    onDelete: 'CASCADE',
                    foreignKey: {
                        allowNull: false
                    }
                });
            }
        }
    });

    return originalAnswer;
};
