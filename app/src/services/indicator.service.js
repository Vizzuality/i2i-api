const logger = require('logger');
const Pool = require('pg').Pool;


const configDB = {
    host: process.env.POSTGRES_PORT_5432_TCP_ADDR,
    port: process.env.POSTGRES_PORT_5432_TCP_PORT,
    user: process.env.I2I_POSTGRES_1_ENV_POSTGRES_USER,
    password: process.env.I2I_POSTGRES_1_ENV_POSTGRES_PASSWORD,
    database: process.env.I2I_POSTGRES_1_ENV_POSTGRES_DB
};

class IndicatorService {

    constructor() {
        logger.info('Connecting to Postgres');
        this.pool = new Pool(configDB);
    }

    async getIndicatorsByCountryAndYear(country, year, where) {
        const result = await this.pool.query(`select 
                indicator_id, 
                child_indicator_id, 
                answer_id, 
                value, 
                count(*)::int as count
            from answer 
            where 
                year = ${year} and country = '${country}' 
                ${where ? `AND row_id in (select row_id from answer where ${where})` : ''}
            group by indicator_id, child_indicator_id, answer_id, value 
            order by indicator_id`);
        if (!result || !result.rows) {
            return [];
        }
        return result.rows;
    }

    async getIndicator(indicatorId, where) {
        const result = await this.pool.query(`select 
                indicator_id, 
                child_indicator_id, 
                answer_id, 
                value, 
                count(*)::int as count
            from answer 
            where 
                indicator_id = ${indicatorId} 
                ${where ? `AND row_id in (select row_id from answer where ${where})` : ''}
            group by indicator_id, child_indicator_id, answer_id, value 
            order by indicator_id`);
        if (!result || !result.rows) {
            return [];
        }
        return result.rows;
    }

}

module.exports = new IndicatorService();
