const Router = require('koa-router');
const indicatorService = require('services/indicator.service');

const router = new Router({
    prefix: '/i2i',
});

class HiRouter {

    static async getIndicatorsByCountryAndYear(ctx) {
        const result = await indicatorService.getIndicatorsByCountryAndYear(ctx.params.country, ctx.params.year, ctx.query.where);
        ctx.body = {
            data: result
        };
    }

    static async getIndicator(ctx) {
        const result = await indicatorService.getIndicator(ctx.params.indicatorId, ctx.query.where);
        ctx.body = {
            data: result
        };
    }

}

router.get('/indicator/:indicatorId', HiRouter.getIndicator);
router.get('/indicator/:country/:year', HiRouter.getIndicatorsByCountryAndYear);


module.exports = router;
