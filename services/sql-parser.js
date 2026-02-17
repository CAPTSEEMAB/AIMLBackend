const Constants = require('../config/constants');

class SQLParseError extends Error {
  constructor(message, clause) {
    super(`SQL Parse Error [${clause}]: ${message}`);
    this.clause = clause;
    this.name = 'SQLParseError';
  }
}

class SQLParser {
  constructor(logger = null) {
    this.logger = logger;
    this.patterns = Constants.SQL_CLAUSES;
  }

  parse(sqlQuery) {
    try {
      const normalizedSql = this.normalizeSql(sqlQuery);
      
      return {
        selectColumns: this.parseSelectColumns(normalizedSql),
        distinct: this.parseDistinct(normalizedSql),
        whereClause: this.parseWhereClause(normalizedSql),
        groupColumns: this.parseGroupColumns(normalizedSql),
        havingClause: this.parseHavingClause(normalizedSql),
        orderClauses: this.parseOrderClauses(normalizedSql),
        limit: this.parseLimit(normalizedSql),
        offset: this.parseOffset(normalizedSql)
      };
    } catch (error) {
      this.logger?.error('SQL parsing failed', error);
      throw new SQLParseError(error.message, 'general');
    }
  }

  normalizeSql(sql) {
    return sql
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ');
  }

  parseSelectColumns(sql) {
    try {
      const match = sql.match(this.patterns.SELECT);
      if (!match) return ['*'];

      const selectPart = match[2] || '*';
      return selectPart === '*' ? ['*'] : 
        selectPart.split(',').map(col => col.trim());
    } catch (error) {
      throw new SQLParseError(error.message, 'SELECT');
    }
  }

  parseDistinct(sql) {
    try {
      const match = sql.match(this.patterns.SELECT);
      return !!(match && match[1]);
    } catch (error) {
      throw new SQLParseError(error.message, 'DISTINCT');
    }
  }

  parseWhereClause(sql) {
    try {
      const match = sql.match(this.patterns.WHERE);
      return match ? match[1].trim().replace(/;$/, '') : null;
    } catch (error) {
      throw new SQLParseError(error.message, 'WHERE');
    }
  }

  parseGroupColumns(sql) {
    try {
      const match = sql.match(this.patterns.GROUP_BY);
      return match ? 
        match[1].split(',').map(c => c.trim().replace(/;$/, '').toLowerCase()) : [];
    } catch (error) {
      throw new SQLParseError(error.message, 'GROUP BY');
    }
  }

  parseHavingClause(sql) {
    try {
      const match = sql.match(this.patterns.HAVING);
      return match ? match[1].trim().replace(/;$/, '') : null;
    } catch (error) {
      throw new SQLParseError(error.message, 'HAVING');
    }
  }

  parseOrderClauses(sql) {
    try {
      const match = sql.match(this.patterns.ORDER_BY);
      return match ? match[1].split(',').map(c => c.trim()) : [];
    } catch (error) {
      throw new SQLParseError(error.message, 'ORDER BY');
    }
  }

  parseLimit(sql) {
    try {
      const match = sql.match(this.patterns.LIMIT);
      return match ? parseInt(match[1]) : null;
    } catch (error) {
      throw new SQLParseError(error.message, 'LIMIT');
    }
  }

  parseOffset(sql) {
    try {
      const match = sql.match(this.patterns.OFFSET);
      return match ? parseInt(match[1]) : 0;
    } catch (error) {
      throw new SQLParseError(error.message, 'OFFSET');
    }
  }
}

module.exports = { SQLParser, SQLParseError };
