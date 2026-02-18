const { createGroq } = require('@ai-sdk/groq');
const { generateText } = require('ai');
const Logger = require('../utils/logger');

const logger = new Logger('AISpecGenerator');

class AISpecGenerator {
  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    
    const groq = createGroq({ apiKey });
    this.model = groq('llama-3.1-8b-instant');
    logger.info('AISpecGenerator initialized with Groq model');
  }

  getCatalogPrompt() {
    return `SYSTEM: You are a spec generator. Generate VALID JSON for rendering data visualizations.

EXAMPLE SPEC:
{
  "root": "main",
  "elements": {
    "main": {
      "type": "Stack",
      "props": {"direction": "column", "gap": 16},
      "children": ["header", "chart"]
    },
    "header": {
      "type": "Card",
      "props": {"title": "Total Sales by State"},
      "children": []
    },
    "chart": {
      "type": "RechartBar",
      "props": {"xAxis": "State", "yAxis": "Total_Sales", "height": 400},
      "children": []
    }
  }
}

CHART COMPONENTS (use EXACT prop names):
- RechartBar: props: { xAxis: string, yAxis: string, height: number }
- RechartLine: props: { xAxis: string, yAxis: string, height: number }
- RechartPie: props: { nameKey: string, valueKey: string, height: number }
- RechartScatter: props: { xAxis: string, yAxis: string, height: number }
- RechartArea: props: { xAxis: string, yAxis: string, height: number }
- Stack: props: { direction: "column"|"row", gap: number }, children: [ids]
- Card: props: { title: string, description: string }, children: []

CRITICAL RULES:
1. Root element MUST be a Stack with children: ["header", "chart"]
2. "header" is a Card with a title about the data
3. "chart" is one of the chart components above
4. xAxis/yAxis/nameKey/valueKey MUST be exact field names from the data (case-sensitive!)
5. Output ONLY valid JSON. No markdown, no explanation, no text before or after.`;
  }

  async generateSpec(question, data, metadata = {}) {
    try {
      logger.info('Generating spec with AI', { question, dataCount: data?.length || 0 });

      if (!Array.isArray(data) || data.length === 0) {
        return this.generateErrorSpec('No data available to visualize');
      }

      const firstRow = data[0];
      const allKeys = Object.keys(firstRow);
      const fieldNames = allKeys.filter(k => k && k.trim());
      const numericFields = fieldNames.filter(field => typeof firstRow[field] === 'number');
      const stringFields = fieldNames.filter(field => typeof firstRow[field] === 'string');

      if (data.length === 1 && numericFields.length <= 2 && stringFields.length === 0) {
        logger.info('Single-value result detected, generating stat card');
        return this.buildStatSpec(question, data[0], numericFields, metadata);
      }

      if (fieldNames.length === 0) {
        logger.warn('No valid field names found in data');
        return this.generateErrorSpec('Query returned columns without names. Try asking a more specific question like "show sales by state".');
      }

      const sampleData = data.slice(0, 3);

      let spec;
      try {
        spec = await this.generateWithAI(question, fieldNames, numericFields, stringFields, sampleData, data.length);
        logger.info('AI generated spec successfully');
      } catch (aiError) {
        logger.warn('AI generation failed, using smart template', aiError.message);
        spec = this.buildSmartTemplate(question, data, numericFields, stringFields);
      }

      if (!spec.state) spec.state = {};
      spec.state.chartData = data;

      return spec;
    } catch (error) {
      logger.error('Failed to generate spec', error);
      throw error;
    }
  }

  async generateWithAI(question, fieldNames, numericFields, stringFields, sampleData, totalRows) {
    const systemPrompt = this.getCatalogPrompt();

    const userPrompt = `Generate a JSON spec to visualize this data.

USER QUESTION: "${question}"
TOTAL ROWS: ${totalRows}
ALL FIELDS: ${fieldNames.join(', ')}
NUMERIC FIELDS: ${numericFields.join(', ')}
STRING/CATEGORY FIELDS: ${stringFields.join(', ')}
SAMPLE DATA: ${JSON.stringify(sampleData, null, 2)}

CHOOSE THE BEST CHART TYPE:
- If comparing categories → RechartBar (xAxis=category, yAxis=numeric)
- If showing trends over time → RechartLine (xAxis=date/time, yAxis=numeric)
- If showing proportions/parts of whole → RechartPie (nameKey=category, valueKey=numeric)
- If showing correlation between 2 numbers → RechartScatter (xAxis=numeric1, yAxis=numeric2)
- If showing cumulative/filled trends → RechartArea (xAxis=category, yAxis=numeric)

Use the ACTUAL field names from the data. Output ONLY valid JSON, no text.`;

    const result = await generateText({
      model: this.model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.1,
      maxTokens: 1000,
    });

    let responseText = result.text.trim();
    
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    const spec = JSON.parse(responseText);

    if (!spec.root || !spec.elements) {
      throw new Error('Invalid spec: missing root or elements');
    }

    const elementTypes = Object.values(spec.elements).map(e => e.type);
    const hasChart = elementTypes.some(t => 
      ['RechartBar', 'RechartLine', 'RechartPie', 'RechartScatter', 'RechartArea'].includes(t)
    );

    if (!hasChart) {
      throw new Error('AI spec has no chart element, falling back to template');
    }

    return spec;
  }

  buildSmartTemplate(question, data, numericFields, stringFields) {
    let chartType = 'RechartBar';
    let chartProps = {};
    const questionLower = question.toLowerCase();

    if (questionLower.includes('trend') || questionLower.includes('over time') || questionLower.includes('by date') || questionLower.includes('by month') || questionLower.includes('by year')) {
      chartType = 'RechartLine';
      chartProps = { xAxis: stringFields[0] || numericFields[0], yAxis: numericFields[0] || stringFields[0], height: 400 };
    } else if (questionLower.includes('distribution') || questionLower.includes('proportion') || questionLower.includes('share') || questionLower.includes('percentage') || questionLower.includes('breakdown')) {
      chartType = 'RechartPie';
      chartProps = { nameKey: stringFields[0] || numericFields[0], valueKey: numericFields[0] || stringFields[0], height: 400 };
    } else if (questionLower.includes('correlation') || questionLower.includes('scatter') || questionLower.includes('relationship')) {
      chartType = 'RechartScatter';
      chartProps = { xAxis: numericFields[0] || stringFields[0], yAxis: numericFields[1] || numericFields[0], height: 400 };
    } else if (numericFields.length >= 2 && stringFields.length === 0) {
      chartType = 'RechartScatter';
      chartProps = { xAxis: numericFields[0], yAxis: numericFields[1], height: 400 };
    } else {
      chartType = 'RechartBar';
      chartProps = { xAxis: stringFields[0] || numericFields[0] || 'x', yAxis: numericFields[0] || stringFields[0] || 'y', height: 400 };
    }

    return {
      root: 'main-container',
      elements: {
        'main-container': {
          type: 'Stack',
          props: { direction: 'column', gap: 16 },
          children: ['title-card', 'chart-element']
        },
        'title-card': {
          type: 'Card',
          props: {
            title: question,
            description: `Showing ${data.length} records`
          },
          children: []
        },
        'chart-element': {
          type: chartType,
          props: chartProps,
          children: []
        }
      }
    };
  }

  buildStatSpec(question, row, numericFields, metadata = {}) {
    const entries = Object.entries(row).filter(([k]) => k && k.trim());
    
    const lines = entries.map(([key, value]) => {
      const label = key.replace(/_/g, ' ');
      const formatted = typeof value === 'number'
        ? value.toLocaleString('en-US', { maximumFractionDigits: 2 })
        : String(value);
      return `${label}: ${formatted}`;
    });

    const description = lines.join('\n') || `Value: ${Object.values(row)[0]}`;
    const title = question.charAt(0).toUpperCase() + question.slice(1);

    return {
      root: 'main-container',
      elements: {
        'main-container': {
          type: 'Stack',
          props: { direction: 'column', gap: 16 },
          children: ['stat-card', 'query-info']
        },
        'stat-card': {
          type: 'Card',
          props: {
            title: title,
            description: description
          },
          children: []
        },
        'query-info': {
          type: 'Card',
          props: {
            title: 'Query',
            description: metadata.query || ''
          },
          children: []
        }
      },
      state: {
        chartData: [row]
      }
    };
  }

  inferSchema(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return { fields: [] };
    }

    const firstRow = data[0];
    const fields = Object.keys(firstRow).map((key) => {
      const value = firstRow[key];
      let type = typeof value;
      if (type === 'number') type = 'number';
      else if (value instanceof Date) type = 'date';
      else type = 'string';

      return { name: key, type };
    });

    return { fields, rowCount: data.length };
  }

  generateErrorSpec(message) {
    return {
      root: 'error-card',
      elements: {
        'error-card': {
          type: 'Card',
          props: {
            title: 'Error',
            description: message,
          },
          children: [],
        },
      },
      state: {},
    };
  }
}

module.exports = AISpecGenerator;
