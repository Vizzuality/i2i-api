module.exports = (sequelize, DataTypes) => {
    const region = sequelize.define('region', {
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
            tableName: 'regions',
            classMethods: {
                associate: (models) => {
                    region.hasMany(
                        models.region4year,
                        { foreignKey: 'region_id' }
                    );
                }
            }
        });

    return region;
};
