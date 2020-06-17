module.exports = (sequelize, DataTypes) => {
    const region4year = sequelize.define('region_4_year', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        year: {
            type: DataTypes.INTEGER
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
                region4year.belongsTo(models.region, {
                    onDelete: 'CASCADE',
                    foreignKey: {
                        allowNull: false
                    }
                });
                region4year.hasMany(models.answer_region);
                region4year.hasMany(models.original_answer_region);
            }
        }
    });

    return region4year;
};
