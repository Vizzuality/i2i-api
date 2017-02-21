module.exports = function (sequelize, DataTypes) {
    const country4year = sequelize.define('country4year', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        year: {
            type: DataTypes.INTEGER,
            unique: true
        },
        total: {
            type: DataTypes.DOUBLE,
            allowNull: true
        }
    }, {
        classMethods: {
            associate: (models) => {
                country4year.belongsTo(models.country, {
                    onDelete: 'CASCADE',
                    foreignKey: {
                        allowNull: false
                    }
                });
                country4year.hasMany(models.answer);
                country4year.hasMany(models.originalAnswer);
            }
        }
    });

    return country4year;
};
