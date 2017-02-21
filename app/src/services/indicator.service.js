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
            attributes: ['iso', 'year', 'indicatorId', 'childIndicatorId', 'answerId', 'value', sequelize.fn('SUM', sequelize.col('weight'))],
            where: {
                year: parseInt(year, 10),
                iso
            },
            group: ['iso', 'year', 'indicatorId', 'childIndicatorId', 'answerId', 'value'],
            order: ['indicatorId']
        });
        return result.map((el) => {
            el.percentage = (el.sum / total) * 100;
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

    async getIndicator(indicatorId, filters) {
        const totals = {};
        let where = {
            indicatorId
        };
        logger.debug(filters);
        if (filters && Object.keys(filters).length > 0) {
            const tuples = [];
            logger.debug('filters', filters);
            for (let i = 0, length = filters.length; i < length; i++) {
                const total = await IndicatorService.getTotal(filters[i].iso, filters[i].year);
                tuples.push(Object.assign({}, filters[i]));
                totals[`${filters[i].iso}-${filters[i].year}`] = total;
            }
            where = {
                $and: [where, {
                    $or: tuples
                }]
            };
        }
        logger.debug('totals', totals);
        const result = await AnswerModel.findAll({
            raw: true,
            attributes: ['iso', 'year', 'indicatorId', 'childIndicatorId', 'answerId', 'value', sequelize.fn('SUM', sequelize.col('weight')), sequelize.fn('COUNT', sequelize.col('id'))],
            where,
            group: ['iso', 'year', 'indicatorId', 'childIndicatorId', 'answerId', 'value'],
            order: ['indicatorId']
        });

        return result.map((el) => {
            if (totals[`${el.iso}-${el.year}`]){
                el.percentage = (el.sum / totals[`${el.iso}-${el.year}`]) * 100;
            }
            return el;
        });
    }

}

module.exports = new IndicatorService();
