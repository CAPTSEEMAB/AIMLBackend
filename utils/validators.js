class ValidationError extends Error {
  constructor(field, message) {
    super(`Validation Error [${field}]: ${message}`);
    this.field = field;
    this.name = 'ValidationError';
  }
}

class SQLValidator {
  static validateQuery(sqlQuery) {
    if (!sqlQuery || typeof sqlQuery !== 'string') {
      throw new ValidationError('sqlQuery', 'Query must be a non-empty string');
    }

    const trimmed = sqlQuery.trim();
    if (trimmed.length === 0) {
      throw new ValidationError('sqlQuery', 'Query cannot be empty');
    }

    if (trimmed.length > 5000) {
      throw new ValidationError('sqlQuery', 'Query exceeds maximum length (5000 characters)');
    }

    if (!this.startsWithSelect(trimmed)) {
      throw new ValidationError('sqlQuery', 'Query must start with SELECT');
    }

    return true;
  }

  static startsWithSelect(query) {
    return /^SELECT\s+/i.test(query.trim());
  }
}

class InputValidator {
  static validateQuestion(question) {
    if (!question || typeof question !== 'string') {
      throw new ValidationError('question', 'Question must be a non-empty string');
    }

    const trimmed = question.trim();
    if (trimmed.length === 0) {
      throw new ValidationError('question', 'Question cannot be empty');
    }

    if (trimmed.length > 1000) {
      throw new ValidationError('question', 'Question exceeds maximum length (1000 characters)');
    }

    return true;
  }

  static validateChartType(chartType) {
    const Constants = require('../config/constants');
    if (!Constants.CHART_TYPES.VALID.includes(chartType)) {
      throw new ValidationError('chartType', 
        `Invalid chart type. Must be one of: ${Constants.CHART_TYPES.VALID.join(', ')}`);
    }
    return true;
  }
}

class DataValidator {
  static validateData(data) {
    if (!Array.isArray(data)) {
      throw new ValidationError('data', 'Data must be an array');
    }
    return true;
  }

  static validateRowStructure(row) {
    if (typeof row !== 'object' || row === null) {
      throw new ValidationError('row', 'Row must be an object');
    }
    return true;
  }
}

module.exports = {
  ValidationError,
  SQLValidator,
  InputValidator,
  DataValidator
};
