const logger = require('logger');
const Router = require('koa-router');
const GeneralValidator = require('validators/general.validator');
const LoadDatasetService = require('services/load-dataset.service');
const CountryModel = require('models').country;
const Country4YearModel = require('models').country4year;

const router = new Router({
    prefix: '/country',
});

class CountryRouter {

    static async get(ctx) {
        logger.info('Obtaining all countries with last year');
        const result = await CountryModel.findAll({
            include: [{
                model: Country4YearModel,
                order: [
                    ['year', 'DESC']
                ],
                limit: 1
            }]
        });
        ctx.body = result.map((el) => {
            const obj = el.get({
                plain: true
            });
            obj.year = obj.country4years[0];
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
                iso: ctx.request.body.iso
            });
        } else {
            exists = exists[0];
        }
        await Country4YearModel.create({
            countryId: exists.id,
            year: ctx.request.body.year,
            total: ctx.request.body.total
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

router.get('/', CountryRouter.get);
router.post('/', GeneralValidator.create, checkExists, CountryRouter.create);
router.get('/:iso/:year', CountryRouter.getByIsoAndYear);
router.post('/:iso/:year/dataset', checkExists, GeneralValidator.uploadDataset, CountryRouter.uploadDataset);


module.exports = router;
