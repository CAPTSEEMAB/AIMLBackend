const Constants = require('./config/constants');
const { supabase, getTableName } = require('./database');
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

      const tableName = this.dynamicConfig?.getConfig().database.tableName || process.env.DB_TABLE_NAME || 'products';
      const { data: allData, error } = await supabase.from(tableName).select('*');
      
      if (error) throw new Error(error.message);
      
      const sampleData = allData || [];

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

      const tableName = this.dynamicConfig?.getConfig().database.tableName || process.env.DB_TABLE_NAME ;
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw new Error(error.message);

      let result = data || [];
      this.logger.debug('Data fetched from database', { rowCount: result.length });

      const parsedQuery = this.sqlParser.parse(sqlQuery);
      this.logger.debug('Parsed query', { selectColumns: parsedQuery.selectColumns, groupColumns: parsedQuery.groupColumns });
      result = await this.queryExecutor.execute(parsedQuery, result);
      this.logger.debug('Query result', { rowCount: result.length, firstRow: result[0] });

      return result;
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
