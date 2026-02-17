class SQLConverter {
  static convertToTSQL(query) {
    if (!query) return query;

    let convertedQuery = query;

    convertedQuery = this.convertFunctionNames(convertedQuery);
    convertedQuery = this.convertLimit(convertedQuery);
    convertedQuery = this.bracketIdentifiers(convertedQuery);

    return convertedQuery;
  }

  static convertFunctionNames(query) {
    let converted = query;

    converted = converted.replace(/\bcurrent_database\s*\(\s*\)/gi, 'DB_NAME()');
    converted = converted.replace(/\bcurrent_user\s*\(\s*\)/gi, 'CURRENT_USER');
    converted = converted.replace(/\bnow\s*\(\s*\)/gi, 'GETDATE()');
    converted = converted.replace(/\bcurrent_timestamp\s*\(\s*\)/gi, 'CURRENT_TIMESTAMP');
    converted = converted.replace(/\bcurrent_schema\s*\(\s*\)/gi, "SCHEMA_NAME(SCHEMA_ID())");
    converted = converted.replace(/\bsession_user\s*(?=[,\s;)]|$)/gi, 'CURRENT_USER');
    converted = converted.replace(/\buser\s*(?=[,\s;)]|$)/gi, 'CURRENT_USER');

    return converted;
  }

  static convertLimit(query) {
    const limitOffsetPattern = /LIMIT\s+(\d+)\s+OFFSET\s+(\d+)/gi;
    query = query.replace(limitOffsetPattern, (match, limit, offset) => {
      return `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    });

    const selectPattern = /\bSELECT\s+/i;
    const limitPattern = /\bLIMIT\s+(\d+)(?:\s*[;]?\s*)?$/i;
    
    if (selectPattern.test(query) && limitPattern.test(query)) {
      const limitMatch = query.match(/\bLIMIT\s+(\d+)/i);
      if (limitMatch) {
        const limit = limitMatch[1];
        query = query.replace(/\s*\bLIMIT\s+\d+\s*(?:;)?$/i, ';');
        query = query.replace(/\bSELECT\s+/i, `SELECT TOP ${limit} `);
      }
    }

    return query;
  }

  static bracketIdentifiers(query) {
    if (query.includes('[')) {
      return query;
    }

    return query;
  }
}

module.exports = SQLConverter;
