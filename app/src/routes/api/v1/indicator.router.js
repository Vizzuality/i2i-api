const Router = require('koa-router');
const indicatorService = require('services/indicator.service');
const indicators = require('data/indicators.json');
const logger = require('logger');

const router = new Router({
    prefix: '/indicator',
});

class IndicatorRouter {

    static async getIndicatorsByCountryAndYear(ctx) {
        const result = await indicatorService.getIndicatorsByCountryAndYear(ctx.params.country, ctx.params.year, ctx.query.where);
        ctx.body = {
            data: result
        };
    }

    static async getIndicator(ctx) {
        const isos = Object.keys(ctx.query);
        const isoFilter = [];
        for (let i = 0, length = isos.length; i < length; i++) {
            if (isos[i] !== 'filter'){
                isoFilter.push({
                    iso: isos[i],
                    year: parseInt(ctx.query[isos[i]], 10)
                });
            }
        }

        const result = await indicatorService.getIndicator(ctx.params.indicatorId, isoFilter, ctx.query.filter);
        ctx.body = {
            data: result,
            title: indicators[ctx.params.indicatorId]
        };
    }

    static async getListIndicators(ctx) {
        logger.info('Obtaining indicators');
        ctx.body = Object.keys(indicators);
    }

}

router.get('/:indicatorId', IndicatorRouter.getIndicator);
router.get('/:country/:year', IndicatorRouter.getIndicatorsByCountryAndYear);
router.get('/', IndicatorRouter.getListIndicators);


module.exports = router;
