const logger = require('logger');
const config = require('config');
const Router = require('koa-router');
const GeneralValidator = require('validators/general.validator');
const LoadDatasetService = require('services/load-dataset.service');
const CountryModel = require('models').country;
const Country4YearModel = require('models').country4year;
const OriginalAnswerModel = require('models').originalAnswer;
const json2csv = require('json2csv');
const passThrough = require('stream').PassThrough;
const cache = require('cache');
const auth = require('security');

const router = new Router({
  prefix: '/country',
});

class CountryRouter {

  static async get(ctx) {
    logger.info('Obtaining all countries with last year');
    const query = {
      include: [{
        model: Country4YearModel,
        order: [
                    ['year', 'DESC']
        ]
      }]
    };
    if (ctx.query.lastyear && ctx.query.lastyear === 'true') {
      query.include[0].limit = 1;
    }

    const result = await CountryModel.findAll(query);

    ctx.body = result.map((el) => {
      const obj = el.get({
        plain: true
      });
      if (ctx.query.lastyear && ctx.query.lastyear === 'true') {
        obj.year = [obj.country4years[0]];
      } else {
        obj.year = obj.country4years;
      }
      delete obj.country4years;
      return obj;
    });

  }

  static async getByIsoAndYear(ctx) {
    logger.info(`Obtaining country ${ctx.params.iso} and year ${ctx.params.year}`);
    const result = await CountryModel.findAll({
      where: {
        iso: ctx.params.iso
      },
      include: [{
        model: Country4YearModel,
        where: {
          year: ctx.params.year
        }
      }]
    });
    if (!result || result.length === 0) {
      ctx.throw(404, 'Not found');
      return;
    }
    ctx.body = result.map((el) => {
      const obj = el.get({
        plain: true
      });
      obj.year = obj.country4years[0];
      delete obj.country4years;
      return obj;
    });
  }

  static async getByIso(ctx) {
    logger.info(`Obtaining country ${ctx.params.iso} and year ${ctx.params.year}`);
    const result = await CountryModel.findAll({
      where: {
        iso: ctx.params.iso
      },
      include: [{
        model: Country4YearModel
      }]
    });
    if (!result || result.length === 0) {
      ctx.throw(404, 'Not found');
      return;
    }
    ctx.body = result.map((el) => {
      const obj = el.get({
        plain: true
      });
      obj.years = obj.country4years;
      delete obj.country4years;
      return obj;
    });
  }

  static async create(ctx) {
    logger.info('Creating country and year', ctx.request.body);
    logger.debug('Checking if the country exists');
    let exists = await CountryModel.findAll({
      attributes: ['id'],
      where: {
        iso: ctx.request.body.iso
      }
    });
    if (!exists || exists.length === 0) {
      exists = await CountryModel.create({
        name: ctx.request.body.name,
        iso: ctx.request.body.iso,
        mapUrl: ctx.request.body.mapUrl
      });
    } else {
      exists = exists[0];
    }
    await Country4YearModel.create({
      countryId: exists.id,
      year: ctx.request.body.year,
      total: ctx.request.body.total,
      total_msme: ctx.request.body.total_msme,
      dataUrl: ctx.request.body.dataUrl
    });
    const data = await CountryModel.findAll({
      where: {
        id: exists.id
      },
      include: [{
        model: Country4YearModel,
        where: {
          year: ctx.request.body.year
        },
        limit: 1
      }]
    });
    ctx.body = data.map((el) => {
      const obj = el.get({
        plain: true
      });
      obj.year = obj.country4years[0];
      delete obj.country4years;
      return obj;
    })[0];
  }

  static async uploadDataset(ctx) {
    logger.info(`Uploading dataset to country ${ctx.params.iso} and year ${ctx.params.year}`);
    logger.debug('ctx', ctx.request.body);

    const loadDataset = new LoadDatasetService(ctx.params.iso, ctx.params.year, ctx.request.body.files.json.path, ctx.request.body.files.csv.path);
    await loadDataset.start();
    ctx.body = {
      ok: 1
    };
    cache.clear();
  }

  static async downloadDataset(ctx) {
    logger.info(`Downloading dataset to country ${ctx.params.iso} and year ${ctx.params.year}`);

    const results = await OriginalAnswerModel.findAll({
      where: {
        iso: ctx.params.iso,
        year: parseInt(ctx.params.year, 10)
      },
      raw: true
    });
    ctx.body = passThrough();
    ctx.set('Content-disposition', `attachment; filename=${ctx.params.iso}-${ctx.params.year}.csv`);
    ctx.set('Content-type', 'text/csv');
    let first = true;
    results.map((data) => {
      const csv = json2csv({
        data: data.answer || {},
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

  static async updateIsoAndYear(ctx) {
    logger.info('Updating country4iso');
    const country = await CountryModel.findAll({
      where: {
        iso: ctx.params.iso
      }
    });
    if (!country || country.length === 0) {
      ctx.throw(404, 'Country not found');
    }

    const updateObj = {};
    if (ctx.request.body.total) {
      updateObj.total = ctx.request.body.total;
    }
    if (ctx.request.body.total_msme) {
      updateObj.total_msme = ctx.request.body.total_msme;
    }
    if (ctx.request.body.dataUrl) {
      updateObj.dataUrl = ctx.request.body.dataUrl;
    }
    await Country4YearModel.update(updateObj, {
      where: {
        countryId: country[0].id,
        year: ctx.params.year
      }
    });

    await CountryRouter.getByIsoAndYear(ctx);
  }

  static async updateCountry(ctx) {
    logger.info('Updating country');
    const country = await CountryModel.findAll({
      where: {
        iso: ctx.params.iso
      }
    });
    if (!country || country.length === 0) {
      ctx.throw(404, 'Country not found');
    }

    const updateObj = {};
    if (ctx.request.body.mapUrl) {
      updateObj.mapUrl = ctx.request.body.mapUrl;
    }
    await CountryModel.update(updateObj, {
      where: {
        iso: ctx.params.iso
      }
    });

    await CountryRouter.getByIso(ctx);
  }


}

async function checkExists(ctx, next) {
  const result = await CountryModel.findAll({
    where: {
      iso: ctx.request.body.iso
    },
    include: [{
      model: Country4YearModel,
      where: {
        year: ctx.request.body.year
      }
    }]
  });
  if (result && result.length > 0) {
    ctx.throw(400, 'Country and year duplicated');
    return;
  }
  await next();
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

router.get('/', cached, CountryRouter.get);
router.post('/', auth, GeneralValidator.create, checkExists, CountryRouter.create);
router.get('/:iso', cached, CountryRouter.getByIso);
router.patch('/:iso', auth, CountryRouter.updateCountry);
router.get('/:iso/:year', cached, CountryRouter.getByIsoAndYear);
router.patch('/:iso/:year', auth, CountryRouter.updateIsoAndYear);
router.post('/:iso/:year/dataset', auth, checkExists, GeneralValidator.uploadDataset, CountryRouter.uploadDataset);
router.get('/:iso/:year/download', cached, CountryRouter.downloadDataset);

module.exports = router;
