const logger = require('logger');
const sequelize = require('models').sequelize;

/**
* Data sample
* [{"category":"rural","position":"female","value":71}]
*/

class WidgetService {

  async getWidget(indicatorId, isos, analyzeIndicator, filters) {
    logger.info('Get widget agregated by gender');

    if (!isos || isos.length === 0) return null;

    const { iso, year } = isos[0];

    // By default this endpoint should be aggregated by gender indicator
    const items = [{ indicatorId: 'gender' }, { indicatorId }];
    const filtersParams = filters && JSON.parse(filters);
    if (analyzeIndicator) {
      items.push({ indicatorId: analyzeIndicator });
    }
    if (filtersParams && filtersParams.length) {
      filtersParams.forEach((f) => {
        if (f.indicatorId === indicatorId) {
          const ind = items.find((i) => i.indicatorId === indicatorId);
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
    const groupByQuery = items.map(({ indicatorId }) => (`${indicatorId}.value`)).join(', ');
    const indicators = items.map(({ indicatorId }) => indicatorId).join(', ');

    const query = `
      with ${withQuery},
      result as (
        select ${selectQuery},
          ${mainTable}.weight,
          ${mainTable}.iso,
          ${mainTable}.year,
          sum(${mainTable}.weight) over() as total
        from ${mainTable}
        ${joinQuery}
        group by ${groupByQuery},
          ${mainTable}.weight,
          ${mainTable}.iso,
          ${mainTable}.year
      ),
      calculations as (
        select ${indicators},
          iso,
          year,
          sum(weight) as value,
          (sum(weight) * 100 / total) as percentage
        from result
        where iso = '${iso}'
          and year = ${year}
        group by ${indicators},
          iso,
          year,
          total
      )
      select * from calculations
    `;
    const result = await sequelize.query(query);

    return result;
  }

  // eslint-disable-next-line no-unused-vars
  async getHeatmap(indicatorId, isos, analyzeIndicator, filters) {
    logger.info('Get widget agregated by gender and age');

    if (!isos || isos.length === 0) return null;

    const { iso, year } = isos[0];

    // By default this endpoint should be aggregated by gender indicator
    const items = [{ indicatorId: 'gender' }, { indicatorId }];
    const filtersParams = filters && JSON.parse(filters);

    // If there is not a analyze indicator active it will be aggregated by age
    if (analyzeIndicator) {
      items.push({ indicatorId: analyzeIndicator });
    } else {
      items.push({ indicatorId: 'age' });
    }

    if (filtersParams && filtersParams.length) {
      filtersParams.forEach((f) => items.push(f));
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
    const groupByQuery = items.map(({ indicatorId }) => (`${indicatorId}.value`)).join(', ');
    const indicators = items.map(({ indicatorId }) => indicatorId).join(', ');

    const query = `
      with ${withQuery},
      result as (
        select ${selectQuery},
          ${mainTable}.weight,
          ${mainTable}.iso,
          ${mainTable}.year,
          sum(${mainTable}.weight) over() as total
        from ${mainTable}
        ${joinQuery}
        group by ${groupByQuery},
          ${mainTable}.weight,
          ${mainTable}.iso,
          ${mainTable}.year
      ),
      calculations as (
        select ${indicators},
          iso,
          year,
          sum(weight) as value,
          (sum(weight) * 100 / total) as percentage
        from result
        where iso = '${iso}'
          and year = ${year}
        group by ${indicators},
          iso,
          year,
          total
      )
      select * from calculations
    `;
    const result = await sequelize.query(query);

    return result;
  }

}

module.exports = new WidgetService();
