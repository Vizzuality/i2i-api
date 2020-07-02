const logger = require('logger');
const sequelize = require('models').sequelize;

class PopulationService {

  async getPopulation(isos, filters) {
    logger.info('Get population');

    if (!isos || isos.length === 0) return null;

    const { iso, year } = isos[0];

    // By default this endpoint should be aggregated by gender indicator
    const items = [{ indicatorId: 'gender' }];
    const filtersParams = filters && JSON.parse(filters);

    if (filtersParams && filtersParams.length) {
      filtersParams.forEach((f) => {
        const ind = items.find((i) => i.indicatorId === f.indicatorId);
        if (ind) {
          ind.value = f.value;
        } else {
          items.push(f);
        }
      });
    }

    const withQuery = items.map(({ indicatorId, value }) => {
      if (value) {
        const valuesQuery = value.join('\', \'');
        return `${indicatorId} as (
          select * from answers where indicator_id = '${indicatorId}' and value in ('${valuesQuery}')
        )`;
      }
      return `${indicatorId} as (select * from answers where indicator_id = '${indicatorId}')`;
    }).join(', ');
    const selectQuery = items.map(({ indicatorId }) => (`${indicatorId}.value as ${indicatorId}`)).join(', ');
    const mainTable = items[0].indicatorId;
    const joinQuery = items
      .slice(1, items.length)
      .map(({ indicatorId }) => (`inner join ${indicatorId} on ${mainTable}.row_id = ${indicatorId}.row_id`))
      .join(' ');

    const query = `
      with ${withQuery},
      result as (
        select ${selectQuery},
          ${mainTable}.weight,
          ${mainTable}.iso,
          ${mainTable}.year
        from ${mainTable}
        ${joinQuery}
      )
      select ${mainTable}, 
        sum(weight) as value,
        year,
        iso
      from result
      where iso = '${iso}'
        and year = ${year}
      group by ${mainTable}, year, iso
    `;
    const result = await sequelize.query(query);

    return result;
  }

}

module.exports = new PopulationService();
