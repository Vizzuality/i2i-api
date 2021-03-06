const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(module.filename);
const config = require('config');
const logger = require('logger');
const db = {};
const sequelize = new Sequelize(
    config.get('database.database'),
    config.get('database.user'),
    config.get('database.password'), {
        host: config.get('database.host'),
        port: config.get('database.port'),
        dialect: 'postgres',
        // eslint-disable-next-line no-console
        logging: config.get('logger.level') === 'debug' ? console.log : false,
        pool: {
            max: 20,
            min: 0,
            idle: 10000
        }
    }
);


fs
    .readdirSync(__dirname)
    .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
    .forEach((file) => {
        logger.debug('Loading model ', path.join(__dirname, file));
        const model = sequelize.import(path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
