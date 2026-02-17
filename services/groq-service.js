const Groq = require('groq-sdk');
const Constants = require('../config/constants');
const Logger = require('../utils/logger');
const PromptBuilder = require('../utils/prompt-builder');
const { InputValidator, SQLValidator } = require('../utils/validators');

class GroqService {
  constructor(logger = null) {
    this.logger = logger || new Logger('GroqService');
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async generateSQL(question, schemaInfo) {
    try {
      InputValidator.validateQuestion(question);

      this.logger.debug('Generating SQL for question', { question });

      const prompt = PromptBuilder.buildSQLGenerationPrompt(question, schemaInfo);

      const message = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: Constants.GROQ_API.MODEL,
        temperature: Constants.GROQ_API.SQL_GENERATION.TEMPERATURE,
        max_tokens: Constants.GROQ_API.SQL_GENERATION.MAX_TOKENS,
      });

      const sqlQuery = message.choices[0].message.content.trim();
      
      SQLValidator.validateQuery(sqlQuery);
      this.logger.info('SQL generated successfully');

      return sqlQuery;
    } catch (error) {
      this.logger.error('SQL generation failed', error);
      throw new Error(`SQL generation error: ${error.message}`);
    }
  }

  async suggestChartType(sqlQuery, dataSize) {
    try {
      SQLValidator.validateQuery(sqlQuery);

      this.logger.debug('Suggesting chart type', { dataSize });

      const prompt = PromptBuilder.buildChartSuggestionPrompt(sqlQuery, dataSize);

      const message = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: Constants.GROQ_API.MODEL,
        temperature: Constants.GROQ_API.CHART_SUGGESTION.TEMPERATURE,
        max_tokens: Constants.GROQ_API.CHART_SUGGESTION.MAX_TOKENS,
      });

      const suggestion = message.choices[0].message.content.trim().toLowerCase();
      
      if (Constants.CHART_TYPES.VALID.includes(suggestion)) {
        this.logger.info('Chart type suggested', { suggestion });
        return suggestion;
      }

      this.logger.warn('Invalid chart suggestion, returning default');
      return Constants.CHART_TYPES.DEFAULT;
    } catch (error) {
      this.logger.error('Chart suggestion failed', error);
      return Constants.CHART_TYPES.DEFAULT;
    }
  }
}

module.exports = GroqService;
