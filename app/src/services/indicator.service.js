const logger = require('logger');
const AnswerModel = require('models').answer;
const AnswerRegionModel = require('models').answerRegion;
const Country4YearModel = require('models').country4year;
const Region4YearModel = require('models').region4year;
const CountryModel = require('models').country;
const RegionModel = require('models').region;
const sequelize = require('models').sequelize;

class IndicatorService {

  async getIndicatorsByCountryAndYear(iso, year) {
    const total = await IndicatorService.getTotal(iso, year);
    const result = await AnswerModel.findAll({
      raw: true,
      attributes: ['iso', 'year', 'indicatorId', 'childIndicatorId', 'answerId', 'value', sequelize.fn('SUM', sequelize.col('weight')), sequelize.fn('COUNT', sequelize.col('id'))],
      where: {
        year: parseInt(year, 10),
        iso
      },
      group: ['iso', 'year', 'indicatorId', 'childIndicatorId', 'answerId', 'value'],
      order: ['indicatorId']
    });
    return result.map((el) => {
      el.percentage = (el.sum / total) * 100;
      el.count = parseInt(el.count, 10);
      return el;
    });
  }

  async getIndicatorsByRegionAndYear(iso, year) {
    const total = await IndicatorService.getTotal(iso, year);
    const result = await AnswerRegionModel.findAll({
      raw: true,
      attributes: ['iso', 'year', 'indicatorId', 'childIndicatorId', 'answerId', 'value', sequelize.fn('SUM', sequelize.col('weight')), sequelize.fn('COUNT', sequelize.col('id'))],
      where: {
        year: parseInt(year, 10),
        iso
      },
      group: ['iso', 'year', 'indicatorId', 'childIndicatorId', 'answerId', 'value'],
      order: ['indicatorId']
    });
    return result.map((el) => {
      el.percentage = (el.sum / total) * 100;
      el.count = parseInt(el.count, 10);
      return el;
    });
  }

  static async getTotal(iso, year) {
    const total = await Country4YearModel.findAll({
      attributes: ['total'],
      where: {
        year
      },
      include: [{
        model: CountryModel,
        where: {
          iso
        }
      }]
    });
    if (total && total.length === 1) {
      return total[0].total;
    }
    return null;
  }

  static async getTotalRegion(iso, year) {
    const total = await Region4YearModel.findAll({
      attributes: ['total'],
      where: {
        year
      },
      include: [{
        model: RegionModel,
        where: {
          iso
        }
      }]
    });
    if (total && total.length === 1) {
      return total[0].total;
    }
    return null;
  }

  static getQueryRowIds(filters) {
    let resultSql = '';
    for (let i = 0, length = filters.length; i < length; i++) {
      const where = {
        indicator_id: filters[i].indicatorId,
        value: filters[i].value
      };
      if (filters[i].childIndicatorId) {
        where.child_indicator_id = {
          $in: filters[i].childIndicatorId
        };
      }
      if (filters[i].answerId) {
        where.answer_id = {
          $in: filters[i].answer_id
        };
      }

      if (i === 0) {
        resultSql += sequelize.dialect.QueryGenerator.selectQuery('answers', {
          attributes: ['row_id'],
          where
        }).slice(0, -1);
      } else {
                // eslint-disable-next-line prefer-template
        resultSql += ' INTERSECT ' + sequelize.dialect.QueryGenerator.selectQuery('answers', {
          attributes: ['row_id'],
          where
        }).slice(0, -1);
      }
    }
    logger.debug('Query', resultSql.toString());
    return resultSql;
  }

  async downloadIndicator(indicatorId, isos, filter) {
    logger.info('Get indicators for download');
    let where = {
      indicator_id: indicatorId
    };
    if (filter) {
      logger.debug('Filter by indicatorid', filter);
      const query = IndicatorService.getQueryRowIds(JSON.parse(filter));
      where.row_id = {
        $in: sequelize.literal(`( ${query} )`)
      };
    }

    logger.debug(isos);
    if (isos && Object.keys(isos).length > 0) {
      const tuples = [];
      for (let i = 0, length = isos.length; i < length; i++) {
        tuples.push(Object.assign({}, isos[i]));
      }
      where = {
        $and: [where, {
          $or: tuples
        }]
      };
    }
    return AnswerModel.findAll({
      raw: true,
      attributes: ['iso', 'year', 'row_id', 'indicatorId', 'childIndicatorId', 'answerId', 'value', 'weight'],
      where,
      order: ['indicatorId']
    });
  }

  async getIndicators(indicators, isos, filter) {
    logger.info('Get Indicators');
    let where = {
      indicator_id: {
        $in: indicators
      }
    };
    let withQuery = '';
    if (filter) {
      logger.debug('Filter by ', filter);
      withQuery = `with p as (${IndicatorService.getQueryRowIds(JSON.parse(filter))})`;
      where.row_id = {
        $in: sequelize.literal(`(select row_id from p)`)
      };
    }

    if (isos && Object.keys(isos).length > 0) {
      const tuples = [];
      for (let i = 0, length = isos.length; i < length; i++) {
        tuples.push(Object.assign({}, isos[i]));
      }
      where = {
        $and: [where, {
          $or: tuples
        }]
      };
    }

    let resultQuery = sequelize.dialect.QueryGenerator.selectQuery('answers', {
      raw: true,
      attributes: ['iso', 'year', ['indicator_id', 'indicatorId'], ['child_indicator_id', 'childIndicatorId'], ['answer_id', 'answerId'], 'value', sequelize.fn('SUM', sequelize.col('weight')), sequelize.fn('COUNT', sequelize.col('id'))],
      where,
      group: ['iso', 'year', 'indicator_id', 'child_indicator_id', 'answer_id', 'value'],
      order: ['indicator_id']
    });

    if (withQuery) {
      resultQuery = `${withQuery} ${resultQuery}`;
    }

    const result = await await sequelize.query(resultQuery);

    const results = {};
    result[0].map((el) => {
      if (!results[el.rowId]) {
        results[el.rowId] = [];
      }
      results[el.rowId].push(el);
      return el;
    });
    return results;
  }

  async getIndicator(indicatorId, isos, filter) {
    logger.info('Get indicators');
    const totals = {};
    let where = {
      indicator_id: indicatorId
    };
    let withQuery = '';
    if (filter) {
      logger.debug('Filter by ', filter);
      withQuery = `with p as (${IndicatorService.getQueryRowIds(JSON.parse(filter))})`;
      where.row_id = {
        $in: sequelize.literal(`(select row_id from p)`)
      };
    }

    if (isos && Object.keys(isos).length > 0) {
      const tuples = [];
      for (let i = 0, length = isos.length; i < length; i++) {
        tuples.push(Object.assign({}, isos[i]));
      }
      where = {
        $and: [where, {
          $or: tuples
        }]
      };
    }

    let resultQuery = sequelize.dialect.QueryGenerator.selectQuery('answers', {
      raw: true,
      attributes: ['iso', 'year', ['indicator_id', 'indicatorId'], ['child_indicator_id', 'childIndicatorId'], ['answer_id', 'answerId'], 'value', sequelize.fn('SUM', sequelize.col('weight')), sequelize.fn('COUNT', sequelize.col('id'))],
      where,
      group: ['iso', 'year', 'indicator_id', 'child_indicator_id', 'answer_id', 'value'],
      order: ['indicator_id']
    });

    if (withQuery) {
      resultQuery = `${withQuery} ${resultQuery}`;
    }

    logger.debug('RESULT QUERY, ', resultQuery);

    const result = await await sequelize.query(resultQuery);


    logger.info('Obtaining totalss');
    const innerQuery = sequelize.dialect.QueryGenerator.selectQuery('answers', {
      attributes: ['iso', 'year', 'row_id', 'weight'],
      where,
      group: ['iso', 'year', 'row_id', 'weight']
    }).slice(0, -1);

    const totalQuery = await sequelize.query(`
            ${withQuery}
            select t.iso as iso, t.year as year, sum( t.weight) as sum
            from (
                ${innerQuery}
            ) as t
            group by t.iso, t.year;
        `, { type: sequelize.QueryTypes.SELECT });
    logger.info('Totals obtained', totalQuery);
    totalQuery.map((el) => {
      if (!totals[`${el.iso}-${el.year}`]) {
        totals[`${el.iso}-${el.year}`] = 0;
      }
      totals[`${el.iso}-${el.year}`] += el.sum;
      return el;
    });
    logger.debug('Calculating percentage');
    return result[0].map((el) => {
      if (totals[`${el.iso}-${el.year}`]) {
        el.percentage = (el.sum / totals[`${el.iso}-${el.year}`]) * 100;
      }
      el.count = parseInt(el.count, 10);
      return el;
    });
  }

}

module.exports = new IndicatorService();
