const Router = require('koa-router');
const config = require('config');
const populationService = require('services/population.service');
const logger = require('logger');

const router = new Router({
  prefix: '/population',
});

class PopulationRouter {

  static async getPopulation(ctx) {
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

    const result = await populationService.getPopulation(isoFilter, ctx.query.filters);

    ctx.body = {
      data: result,
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

router.get('/', cached, PopulationRouter.getPopulation);


module.exports = router;
