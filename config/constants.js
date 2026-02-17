module.exports = {
  GROQ_API: {
    MODEL: 'llama-3.1-8b-instant',
    SQL_GENERATION: {
      TEMPERATURE: 0.3,
      MAX_TOKENS: 512
    },
    CHART_SUGGESTION: {
      TEMPERATURE: 0.2,
      MAX_TOKENS: 20
    }
  },

  CHART_TYPES: {
    VALID: ['bar', 'pie', 'line', 'table'],
    DEFAULT: 'table'
  },

  CHART_DETECTION: {
    DATA_SIZE_THRESHOLD_TABLE: 10
  },

  OPERATORS: {
    COMPARISON: ['=', '<>', '!=', '<', '>', '<=', '>='],
    PATTERN: ['LIKE', 'ILIKE'],
    SET: ['IN'],
    RANGE: ['BETWEEN'],
    NULL: ['IS'],
    LOGICAL: ['AND', 'OR']
  },

  AGGREGATES: {
    FUNCTIONS: ['SUM', 'COUNT', 'AVG', 'MAX', 'MIN'],
    PATTERNS: {
      SUM: /sum\s*\(\s*(\w+)\s*\)/i,
      COUNT: /count\s*\(\s*(\w+|\*)\s*\)/i,
      AVG: /avg\s*\(\s*(\w+)\s*\)/i,
      MAX: /max\s*\(\s*(\w+)\s*\)/i,
      MIN: /min\s*\(\s*(\w+)\s*\)/i
    }
  },

  SQL_CLAUSES: {
    SELECT: /SELECT\s+(DISTINCT\s+)?(.*?)\s+FROM/i,

    WHERE: /WHERE\s+(.*?)(?:GROUP|ORDER|LIMIT|HAVING|$)/i,
    GROUP_BY: /GROUP\s+BY\s+(.*?)(?:HAVING|ORDER|LIMIT|$)/i,
    HAVING: /HAVING\s+(.*?)(?:ORDER|LIMIT|$)/i,
    ORDER_BY: /ORDER\s+BY\s+(.*?)(?:LIMIT|$)/i,
    LIMIT: /LIMIT\s+(\d+)/i,
    OFFSET: /OFFSET\s+(\d+)/i
  },

  FUNCTION_REPLACEMENTS: {
    YEAR: /year\s*\(\s*(\w+)\s*\)/gi,
    MONTH: /month\s*\(\s*(\w+)\s*\)/gi,
    DAY: /day\s*\(\s*(\w+)\s*\)/gi,
    DATE: /date\s*\(\s*(\w+)\s*\)/gi
  },

  EXTRACT_PATTERNS: {
    EXTRACT_UNIT: /extract\s*\(\s*(\w+)\s+from\s+(\w+)\s*\)/i,
    EXTRACT_UNITS: {
      YEAR: 'YEAR',
      MONTH: 'MONTH',
      DAY: 'DAY'
    }
  },

  LOGGING: {
    LEVELS: {
      ERROR: 'ERROR',
      WARN: 'WARN',
      INFO: 'INFO',
      DEBUG: 'DEBUG'
    },
    DEFAULT_LEVEL: 'INFO'
  }
};
