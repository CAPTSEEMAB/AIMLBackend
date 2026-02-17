const { supabase } = require('../database');
const Logger = require('../utils/logger');

class SchemaDiscoveryService {
  constructor(logger = null) {
    this.logger = logger || new Logger('SchemaDiscovery');
    this.schema = null;
    this.schemaCache = null;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.lastCacheTime = null;
  }

  async discoverSchema() {
    try {
      if (this.isCacheValid()) {
        this.logger.debug('Using cached schema');
        return this.schemaCache;
      }

      this.logger.info('Discovering database schema...');

      let tableName = process.env.DB_TABLE_NAME;
      
      if (!tableName) {
        this.logger.debug('DB_TABLE_NAME not set, querying available tables...');
        tableName = await this.discoverAvailableTable();
      }

      if (!tableName) {
        throw new Error('No table name provided and unable to discover tables from database');
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) throw new Error(error.message);

      if (!data || data.length === 0) {
        throw new Error(`Table ${tableName} is empty or does not exist`);
      }

      const firstRow = data[0];
      const schema = this.buildSchemaFromRow(firstRow, tableName);

      this.schemaCache = schema;
      this.lastCacheTime = Date.now();

      this.logger.info('Schema discovered successfully', {
        columns: schema.columns,
        stringColumns: schema.stringColumns,
        numericColumns: schema.numericColumns
      });

      return schema;
    } catch (error) {
      this.logger.error('Schema discovery failed', error);
      throw error;
    }
  }

  isCacheValid() {
    if (!this.schemaCache || !this.lastCacheTime) {
      return false;
    }
    return Date.now() - this.lastCacheTime < this.cacheExpiry;
  }

  buildSchemaFromRow(row, tableName) {
    const columns = Object.keys(row);
    const stringColumns = [];
    const numericColumns = [];
    const dateColumns = [];

    columns.forEach(col => {
      const value = row[col];
      const type = this.inferColumnType(value);

      if (type === 'string') {
        stringColumns.push(col);
      } else if (type === 'number') {
        numericColumns.push(col);
      } else if (type === 'date') {
        dateColumns.push(col);
      }
    });

    return {
      tableName,
      columns,
      stringColumns,
      numericColumns,
      dateColumns,
      columnTypes: this.mapColumnTypes(row)
    };
  }

  inferColumnType(value) {
    if (value === null || value === undefined) {
      return 'unknown';
    }

    if (typeof value === 'number') {
      return 'number';
    }

    if (typeof value === 'boolean') {
      return 'boolean';
    }

    if (value instanceof Date) {
      return 'date';
    }

    const stringValue = String(value);

    if (this.isDateString(stringValue)) {
      return 'date';
    }

    if (this.isNumericString(stringValue)) {
      return 'number';
    }

    return 'string';
  }

  isDateString(value) {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
      /^\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
    ];

    return datePatterns.some(pattern => pattern.test(value));
  }

  isNumericString(value) {
    return /^-?\d+(\.\d+)?$/.test(value);
  }

  mapColumnTypes(row) {
    const types = {};
    Object.keys(row).forEach(col => {
      types[col] = this.inferColumnType(row[col]);
    });
    return types;
  }

  async getDistinctValues(columnName) {
    try {
      this.logger.debug('Fetching distinct values', { column: columnName });

      const tableName = process.env.DB_TABLE_NAME ;
      
      const { data, error } = await supabase
        .from(tableName)
        .select(columnName)
        .order(columnName);

      if (error) throw new Error(error.message);

      const uniqueValues = [...new Set(data.map(row => row[columnName]).filter(v => v != null))];

      this.logger.info(`Found ${uniqueValues.length} distinct values for ${columnName}`);

      return uniqueValues;
    } catch (error) {
      this.logger.error('Failed to fetch distinct values', error);
      throw error;
    }
  }

  clearCache() {
    this.schemaCache = null;
    this.lastCacheTime = null;
    this.logger.info('Schema cache cleared');
  }

  async discoverAvailableTable() {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE')
        .limit(1);

      if (error) {
        this.logger.warn('Unable to query information_schema, trying common table names');
        const commonTables = ['products', 'data', 'records', 'items', 'orders'];
        for (const table of commonTables) {
          try {
            const { data: testData, error: testError } = await supabase
              .from(table)
              .select('*')
              .limit(1);
            
            if (!testError && testData !== null) {
              this.logger.info(`Discovered table: ${table}`);
              return table;
            }
          } catch (e) {
          }
        }
        return null;
      }

      if (data && data.length > 0) {
        const tableName = data[0].table_name;
        this.logger.info(`Discovered table from information_schema: ${tableName}`);
        return tableName;
      }

      return null;
    } catch (error) {
      this.logger.error('Error discovering available tables', error);
      return null;
    }
  }
}

module.exports = SchemaDiscoveryService;
