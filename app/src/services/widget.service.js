const logger = require('logger');
const sequelize = require('models').sequelize;

/**
* Data sample
* [{"category":"rural","position":"female","value":71}]
*/

class WidgetService {

  // eslint-disable-next-line no-unused-vars
  async getIndicator(indicatorId, isos, filter) {
    logger.info('Get indicators');

    if (!isos || isos.length === 0) return null;

    const { iso, year } = isos[0];

    const result = await sequelize.query(`
      with a as
      (
        select * 
        from answers
        where indicator_id = 'gender'
      )
      ,
      b as
      (
        select * 
        from answers 
        where indicator_id = '${indicatorId}'
      )
      ,
      result as 
      (
        select a.value as gender,
          b.value as ${indicatorId},
          a.weight,
          b.iso,
          b.year,
          sum(a.weight) over() as total
        from a 
        inner join b 
          on a.row_id = b.row_id
        group by a.weight, a.value, b.value, b.iso, b.year
      )
      select sum(weight) as value,
        gender,
        ${indicatorId} as category,
        iso,
        year,
        (sum(weight) * 100 / total) as percentage
      from result 
      where iso = '${iso}' 
        and year = ${year}
        and ${indicatorId} != ''
      group by gender,
        ${indicatorId},
        iso,
        year,
        total
      order by category
    `);

    return result;
  }

}

module.exports = new WidgetService();
