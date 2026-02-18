const Constants = require('./config/constants');
const { getPool, getTableName } = require('./database');
const GroqService = require('./services/groq-service');
const { SQLParser } = require('./services/sql-parser');
const QueryExecutor = require('./services/query-executor');
const { ChartTypeDetector, AxisDetector } = require('./services/chart-detector');
const Logger = require('./utils/logger');
const PromptBuilder = require('./utils/prompt-builder');
const SchemaDiscoveryService = require('./services/schema-discovery');
const DynamicConfigService = require('./services/dynamic-config');
const SQLConverter = require('./services/sql-converter');

class NL2SQLProcessor {
  constructor(dynamicConfig = null) {
    this.logger = new Logger('NL2SQLProcessor');
    this.dynamicConfig = dynamicConfig;
    this.groqService = new GroqService(this.logger);
    this.sqlParser = new SQLParser(this.logger);
    this.queryExecutor = new QueryExecutor(this.logger);
    this.chartDetector = new ChartTypeDetector(dynamicConfig, this.logger);
    this.axisDetector = new AxisDetector(dynamicConfig, this.logger);
  }

  async processQuestion(question) {
    try {
      this.logger.info(`Processing question: "${question}"`);

      const schemaInfo = await this.buildSchemaInfo();
      const sqlQuery = await this.groqService.generateSQL(question, schemaInfo);
      const data = await this.executeQuery(sqlQuery);
      const primaryChartType = await this.groqService.suggestChartType(sqlQuery, data.length);
      const secondaryChartType = this.chartDetector.getAlternativeChartType(
        primaryChartType,
        sqlQuery,
        data.length
      );

      this.logger.info('Question processed successfully', {
        dataRows: data.length,
        chartType: primaryChartType
      });

      return {
        success: true,
        question,
        query: sqlQuery,
        data,
        chartType: primaryChartType,
        secondaryChartType
      };
    } catch (error) {
      this.logger.error('Question processing failed', error);
      return {
        success: false,
        error: error.message,
        data: [],
        query: null
      };
    }
  }

  async buildSchemaInfo() {
    try {
      this.logger.debug('Building database schema information');

      const tableName = this.dynamicConfig?.getConfig().database.tableName || process.env.DB_TABLE_NAME || 'Retail';
      const pool = await getPool();
      
      const result = await pool.request().query(`SELECT TOP 100 * FROM [${tableName}]`);
      const sampleData = result.recordset || [];
      
      this.logger.debug('Sample data fetched', { rowCount: sampleData.length });

      const config = this.dynamicConfig?.getConfig();
      const categories = config ? Object.fromEntries(
        Object.entries(config.database.stringColumns || {}).map(([col]) => [col, config.chartDetection.categoryKeys?.includes(col)])
      ) : {};
      
      return PromptBuilder.buildDatabaseSchemaPrompt(
        sampleData,
        categories,
        {},
        tableName
      );
    } catch (error) {
      this.logger.error('Schema info building failed', error);
      throw error;
    }
  }

  async executeQuery(sqlQuery) {
    try {
      this.logger.debug('Executing query', { query: sqlQuery.substring(0, 50) + '...' });

      const pool = await getPool();
      
      const tsqlQuery = SQLConverter.convertToTSQL(sqlQuery);
      this.logger.debug('Converted to T-SQL', { original: sqlQuery.substring(0, 50), converted: tsqlQuery.substring(0, 50) });
      
      const result = await pool.request().query(tsqlQuery);
      let rows = result.recordset || [];
      
      if (rows.length > 0) {
        const keys = Object.keys(rows[0]);
        const hasEmptyKey = keys.some(k => !k || !k.trim());
        if (hasEmptyKey) {
          const aliasMap = this.extractColumnAliases(sqlQuery, keys);
          if (Object.keys(aliasMap).length > 0) {
            rows = rows.map(row => {
              const newRow = {};
              for (const [oldKey, value] of Object.entries(row)) {
                const newKey = aliasMap[oldKey] || oldKey || 'Value';
                newRow[newKey] = value;
              }
              return newRow;
            });
          }
        }
      }

      this.logger.debug('Data fetched from Azure SQL', { rowCount: rows.length });
      this.logger.debug('Query result', { rowCount: rows.length, firstRow: rows[0] });

      return rows;
    } catch (error) {
      this.logger.error('Query execution failed', error);
      throw new Error(`Query execution error: ${error.message}`);
    }
  }

  extractColumnAliases(sqlQuery, currentKeys) {
    const aliasMap = {};
    const normalized = sqlQuery.replace(/\s+/g, ' ').trim();
    
    const selectMatch = normalized.match(/SELECT\s+(.+?)\s+FROM/i);
    if (!selectMatch) return aliasMap;

    const selectClause = selectMatch[1];
    const parts = [];
    let depth = 0, current = '';
    for (const ch of selectClause) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }
    if (current.trim()) parts.push(current.trim());

    let emptyIdx = 0;
    for (const part of parts) {
      if (/\sAS\s/i.test(part)) continue;
      
      const aggMatch = part.match(/^(SUM|COUNT|AVG|MIN|MAX|STDEV)\s*\(\s*([^)]+)\s*\)/i);
      if (aggMatch) {
        const func = aggMatch[1].toUpperCase();
        const col = aggMatch[2].replace(/[\[\]]/g, '').trim();
        const colName = col === '*' ? 'Count' : col;
        const newName = `Total_${colName}`;
        
        const emptyKey = currentKeys.find((k, i) => (!k || !k.trim()) && i >= emptyIdx);
        if (emptyKey !== undefined) {
          aliasMap[emptyKey] = newName;
          emptyIdx = currentKeys.indexOf(emptyKey) + 1;
        }
      }
    }

    return aliasMap;
  }
}

module.exports = {
  NL2SQLProcessor,
  SchemaDiscoveryService,
  DynamicConfigService,
  processQuestion: async (question, dynamicConfig = null) => {
    const processor = new NL2SQLProcessor(dynamicConfig);
    return processor.processQuestion(question);
  },
  initializeDynamicConfig: async () => {
    const schemaDiscovery = new SchemaDiscoveryService();
    const dynamicConfig = new DynamicConfigService(schemaDiscovery);
    await dynamicConfig.initialize();
    return dynamicConfig;
  }
};
