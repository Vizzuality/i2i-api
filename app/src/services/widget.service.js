const logger = require('logger');
const sequelize = require('models').sequelize;

/**
* Data sample
* [{"category":"rural","position":"female","value":71}]
*/

class WidgetService {

  // eslint-disable-next-line no-unused-vars
  async getWidget(indicatorId, isos, filter) {
    logger.info('Get widget agregated by gender');

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

  // eslint-disable-next-line no-unused-vars
  async getHeatmap(indicatorId, isos, filter) {
    logger.info('Get widget agregated by gender and age');

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
      c as
      (
        select * 
        from answers 
        where indicator_id = 'age'
      )
      ,
      result as 
      (
        select a.value as gender,
          c.value as age,
          b.value as ${indicatorId},
          a.weight,
          b.iso,
          b.year,
          sum(a.weight) over() as total
        from a 
        inner join b 
          on a.row_id = b.row_id
        inner join c 
          on a.row_id = c.row_id
        group by a.weight, a.value, b.value, c.value, b.iso, b.year
      )
      select sum(weight) as value,
        gender,
        age,
        ${indicatorId} as category,
        iso,
        year,
        (sum(weight) * 100 / total) as percentage
      from result 
      where iso = '${iso}' 
        and year = ${year}
        and ${indicatorId} != ''
      group by gender,
        age,
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
