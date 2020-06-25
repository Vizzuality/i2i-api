const logger = require('logger');
const fs = require('fs');
const csv = require('fast-csv');
const RegionModel = require('models').region;
const Region4YearModel = require('models').region4year;
const AnswerModel = require('models').answerRegion;
const OriginalAnswerModel = require('models').originalAnswerRegion;

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
        region4yearId: this.region4yearId
      }
    });
    await OriginalAnswerModel.destroy({
      where: {
        region4yearId: this.region4yearId
      }
    });
  }

  async insertOriginalAnswer(data) {
    logger.debug('Saving original answer');
    const answer = await OriginalAnswerModel.create({
      answer: data,
      year: this.year,
      iso: this.iso,
      region4yearId: this.region4yearId
    });
    return answer.id;
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
        region4yearId: this.region4yearId,
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

                    const rowId = await this.insertOriginalAnswer(data);
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
    this.region4year = await Region4YearModel.findAll({
      where: {
        year: this.year
      },
      include: [{
        model: RegionModel,
        where: {
          iso: this.iso
        }
      }]
    });
    if (!this.region4year || this.region4year.length === 0) {
      throw new Error('Region and year not found');
    }
    this.region4yearId = this.region4year[0].id;
    await this.removeOldData();
    await this.readCSV();
    logger.info('Finished successfully');
  }

}

module.exports = LoadDatasetService;
