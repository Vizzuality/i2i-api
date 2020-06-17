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
                country.hasMany(models.country_4_year);
            }
        }
    });

    return country;
};
