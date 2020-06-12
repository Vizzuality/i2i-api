class GeneralValidators {

    static async create(ctx, next) {
        ctx.checkBody('name').notEmpty();
        ctx.checkBody('iso').notEmpty();
        ctx.checkBody('year').isInt().toInt(10);

        if (ctx.request.body.total) ctx.checkBody('total').isFloat().toFloat();
        if (ctx.request.body.total_msme) ctx.checkBody('total_msme').isFloat().toFloat();

        if (ctx.errors && ctx.errors.length > 0) {
            ctx.body = {
                errors: ctx.errors
            };
            ctx.status = 400;
            return;
        }
        await next();
    }

    static async uploadDataset(ctx, next) {
        ctx.checkFile('json', true).notEmpty();
        ctx.checkFile('csv', true).notEmpty();

        if (ctx.errors && ctx.errors.length > 0) {
            ctx.body = {
                errors: ctx.errors
            };
            ctx.status = 400;
            return;
        }
        await next();
    }

}


module.exports = GeneralValidators;
