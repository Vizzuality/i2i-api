const logger = require('logger');
const config = require('config');
const Router = require('koa-router');
const GeneralValidator = require('validators/general.validator');
const LoadDatasetService = require('services/load-dataset-region.service');
const RegionModel = require('models').region;
const Region4YearModel = require('models').region4year;
const OriginalAnswerModel = require('models').originalAnswerRegion;
const json2csv = require('json2csv');
const passThrough = require('stream').PassThrough;
const cache = require('cache');
const auth = require('security');

const router = new Router({
  prefix: '/region',
});

class RegionRouter {

  static async get(ctx) {
    logger.info('Obtaining all countries with last year');
    const query = {
      include: [{
        model: Region4YearModel,
        order: [
                    ['year', 'DESC']
        ]
      }]
    };
    if (ctx.query.lastyear && ctx.query.lastyear === 'true') {
      query.include[0].limit = 1;
    }

    const result = await RegionModel.findAll(query);

    ctx.body = result.map((el) => {
      const obj = el.get({
        plain: true
      });
      if (ctx.query.lastyear && ctx.query.lastyear === 'true') {
        obj.year = [obj.region4years[0]];
      } else {
        obj.year = obj.region4years;
      }
      delete obj.region4years;
      return obj;
    });

  }

  static async getByIsoAndYear(ctx) {
    logger.info(`Obtaining region ${ctx.params.iso} and year ${ctx.params.year}`);
    const result = await RegionModel.findAll({
      where: {
        iso: ctx.params.iso
      },
      include: [{
        model: Region4YearModel,
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
      obj.year = obj.region4years[0];
      delete obj.region4years;
      return obj;
    });
  }

  static async getByIso(ctx) {
    logger.info(`Obtaining region ${ctx.params.iso} and year ${ctx.params.year}`);
    const result = await RegionModel.findAll({
      where: {
        iso: ctx.params.iso
      },
      include: [{
        model: Region4YearModel
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
      obj.years = obj.region4years;
      delete obj.region4years;
      return obj;
    });
  }

  static async create(ctx) {
    logger.info('Creating region and year', ctx.request.body);
    logger.debug('Checking if the region exists');
    let exists = await RegionModel.findAll({
      attributes: ['id'],
      where: {
        iso: ctx.request.body.iso
      }
    });
    if (!exists || exists.length === 0) {
      exists = await RegionModel.create({
        name: ctx.request.body.name,
        iso: ctx.request.body.iso,
        mapUrl: ctx.request.body.mapUrl
      });
    } else {
      exists = exists[0];
    }
    await Region4YearModel.create({
      regionId: exists.id,
      year: ctx.request.body.year,
      total: ctx.request.body.total,
      dataUrl: ctx.request.body.dataUrl
    });
    const data = await RegionModel.findAll({
      where: {
        id: exists.id
      },
      include: [{
        model: Region4YearModel,
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
      obj.year = obj.region4years[0];
      delete obj.region4years;
      return obj;
    })[0];
  }

  static async uploadDataset(ctx) {
    logger.info(`Uploading dataset to region ${ctx.params.iso} and year ${ctx.params.year}`);
    logger.debug('ctx', ctx.request.body);

    const loadDataset = new LoadDatasetService(
            ctx.params.iso,
            ctx.params.year,
            ctx.request.body.files.json.path,
            ctx.request.body.files.csv.path
        );
    await loadDataset.start();
    ctx.body = {
      ok: 1
    };
    cache.clear();
  }

  static async downloadDataset(ctx) {
    logger.info(`Downloading dataset to region ${ctx.params.iso} and year ${ctx.params.year}`);

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
    logger.info('Updating region4iso');
    const region = await RegionModel.findAll({
      where: {
        iso: ctx.params.iso
      }
    });
    if (!region || region.length === 0) {
      ctx.throw(404, 'Region not found');
    }

    const updateObj = {};
    if (ctx.request.body.total) {
      updateObj.total = ctx.request.body.total;
    }
    if (ctx.request.body.dataUrl) {
      updateObj.dataUrl = ctx.request.body.dataUrl;
    }
    await Region4YearModel.update(updateObj, {
      where: {
        regionId: region[0].id,
        year: ctx.params.year
      }
    });

    await RegionRouter.getByIsoAndYear(ctx);
  }

  static async updateRegion(ctx) {
    logger.info('Updating region');
    const region = await RegionModel.findAll({
      where: {
        iso: ctx.params.iso
      }
    });
    if (!region || region.length === 0) {
      ctx.throw(404, 'Region not found');
    }

    const updateObj = {};
    if (ctx.request.body.mapUrl) {
      updateObj.mapUrl = ctx.request.body.mapUrl;
    }
    await RegionModel.update(updateObj, {
      where: {
        iso: ctx.params.iso
      }
    });

    await RegionRouter.getByIso(ctx);
  }


}

async function checkExists(ctx, next) {
  const result = await RegionModel.findAll({
    where: {
      iso: ctx.request.body.iso
    },
    include: [{
      model: Region4YearModel,
      where: {
        year: ctx.request.body.year
      }
    }]
  });
  if (result && result.length > 0) {
    ctx.throw(400, 'Region and year duplicated');
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

router.get('/', cached, RegionRouter.get);
router.post('/', auth, GeneralValidator.create, checkExists, RegionRouter.create);
router.get('/:iso', cached, RegionRouter.getByIso);
router.patch('/:iso', auth, RegionRouter.updateRegion);
router.get('/:iso/:year', cached, RegionRouter.getByIsoAndYear);
router.patch('/:iso/:year', auth, RegionRouter.updateIsoAndYear);
router.post('/:iso/:year/dataset', auth, checkExists, GeneralValidator.uploadDataset, RegionRouter.uploadDataset);
router.get('/:iso/:year/download', cached, RegionRouter.downloadDataset);

module.exports = router;
