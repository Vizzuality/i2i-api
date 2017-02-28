const logger = require('logger');
const AnswerModel = require('models').answer;
const Country4YearModel = require('models').country4year;
const CountryModel = require('models').country;
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

    static async getRowIds(filters) {
        const newFilter = [];
        
        const sql = 'SELECT row_id from answers where indicator_id = ? and value in (?)';
        let resultSql = '';
        const replacements = [];
        for(let i = 0, length = filters.length; i < length; i++){
            if (i === 0) {
                resultSql += sql;
            } else {
                resultSql += ' INTERSECT ' + sql;
            }
            replacements.push(filters[i].indicatorId);
            replacements.push(filters[i].value);
        }
        logger.debug('Filters', resultSql, replacements);

        const result = await sequelize.query(resultSql, {replacements, type: sequelize.QueryTypes.SELECT });
        logger.debug('Result rawid', result);

        return result.map((el) => el.row_id);
    }

    async getIndicator(indicatorId, isos, filter) {
        logger.info('Get indicators');
        const totals = {};
        let where = {
            indicatorId
        };
        if (filter) {
            let rowids = await IndicatorService.getRowIds(JSON.parse(filter));
            where.rowId = {
                $in: rowids
            };
        }
        
        logger.debug(isos);
        if (isos && Object.keys(isos).length > 0) {
            const tuples = [];
            for (let i = 0, length = isos.length; i < length; i++) {
                const total = await IndicatorService.getTotal(isos[i].iso, isos[i].year);
                tuples.push(Object.assign({}, isos[i]));
                totals[`${isos[i].iso}-${isos[i].year}`] = total;
            }
            where = {
                $and: [where, {
                    $or: tuples
                }]
            };
        }

        const result = await AnswerModel.findAll({
            raw: true,
            attributes: ['iso', 'year', 'indicatorId', 'childIndicatorId', 'answerId', 'value', sequelize.fn('SUM', sequelize.col('weight')), sequelize.fn('COUNT', sequelize.col('id'))],
            where,
            group: ['iso', 'year', 'indicatorId', 'childIndicatorId', 'answerId', 'value'],
            order: ['indicatorId']
        });

        return result.map((el) => {
            if (totals[`${el.iso}-${el.year}`]) {
                el.percentage = (el.sum / totals[`${el.iso}-${el.year}`]) * 100;
            }
            el.count = parseInt(el.count, 10);
            return el;
        });
    }

}

module.exports = new IndicatorService();
