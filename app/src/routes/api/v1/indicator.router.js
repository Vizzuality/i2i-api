const Router = require('koa-router');
const indicatorService = require('services/indicator.service');
const indicators = require('data/indicators.json');
const logger = require('logger');
const json2csv = require('json2csv');
const passThrough = require('stream').PassThrough;

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
            if (isos[i] !== 'filters') {
                isoFilter.push({
                    iso: isos[i],
                    year: parseInt(ctx.query[isos[i]], 10)
                });
            }
        }

        const result = await indicatorService.getIndicator(ctx.params.indicatorId, isoFilter, ctx.query.filters);
        ctx.body = {
            data: result,
            title: indicators[ctx.params.indicatorId]
        };
    }

    static async downloadExpandedIndicator(ctx) {
        const isos = Object.keys(ctx.query);
        const isoFilter = [];
        for (let i = 0, length = isos.length; i < length; i++) {
            if (isos[i] !== 'filters') {
                isoFilter.push({
                    iso: isos[i],
                    year: parseInt(ctx.query[isos[i]], 10)
                });
            }
        }

        const result = await indicatorService.downloadIndicator(ctx.params.indicatorId, isoFilter, ctx.query.filters);
        logger.info('Converting to csv');
        ctx.body = passThrough();
        ctx.set('Content-disposition', `attachment; filename=${ctx.params.indicatorId}.csv`);
        ctx.set('Content-type', 'text/csv');

        let first = true;
        result.map((data) => {
            const csv = json2csv({
                data: data || [],
                hasCSVColumnTitle: first
            });
            first = false;
            ctx.body.write(`${csv}\n`, {
                encoding: 'binary'
            });
            return null;
        });
        ctx.body.end();
    }

    static async getExpandedIndicator(ctx) {
        const isos = Object.keys(ctx.query);
        const isoFilter = [];
        for (let i = 0, length = isos.length; i < length; i++) {
            if (isos[i] !== 'filters') {
                isoFilter.push({
                    iso: isos[i],
                    year: parseInt(ctx.query[isos[i]], 10)
                });
            }
        }

        const result = await indicatorService.downloadIndicator(ctx.params.indicatorId, isoFilter, ctx.query.filters);
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
router.get('/:indicatorId/expanded', IndicatorRouter.getExpandedIndicator);
router.get('/:indicatorId/expanded/download', IndicatorRouter.downloadExpandedIndicator);
router.get('/:country/:year', IndicatorRouter.getIndicatorsByCountryAndYear);
router.get('/', IndicatorRouter.getListIndicators);


module.exports = router;
