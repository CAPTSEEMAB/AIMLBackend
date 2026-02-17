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
      
      // Fetch sample data from Azure SQL
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
      
      // Execute the generated SQL query
      const result = await pool.request().query(sqlQuery);
      let rows = result.recordset || [];
      
      this.logger.debug('Data fetched from Azure SQL', { rowCount: rows.length });
      this.logger.debug('Query result', { rowCount: rows.length, firstRow: rows[0] });

      // Return results directly from Azure SQL without re-processing
      // (Azure SQL already executed GROUP BY, aggregates, ORDER BY, etc.)
      return rows;
    } catch (error) {
      this.logger.error('Query execution failed', error);
      throw new Error(`Query execution error: ${error.message}`);
    }
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
