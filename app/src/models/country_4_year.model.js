module.exports = function (sequelize, DataTypes) {
    const country4year = sequelize.define('country_4_year', {
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
                country4year.belongsTo(models.country, {
                    onDelete: 'CASCADE',
                    foreignKey: {
                        allowNull: false
                    }
                });
                country4year.hasMany(models.answer);
                country4year.hasMany(models.original_answer);
            }
        }
    });

    return country4year;
};
