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
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at'
        }
    }, {
        timestamps: false,
        classMethods: {
            associate: (models) => {
                region.hasMany(models.region_4_year);
            }
        }
    });

    return region;
};
