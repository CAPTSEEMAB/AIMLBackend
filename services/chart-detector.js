const Constants = require('../config/constants');
const Logger = require('../utils/logger');

class ChartTypeDetector {
  constructor(dynamicConfig = null, logger = null) {
    this.logger = logger || new Logger('ChartTypeDetector');
    this.dynamicConfig = dynamicConfig;
  }

  detectByContext(sqlQuery, dataSize) {
    this.logger.debug('Detecting chart type by context', { dataSize });

    const query = sqlQuery.toLowerCase();

    if (this.isAggregateWithoutGroupBy(query)) {
      return 'table';
    }

    if (query.includes('group by')) {
      return this.detectForGroupBy(query);
    }

    if (query.includes('order by') && query.includes('limit')) {
      return 'bar';
    }

    const threshold = this.dynamicConfig 
      ? this.dynamicConfig.getConfig().chartDetection.dataSize_threshold_table
      : Constants.CHART_DETECTION.DATA_SIZE_THRESHOLD_TABLE;

    if (dataSize > threshold) {
      return 'table';
    }

    if (dataSize <= 1) {
      return 'table';
    }

    if (query.includes('select') && query.includes('where')) {
      return 'bar';
    }

    return Constants.CHART_TYPES.DEFAULT;
  }

  isAggregateWithoutGroupBy(query) {
    const hasAggregates = /sum\(|count\(|avg\(|max\(|min\(/i.test(query);
    const hasGroupBy = /group by/i.test(query);
    return hasAggregates && !hasGroupBy;
  }

  detectForGroupBy(query) {
    if (!this.dynamicConfig) {
      return this.detectForGroupByStatic(query);
    }

    try {
      const config = this.dynamicConfig.getConfig();
      const categoryKeys = config.chartDetection.categoryKeys;

      for (const key of categoryKeys) {
        if (query.includes(key)) {
          return /sum\(|count\(/i.test(query) ? 'bar' : 'pie';
        }
      }

      return 'bar';
    } catch (error) {
      this.logger.warn('Dynamic config error, falling back to static', error);
      return this.detectForGroupByStatic(query);
    }
  }

  detectForGroupByStatic(query) {
    if (query.includes('category')) {
      return 'pie';
    }

    if (query.includes('region') || query.includes('date') || query.includes('month')) {
      return 'bar';
    }

    return /sum\(|count\(/i.test(query) ? 'bar' : 'pie';
  }

  getAlternativeChartType(primaryType, query, dataSize) {
    if (primaryType === 'table') return null;

    const queryLower = query.toLowerCase();

    if (primaryType === 'bar') {
      if (this.hasGroupByWithCategoryColumn(queryLower)) {
        return 'pie';
      }
      if (queryLower.includes('order by') && this.hasDateColumn(queryLower)) {
        return 'line';
      }
      return 'pie';
    }

    if (primaryType === 'pie') {
      return 'bar';
    }

    if (primaryType === 'line') {
      return 'bar';
    }

    return null;
  }

  hasGroupByWithCategoryColumn(query) {
    if (!query.includes('group by')) return false;

    if (!this.dynamicConfig) {
      return query.includes('category');
    }

    try {
      const config = this.dynamicConfig.getConfig();
      const categoryKeys = config.chartDetection.categoryKeys;
      return categoryKeys.some(key => query.includes(key));
    } catch (error) {
      this.logger.warn('Dynamic config error', error);
      return query.includes('category');
    }
  }

  hasDateColumn(query) {
    if (!this.dynamicConfig) {
      return query.includes('date') || query.includes('month') || query.includes('year');
    }

    try {
      const config = this.dynamicConfig.getConfig();
      const dateColumns = config.database.dateColumns || [];
      return dateColumns.some(col => query.includes(col));
    } catch (error) {
      this.logger.warn('Dynamic config error', error);
      return query.includes('date') || query.includes('month');
    }
  }
}

class AxisDetector {
  constructor(dynamicConfig = null, logger = null) {
    this.logger = logger || new Logger('AxisDetector');
    this.dynamicConfig = dynamicConfig;
  }

  detectAxes(data, chartType) {
    if (!data || data.length === 0 || chartType === 'table') {
      return { xAxis: null, yAxis: null };
    }

    const firstRow = data[0];
    const keys = Object.keys(firstRow);

    if (keys.length === 0) {
      return { xAxis: null, yAxis: null };
    }

    this.logger.debug('Detecting axes', { keys, chartType });

    let xAxis = this.detectCategoryAxis(keys, firstRow);
    let yAxis = this.detectNumericAxis(keys, firstRow, xAxis);

    return { xAxis, yAxis };
  }

  detectCategoryAxis(keys, firstRow) {
    const categoryKeys = this.getCategoryKeys();

    for (const key of categoryKeys) {
      if (keys.includes(key)) {
        return key;
      }
    }

    for (const key of keys) {
      if (!this.isNumeric(firstRow[key])) {
        return key;
      }
    }

    return keys[0] || null;
  }

  detectNumericAxis(keys, firstRow, xAxis) {
    const numericKeys = this.getNumericKeys();

    for (const key of numericKeys) {
      if (keys.includes(key)) {
        return key;
      }
    }

    for (const key of keys) {
      if (key !== xAxis && typeof firstRow[key] === 'number') {
        return key;
      }
    }

    if (keys.length > 1) {
      return keys.find(key => key !== xAxis) || keys[1];
    }

    return keys[0] || null;
  }

  getCategoryKeys() {
    if (!this.dynamicConfig) {
      return Constants.CHART_DETECTION.CATEGORY_KEYS;
    }

    try {
      return this.dynamicConfig.getConfig().chartDetection.categoryKeys;
    } catch (error) {
      this.logger.warn('Dynamic config error, using defaults', error);
      return Constants.CHART_DETECTION.CATEGORY_KEYS;
    }
  }

  getNumericKeys() {
    if (!this.dynamicConfig) {
      return Constants.CHART_DETECTION.NUMERIC_KEYS;
    }

    try {
      return this.dynamicConfig.getConfig().chartDetection.numericKeys;
    } catch (error) {
      this.logger.warn('Dynamic config error, using defaults', error);
      return Constants.CHART_DETECTION.NUMERIC_KEYS;
    }
  }

  isNumeric(value) {
    return value !== null && value !== undefined && !isNaN(value);
  }
}

module.exports = {
  ChartTypeDetector,
  AxisDetector
};
