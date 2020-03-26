module.exports = function (sequelize, DataTypes) {
    const country4year = sequelize.define('country4year', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        year: {
            type: DataTypes.INTEGER
        },
        total_msme: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        total: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        dataUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'data_url'
        }
    }, {
            underscored: true,
            tableName: 'country_4_years',
            classMethods: {
                associate: (models) => {
                    country4year.belongsTo(models.country, {
                        onDelete: 'CASCADE',
                        foreignKey: {
                            name: 'country_id',
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
