const auth = require('koa-basic-auth');
const config = require('config');

module.exports = auth({ name: config.get('auth.username'), pass: config.get('auth.password') });
