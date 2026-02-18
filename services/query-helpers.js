const Constants = require('../config/constants');

class ConditionEvaluator {
  static evaluate(row, clause) {
    try {
      if (clause.includes(' OR ')) {
        return clause.split(/\s+OR\s+/i).some(cond => 
          this.evaluate(row, cond.trim())
        );
      }

      if (clause.includes(' AND ')) {
        return clause.split(/\s+AND\s+/i).every(cond => 
          this.evaluate(row, cond.trim())
        );
      }

      const comparisonMatch = clause.match(/(\w+)\s*([<>=!]+|LIKE|ILIKE|IN|BETWEEN|IS)\s*(.+)/i);
      if (!comparisonMatch) return true;

      const [, field, operator, value] = comparisonMatch;
      return this.evaluateComparison(row, field, operator, value);
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return true;
    }
  }

  static evaluateComparison(row, field, operator, value) {
    const fieldValue = row[field.toLowerCase()];
    const parsedValue = this.parseValue(value.trim());
    const op = operator.toUpperCase();

    switch (op) {
      case '=':
        return fieldValue === parsedValue;
      case '<>':
      case '!=':
        return fieldValue !== parsedValue;
      case '<':
        return fieldValue < parsedValue;
      case '>':
        return fieldValue > parsedValue;
      case '<=':
        return fieldValue <= parsedValue;
      case '>=':
        return fieldValue >= parsedValue;
      case 'LIKE':
      case 'ILIKE':
        return this.evaluateLike(fieldValue, parsedValue);
      case 'IN':
        return this.evaluateIn(fieldValue, value);
      case 'BETWEEN':
        return this.evaluateBetween(fieldValue, value);
      case 'IS':
        return this.evaluateIs(fieldValue, value);
      default:
        return true;
    }
  }

  static evaluateLike(fieldValue, pattern) {
    const regexPattern = pattern.replace(/'/g, '').replace(/%/g, '.*');
    return new RegExp(regexPattern, 'i').test(String(fieldValue));
  }

  static evaluateIn(fieldValue, value) {
    const values = value
      .replace(/[()]/g, '')
      .split(',')
      .map(v => this.parseValue(v.trim()));
    return values.includes(fieldValue);
  }

  static evaluateBetween(fieldValue, value) {
    const parts = value.split(/\s+AND\s+/i);
    const min = this.parseValue(parts[0].trim());
    const max = this.parseValue(parts[1].trim());
    return fieldValue >= min && fieldValue <= max;
  }

  static evaluateIs(fieldValue, value) {
    const upperValue = value.toUpperCase();
    if (upperValue === 'NULL') {
      return fieldValue === null || fieldValue === undefined;
    } else if (upperValue === 'NOT NULL') {
      return fieldValue !== null && fieldValue !== undefined;
    }
    return true;
  }

  static parseValue(val) {
    if (val === 'NULL' || val === 'null') return null;
    if (val === 'true') return true;
    if (val === 'false') return false;

    const numVal = Number(val);
    if (!isNaN(numVal) && val.trim() !== '') return numVal;

    return val.replace(/^['"](.*)['"]$/, '$1');
  }
}

class AggregateCalculator {
  static calculateAggregates(rows, aggregates) {
    const result = {};

    const aggArray = Array.isArray(aggregates) ? aggregates : [aggregates];
    
    aggArray.forEach(col => {
      if (typeof col !== 'string') return;
      
      const colLower = col.toLowerCase().trim();

      if (this.isSumAggregate(colLower)) {
        const match = colLower.match(Constants.AGGREGATES.PATTERNS.SUM);
        if (match) {
          const field = match[1].toLowerCase();
          result[field] = rows.reduce((sum, r) => sum + (r[field] || 0), 0);
        }
      } else if (this.isCountAggregate(colLower)) {
        result['count'] = rows.length;
      } else if (this.isAvgAggregate(colLower)) {
        const match = colLower.match(Constants.AGGREGATES.PATTERNS.AVG);
        if (match) {
          const field = match[1].toLowerCase();
          const sum = rows.reduce((s, r) => s + (r[field] || 0), 0);
          result[field] = parseFloat((sum / rows.length).toFixed(2));
        }
      } else if (this.isMaxAggregate(colLower)) {
        const match = colLower.match(Constants.AGGREGATES.PATTERNS.MAX);
        if (match) {
          const field = match[1].toLowerCase();
          result[field] = Math.max(...rows.map(r => r[field] || 0));
        }
      } else if (this.isMinAggregate(colLower)) {
        const match = colLower.match(Constants.AGGREGATES.PATTERNS.MIN);
        if (match) {
          const field = match[1].toLowerCase();
          result[field] = Math.min(...rows.map(r => r[field] || 0));
        }
      }
    });

    return result;
  }

  static isSumAggregate(col) {
    return col.includes('sum(');
  }

  static isCountAggregate(col) {
    return col.includes('count(');
  }

  static isAvgAggregate(col) {
    return col.includes('avg(');
  }

  static isMaxAggregate(col) {
    return col.includes('max(');
  }

  static isMinAggregate(col) {
    return col.includes('min(');
  }

  static hasAggregates(columns) {
    return columns.some(col => {
      const c = col.toLowerCase();
      return c.includes('sum(') || c.includes('count(') || c.includes('avg(') ||
             c.includes('max(') || c.includes('min(');
    });
  }

  static extractField(pattern, colLower) {
    const match = colLower.match(pattern);
    return match ? match[1].toLowerCase() : null;
  }
}

class DistinctHandler {
  static applyDistinct(data, selectColumns) {
    const seen = new Set();
    
    return data.filter(row => {
      let key;
      
      if (selectColumns[0] !== '*') {
        const selectedValues = selectColumns.map(col => {
          const colLower = col.toLowerCase();
          
          if (colLower.includes('sum(')) {
            const match = colLower.match(Constants.AGGREGATES.PATTERNS.SUM);
            return match ? row[match[1].toLowerCase()] : '';
          }
          if (colLower.includes('count(')) {
            return row['count'] ?? row['count(*)'];
          }
          return row[colLower] ?? '';
        });
        key = JSON.stringify(selectedValues);
      } else {
        key = JSON.stringify(row);
      }

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

module.exports = {
  ConditionEvaluator,
  AggregateCalculator,
  DistinctHandler
};
