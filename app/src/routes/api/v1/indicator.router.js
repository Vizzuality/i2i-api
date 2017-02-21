const Router = require('koa-router');
const indicatorService = require('services/indicator.service');

const router = new Router({
    prefix: '/indicator',
});

class HiRouter {

    static async getIndicatorsByCountryAndYear(ctx) {
        const result = await indicatorService.getIndicatorsByCountryAndYear(ctx.params.country, ctx.params.year, ctx.query.where);
        ctx.body = {
            data: result
        };
    }

    static async getIndicator(ctx) {
        const isos = Object.keys(ctx.query);
        const filters = [];
        for (let i = 0, length = isos.length; i < length; i++) {
            filters.push({
                iso: isos[i],
                year: parseInt(ctx.query[isos[i]], 10)
            });
        }

        const result = await indicatorService.getIndicator(ctx.params.indicatorId, filters);
        ctx.body = {
            data: result
        };
    }

}

router.get('/:indicatorId', HiRouter.getIndicator);
router.get('/:country/:year', HiRouter.getIndicatorsByCountryAndYear);


module.exports = router;
