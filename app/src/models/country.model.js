module.exports = function (sequelize, DataTypes) {
    const country = sequelize.define('country', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        iso: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        mapUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'map_url'
        }
    }, {
            underscored: true,
            tableName: 'countries',
            classMethods: {
                associate: (models) => {
                    country.hasMany(models.country4year);
                }
            }
        });

    return country;
};
