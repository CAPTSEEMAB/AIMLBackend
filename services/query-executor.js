const Constants = require('../config/constants');
const { ConditionEvaluator, AggregateCalculator, DistinctHandler } = require('./query-helpers');
const Logger = require('../utils/logger');

class QueryExecutor {
  constructor(logger = null) {
    this.logger = logger || new Logger('QueryExecutor');
  }

  async execute(parsedQuery, data) {
    try {
      this.logger.debug('Starting query execution', { 
        selectColumns: parsedQuery.selectColumns,
        hasWhere: !!parsedQuery.whereClause 
      });

      let result = [...data];

      result = this.applyWhereFilter(result, parsedQuery.whereClause);
      result = this.applyGroupBy(result, parsedQuery, data);
      result = this.applyOrderBy(result, parsedQuery.orderClauses);
      result = this.applyDistinct(result, parsedQuery.distinct, parsedQuery.selectColumns);
      result = this.applyLimitOffset(result, parsedQuery.limit, parsedQuery.offset);
      result = this.applySelectColumns(result, parsedQuery.selectColumns, parsedQuery.groupColumns);

      this.logger.info(`Query executed successfully`, { rowsReturned: result.length });
      return result;
    } catch (error) {
      this.logger.error('Query execution failed', error);
      throw error;
    }
  }

  applyWhereFilter(data, whereClause) {
    if (!whereClause) return data;

    this.logger.debug('Applying WHERE filter');
    return data.filter(row => ConditionEvaluator.evaluate(row, whereClause));
  }

  applyGroupBy(data, parsedQuery, originalData) {
    const { groupColumns, selectColumns, havingClause, orderClauses } = parsedQuery;

    if (groupColumns.length === 0) {
      return this.applyAggregatesWithoutGroupBy(data, selectColumns);
    }

    this.logger.debug('Applying GROUP BY', { groupColumns });

    const orderByHasAggregates = orderClauses.some(order =>
      /count\s*\(\s*\*\s*\)|sum\s*\(|avg\s*\(|max\s*\(|min\s*\(/i.test(order)
    );

    const grouped = this.groupData(data, groupColumns);
    let result = this.computeGroupedAggregates(grouped, groupColumns, selectColumns);

    if (havingClause) {
      result = result.filter(row => ConditionEvaluator.evaluate(row, havingClause));
    }

    if (orderByHasAggregates && selectColumns[0] !== '*') {
      result = this.addMissingAggregates(result, orderClauses);
    }

    return result;
  }

  groupData(data, groupColumns) {
    const grouped = {};
    
    data.forEach(row => {
      const key = groupColumns.map(col => row[col]).join('||');
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
    });

    return grouped;
  }

  computeGroupedAggregates(grouped, groupColumns, selectColumns) {
    return Object.entries(grouped).map(([key, rows]) => {
      const groupRow = {};
      
      groupColumns.forEach(col => {
        groupRow[col] = rows[0][col];
      });

      selectColumns.forEach(col => {
        const colLower = col.toLowerCase().trim();
        if (groupColumns.some(gc => gc === colLower)) return;

        // Extract alias if present (e.g., "SUM(sales) AS total_sales" -> "total_sales")
        const asMatch = colLower.match(/\s+as\s+(\w+)$/);
        const alias = asMatch ? asMatch[1] : null;

        const aggregates = AggregateCalculator.calculateAggregates(rows, [col]);
        
        // If there's an alias, map the aggregated value to the alias key
        if (alias && aggregates) {
          const keyName = Object.keys(aggregates)[0];
          if (keyName) {
            aggregates[alias] = aggregates[keyName];
            delete aggregates[keyName];
          }
        }
        
        Object.assign(groupRow, aggregates);
      });

      return groupRow;
    });
  }

  applyAggregatesWithoutGroupBy(data, selectColumns) {
    if (!AggregateCalculator.hasAggregates(selectColumns)) {
      return data;
    }

    this.logger.debug('Applying aggregates without GROUP BY');
    const aggRow = AggregateCalculator.calculateAggregates(data, selectColumns);
    return [aggRow];
  }

  addMissingAggregates(result, orderClauses) {
    return result.map(row => {
      const updated = { ...row };

      if (!updated['count'] && orderClauses.some(o => /count\s*\(\s*\*\s*\)/i.test(o))) {
        updated['count'] = row['count'];
      }

      return updated;
    });
  }

  applyOrderBy(data, orderClauses) {
    if (orderClauses.length === 0) return data;

    this.logger.debug('Applying ORDER BY', { orderClauses });
    const result = [...data];

    orderClauses.forEach(orderClause => {
      const parts = orderClause.match(/(\w+)\s*(asc|desc)?/i);
      if (!parts) return;

      const field = parts[1].toLowerCase();
      const direction = parts[2] ? parts[2].toLowerCase() : 'asc';

      result.sort((a, b) => {
        const aVal = a[field] || 0;
        const bVal = b[field] || 0;

        if (direction === 'desc') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });
    });

    return result;
  }

  applyDistinct(data, distinct, selectColumns) {
    if (!distinct) return data;

    this.logger.debug('Applying DISTINCT');
    return DistinctHandler.applyDistinct(data, selectColumns);
  }

  applyLimitOffset(data, limit, offset) {
    if (!limit && offset === 0) return data;

    this.logger.debug('Applying LIMIT/OFFSET', { limit, offset });

    if (limit) {
      return data.slice(offset, offset + limit);
    } else if (offset) {
      return data.slice(offset);
    }

    return data;
  }

  applySelectColumns(data, selectColumns, groupColumns) {
    if (selectColumns[0] === '*') return data;

    this.logger.debug('Applying SELECT columns');

    return data.map(row => {
      const filtered = {};

      selectColumns.forEach(col => {
        const colLower = col.toLowerCase().trim();
        let alias = null;

        const asMatch = colLower.match(/\s+as\s+(\w+)$/);
        if (asMatch) {
          alias = asMatch[1];
        }

        if (colLower.includes('extract(')) {
          this.applyExtractFunction(filtered, row, colLower, alias);
        } else if (this.isAggregate(colLower)) {
          this.applyAggregateValue(filtered, row, colLower, alias);
        } else {
          const colKey = colLower.replace(/\s+as\s+.*/, '').trim();
          if (row[colKey] !== undefined) {
            filtered[alias || colKey] = row[colKey];
          }
        }
      });

      return filtered;
    });
  }

  applyExtractFunction(filtered, row, colLower, alias) {
    const extractMatch = colLower.match(Constants.EXTRACT_PATTERNS.EXTRACT_UNIT);
    if (!extractMatch) return;

    const unit = extractMatch[1].toUpperCase();
    const field = extractMatch[2];
    const date = new Date(row[field]);

    let value;
    if (unit === 'YEAR') value = date.getFullYear();
    else if (unit === 'MONTH') value = date.getMonth() + 1;
    else if (unit === 'DAY') value = date.getDate();

    if (alias) {
      filtered[alias] = value;
    } else {
      filtered[field] = value;
    }
  }

  applyAggregateValue(filtered, row, colLower, alias) {
    if (colLower.includes('sum(')) {
      const match = colLower.match(Constants.AGGREGATES.PATTERNS.SUM);
      if (match) {
        const field = match[1].toLowerCase();
        filtered[alias || field] = row[alias] ?? row[field];
      }
    } else if (colLower.includes('count(')) {
      filtered[alias || 'count'] = row[alias] ?? row['count'];
    } else if (colLower.includes('avg(')) {
      const match = colLower.match(Constants.AGGREGATES.PATTERNS.AVG);
      if (match) {
        const field = match[1].toLowerCase();
        filtered[alias || field] = row[alias] ?? row[field];
      }
    } else if (colLower.includes('max(')) {
      const match = colLower.match(Constants.AGGREGATES.PATTERNS.MAX);
      if (match) {
        const field = match[1].toLowerCase();
        filtered[alias || field] = row[alias] ?? row[field];
      }
    } else if (colLower.includes('min(')) {
      const match = colLower.match(Constants.AGGREGATES.PATTERNS.MIN);
      if (match) {
        const field = match[1].toLowerCase();
        filtered[alias || field] = row[alias] ?? row[field];
      }
    }
  }

  isAggregate(col) {
    return AggregateCalculator.hasAggregates([col]);
  }
}

module.exports = QueryExecutor;
