const path = require('path');
const Router = require('koa-router');
const config = require('config');
const widgetService = require('services/widget.service');
const indicators = require(path.resolve(process.cwd(), process.env.INDICATORS_PATH));
const logger = require('logger');

const router = new Router({
  prefix: '/widget',
});

class WidgetRouter {

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

    const result = await widgetService.getIndicator(ctx.params.indicatorId, isoFilter, ctx.query.filters);

    ctx.body = {
      data: result,
      title: indicators[ctx.params.indicatorId]
    };
  }

}

const cached = async (ctx, next) => {
  if (config.get('cache') === 'yes') {
    if (await ctx.cashed()) {
      logger.info('Request cached');
      return;
    }
  }
  await next();
};

router.get('/:indicatorId', cached, WidgetRouter.getIndicator);


module.exports = router;
