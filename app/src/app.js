const Koa = require('koa');
const logger = require('logger');
const koaLogger = require('koa-logger');
const config = require('config');
const loader = require('loader');
const convert = require('koa-convert');
const ErrorSerializer = require('serializers/error.serializer');
const models = require('models');
const cors = require('kcors');
const validate = require('koa-validate');

const koaBody = require('koa-body')({
    multipart: true,
    jsonLimit: '50mb',
    formLimit: '50mb',
    textLimit: '50mb'
});


const app = new Koa();
app.use(cors());
validate(app);
app.use(convert(koaBody));

app.use(async(ctx, next) => {
    try {
        await next();
    } catch (err) {
        let error = err;
        try {
            error = JSON.parse(err);
        } catch (e) {
            logger.error('Error parse');
        }
        ctx.status = error.status || 500;
        logger.error(error);
        ctx.body = ErrorSerializer.serializeError(ctx.status, error.message);
        if (process.env.NODE_ENV === 'prod' && this.status === 500) {
            ctx.body = 'Unexpected error';
        }
        ctx.response.type = 'application/vnd.api+json';
    }

});

app.use(koaLogger());
const cache = require('memory-cache');

app.use(require('koa-cash')({
    maxAge: 24 * 60 * 60 * 1000,
    get: key => cache.get(key),
    set: (key, value) => {
        cache.put(key, value, 24 * 60 * 60 * 1000);
    }
}));

loader.loadRoutes(app);

models.sequelize.sync({
    force: config.get('database.force')
}).then(() => {}, (err) => {
    logger.error(err);
    process.exit(1);
});

const instance = app.listen(process.env.PORT, () => {});
instance.setTimeout(10 * 60 * 1000);
logger.info('Server started in ', process.env.PORT);


module.exports = instance;
