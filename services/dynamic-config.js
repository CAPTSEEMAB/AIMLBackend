const Logger = require('../utils/logger');

class DynamicConfigService {
  constructor(schemaDiscoveryService, logger = null) {
    this.schemaDiscovery = schemaDiscoveryService;
    this.logger = logger || new Logger('DynamicConfig');
    this.config = null;
  }

  async initialize() {
    try {
      this.logger.info('Initializing dynamic configuration...');

      const schema = await this.schemaDiscovery.discoverSchema();
      
      this.config = {
        database: this.buildDatabaseConfig(schema),
        chartDetection: await this.buildChartDetectionConfig(schema),
        columns: schema.columns
      };

      this.logger.info('Dynamic configuration loaded', {
        table: this.config.database.tableName,
        columns: this.config.columns.length,
        stringColumns: this.config.database.stringColumns.length,
        numericColumns: this.config.database.numericColumns.length
      });

      return this.config;
    } catch (error) {
      this.logger.error('Failed to initialize configuration', error);
      throw error;
    }
  }

  buildDatabaseConfig(schema) {
    return {
      tableName: schema.tableName,
      columns: schema.columns,
      stringColumns: schema.stringColumns,
      numericColumns: schema.numericColumns,
      dateColumns: schema.dateColumns,
      columnTypes: schema.columnTypes
    };
  }

  async buildChartDetectionConfig(schema) {
    try {
      this.logger.debug('Building chart detection configuration...');

      const categoryKeys = await this.identifyCategoryColumns(schema);
      const numericKeys = schema.numericColumns;

      this.logger.info('Chart detection config built', {
        categoryColumns: categoryKeys,
        numericColumns: numericKeys
      });

      return {
        categoryKeys,
        numericKeys,
        dataSize_threshold_table: 10
      };
    } catch (error) {
      this.logger.error('Failed to build chart detection config', error);
      throw error;
    }
  }

  async identifyCategoryColumns(schema) {
    const categoryColumns = [];

    for (const col of schema.stringColumns) {
      const distinctCount = await this.getDistinctCount(col);
      
      if (distinctCount < 100) { // Heuristic: fewer than 100 distinct values = category
        categoryColumns.push(col);
      }
    }

    for (const col of schema.dateColumns) {
      categoryColumns.push(col);
    }

    return categoryColumns;
  }

  async getDistinctCount(columnName) {
    try {
      const values = await this.schemaDiscovery.getDistinctValues(columnName);
      return values.length;
    } catch (error) {
      this.logger.warn(`Could not get distinct count for ${columnName}`, error);
      return 0;
    }
  }

  async getCategories(columnName) {
    try {
      return await this.schemaDiscovery.getDistinctValues(columnName);
    } catch (error) {
      this.logger.error(`Failed to get categories for ${columnName}`, error);
      return [];
    }
  }

  getConfig() {
    if (!this.config) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    return this.config;
  }

  getColumnType(columnName) {
    if (!this.config) {
      throw new Error('Configuration not initialized.');
    }
    return this.config.database.columnTypes[columnName] || 'unknown';
  }

  isCategoryColumn(columnName) {
    if (!this.config) {
      throw new Error('Configuration not initialized.');
    }
    return this.config.chartDetection.categoryKeys.includes(columnName);
  }

  isNumericColumn(columnName) {
    if (!this.config) {
      throw new Error('Configuration not initialized.');
    }
    return this.config.chartDetection.numericKeys.includes(columnName);
  }

  reload() {
    this.logger.info('Reloading configuration...');
    this.config = null;
    return this.initialize();
  }
}

module.exports = DynamicConfigService;
