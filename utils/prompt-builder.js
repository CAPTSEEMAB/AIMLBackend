const Constants = require('../config/constants');

class PromptBuilder {
  static buildSQLGenerationPrompt(question, schema) {
    return `You are a PostgreSQL expert. Convert the following natural language question into a VALID PostgreSQL SQL query.

${schema}

IMPORTANT RESTRICTIONS AND RULES:
- AVOID EXTRACT, CASE WHEN, and complex functions - keep queries SIMPLE
- Only use basic filtering and GROUP BY with simple aggregates
- Use EXTRACT(YEAR FROM column) if absolutely necessary, but prefer simpler queries
- Use EXTRACT(MONTH FROM column) only if really needed for trends
- Use DATE_PART('year', column) for year extraction as alternative
- Use TO_CHAR(column, 'YYYY-MM-DD') for date formatting
- Always use timestamp or date types correctly
- Use || for string concatenation, not +
- Use ILIKE for case-insensitive matching instead of LIKE
- For date comparisons, cast strings: '2026-01-01'::date
- Prefer simple date comparisons over EXTRACT when possible

Database: PostgreSQL (not MySQL or other databases)

Question: "${question}"

Return ONLY the SQL query without any explanation or markdown. Make sure it's valid PostgreSQL syntax and preferably simple and client-side compatible.`;
  }

  static buildDatabaseSchemaPrompt(sampleData, categories, regions, tableName = 'products') {
    const columns = sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
    return `
Database Schema:
Table: ${tableName}
Columns: ${columns.join(', ')}

Sample data: ${JSON.stringify(sampleData.slice(0, 2))}

Available categories: ${Object.keys(categories || {}).join(', ') || 'N/A'}
Available regions: ${Object.keys(regions || {}).join(', ') || 'N/A'}

Rules:
- Always return valid SQL queries only
- Use this table structure for queries
- Return only SELECT queries
`;
  }

  static buildChartSuggestionPrompt(sqlQuery, dataSize) {
    return `Based on this SQL query and data size, suggest the best chart type to visualize the results.
Return ONLY one of these: '${Constants.CHART_TYPES.VALID.join("', '")}'

SQL Query: ${sqlQuery}
Data Size: ${dataSize} rows

Consider:
- GROUP BY queries with categories/regions → bar or pie
- Time series or trends → line
- Single value aggregates → table
- Multiple products with details → table
- Comparison data → bar
- Proportional data (percentages) → pie
- Large datasets or many columns → table

Return only the chart type, nothing else.`;
  }
}

module.exports = PromptBuilder;
