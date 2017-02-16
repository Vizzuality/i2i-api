const Pool = require('pg').Pool;
const logger = require('logger');
const fs = require('fs');
const csv = require('fast-csv');
const path = require('path');
const argv = process.argv.slice(2);
let format = null;
let columns = null;

const configDB = {
    host: process.env.POSTGRES_PORT_5432_TCP_ADDR,
    port: process.env.POSTGRES_PORT_5432_TCP_PORT,
    user: process.env.I2I_API_POSTGRES_ENV_POSTGRES_USER,
    password: process.env.I2I_API_POSTGRES_ENV_POSTGRES_PASSWORD,
    database: process.env.I2I_API_POSTGRES_ENV_POSTGRES_DB
};

const pool = new Pool(configDB);

function * generateId() {
    let id = 0;
    while (true) {
        yield id++;
    }
}

const getId = generateId();

const config = {
    year: 2006,
    country: 'uganda'
};

async function insertOriginalAnswer(data, rowId) {
    logger.debug('Inserting original answer');
    await pool.query(`INSERT INTO original_answer (year, country, row_id, answer) VALUES ($1, $2, $3, $4)`, [config.year, config.country, rowId, JSON.stringify(data).replace(/'/g, '\'\'')]);
}

async function insertAnswer(data, rowId) {
    logger.debug('Inserting answers');
    let sql = 'INSERT INTO answer (year, country, row_id, indicator_id, child_indicator_id, answer_id, value) VALUES ';
    for (let i = 0, length = columns.length; i < length; i++) {
        const col = format[columns[i]];
        sql += `(${config.year}, '${config.country}', ${rowId}, ${col.indicatorId}, ${col.childIndicatorId}, ${col.answerId}, '${data[columns[i]] ? data[columns[i]] : ''}')`;
        if (i + 1 < length) {
            sql += ',';
        }
    }
    await pool.query(sql);
}

async function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath)
            .pipe(csv({
                headers: true,
                discardUnmappedColumns: true
            }))
            .on('data', (data) => {
                stream.pause();
                (async() => {
                    logger.debug('Insert new data');
                    const rowId = getId.next().value;
                    await insertOriginalAnswer(data, rowId);
                    await insertAnswer(data, rowId);
                })().then(() => stream.resume(), (err) => {
                    stream.end();
                    logger.error('Error saving', err);
                });
            })
            .on('end', () => {
                resolve();
            });
    });
}

async function createTable() {
    logger.info('Creating tables if they don\'t exist');
    logger.debug('Creating answer table');
    await pool.query(`CREATE TABLE IF NOT EXISTS answer (
            id SERIAL PRIMARY KEY     NOT NULL,
            year INT NOT NULL,
            country TEXT NOT NULL,
            row_id INT NOT NULL,
            indicator_id INT NOT NULL,
            child_indicator_id INT,
            answer_id INT,
            value TEXT
        )`);
    logger.debug('Creating original_answer table');
    await pool.query(`CREATE TABLE IF NOT EXISTS original_answer (
            id SERIAL PRIMARY KEY     NOT NULL,
            year INT NOT NULL,
            row_id INT NOT NULL,
            country TEXT NOT NULL,
            answer json
        )`);
}

async function removeOldData() {
    await pool.query(`DELETE FROM answer WHERE year = ${config.year} and country = '${config.country}'`);
    await pool.query(`DELETE FROM original_answer WHERE year = ${config.year} and country = '${config.country}'`);
}




async function run() {
    if (argv.length !== 4) {
        logger.info('Usage:script.js 2006 uganda <relativePath> <relativePathofAppSrc>');
        process.exit(0);
    }
    logger.info('Running ', argv[1], argv[0]);
    config.year = argv[0];
    config.country = argv[1];
    format = require(path.join(__dirname, argv[3]));
    columns = Object.keys(format);
    await createTable();
    await removeOldData();
    await readCSV(path.join(__dirname, argv[2]));
    logger.info('Successfully inserted');
}

run().then(() => logger.info('Successfully import', argv[1], argv[0]), (err) => logger.error('Error importing', argv[1], argv[0], err));
