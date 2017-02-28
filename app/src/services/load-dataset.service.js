const logger = require('logger');
const fs = require('fs');
const csv = require('fast-csv');
const CountryModel = require('models').country;
const Country4YearModel = require('models').country4year;
const AnswerModel = require('models').answer;
const OriginalAnswerModel = require('models').originalAnswer;

function* generateId() {
    let id = 0;
    while (true) {
        yield id++;
    }
}

class LoadDatasetService {

    constructor(iso, year, jsonFile, csvFile) {
        this.iso = iso;
        this.year = year;
        this.json = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        this.columns = Object.keys(this.json.indicators);
        this.weightColumn = this.json.weightColumn;
        this.csvFile = csvFile;
        this.getId = generateId();
    }
    async removeOldData() {
        logger.debug('Removing old data');
        await AnswerModel.destroy({
            where: {
                country4yearId: this.country4yearId
            }
        });
        await OriginalAnswerModel.destroy({
            where: {
                country4yearId: this.country4yearId
            }
        });
    }

    async insertOriginalAnswer(data, rowId) {
        logger.debug('Saving original answer');
        await OriginalAnswerModel.create({
            answer: data,
            rowId,
            year: this.year,
            iso: this.iso,
            country4yearId: this.country4yearId
        });
    }

    async insertAnswers(data, rowId) {
        logger.debug('Saving answer');
        const answers = [];
        for (let i = 0, length = this.columns.length; i < length; i++) {
            const col = this.json.indicators[this.columns[i]];
            answers.push({
                rowId,
                year: this.year,
                iso: this.iso,
                childIndicatorId: col.childIndicatorId,
                answerId: col.answerId,
                indicatorId: col.indicatorId,
                country4yearId: this.country4yearId,
                weight: parseFloat(data[this.weightColumn]),
                value: data[this.columns[i]] ? data[this.columns[i]].trim() : ''
            });
        }
        await AnswerModel.bulkCreate(answers);
    }

    async readCSV() {
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(this.csvFile)
                .pipe(csv({
                    headers: true,
                    discardUnmappedColumns: true
                }))
                .on('data', (data) => {
                    stream.pause();

                    (async() => {
                        logger.debug('Insert new data');
                        const rowId = this.getId.next().value;
                        await this.insertOriginalAnswer(data, rowId);
                        await this.insertAnswers(data, rowId);

                    })().then(() => stream.resume(), (err) => {
                        stream.end();
                        logger.error('Error saving', err);
                    });
                })
                .on('error', (err) => reject(err))
                .on('end', () => {
                    resolve();
                });
        });
    }

    async start() {
        this.country4year = await Country4YearModel.findAll({
            where: {
                year: this.year
            },
            include: [{
                model: CountryModel,
                where: {
                    iso: this.iso
                }
            }]
        });
        if (!this.country4year || this.country4year.length === 0) {
            throw new Error('Country and year not found');
        }
        this.country4yearId = this.country4year[0].id;
        await this.removeOldData();
        await this.readCSV();
        logger.info('Finished successfully');
    }

}

module.exports = LoadDatasetService;
