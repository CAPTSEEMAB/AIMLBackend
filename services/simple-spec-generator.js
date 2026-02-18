const Logger = require('../utils/logger');

const logger = new Logger('SimpleSpecGenerator');

class SimpleSpecGenerator {
  generateSpec(question, data, metadata = {}) {
    try {
      logger.info('Generating simple spec', { question, dataCount: data?.length || 0 });

      if (!Array.isArray(data) || data.length === 0) {
        return this.generateErrorSpec('No data available');
      }

      const fields = Object.keys(data[0]);
      const numericFields = fields.filter(f => typeof data[0][f] === 'number');
      const categoryFields = fields.filter(f => typeof data[0][f] === 'string');

      let chartType = 'bar';
      let xAxis = categoryFields[0] || fields[0];
      let yAxis = numericFields[0] || fields[1];

      logger.info('Inferred spec parameters', { chartType, xAxis, yAxis, fields });

      const elementId = `chart-${Date.now()}`;
      const spec = {
        root: elementId,
        elements: {
          [elementId]: {
            type: 'RechartBar',
            props: {
              title: question,
              xAxis: xAxis,
              yAxis: yAxis,
              height: 400,
            },
            children: [],
          },
        },
        state: {
          chartData: data,
        },
      };

      logger.info('Spec generated successfully', { elementCount: Object.keys(spec.elements).length });
      return spec;
    } catch (error) {
      logger.error('Failed to generate spec', error);
      return this.generateErrorSpec(error.message);
    }
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

module.exports = SimpleSpecGenerator;
