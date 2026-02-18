const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { processQuestion, initializeDynamicConfig } = require('./nl2sql-simple');
const { AxisDetector } = require('./services/chart-detector');
const SimpleSpecGenerator = require('./services/simple-spec-generator');
const AISpecGenerator = require('./services/ai-spec-generator');
const SpecValidator = require('./services/spec-validator');
const Logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;
const logger = new Logger('Server');

app.use(cors());
app.use(express.json());

let dynamicConfig = null;
let axisDetector = null;
let aiSpecGenerator = null;

async function initializeApp() {
  try {
    logger.info('Initializing application...');
    dynamicConfig = await initializeDynamicConfig();
    axisDetector = new AxisDetector(dynamicConfig, logger);
    try {
      aiSpecGenerator = new AISpecGenerator();
      logger.info('AI Spec Generator initialized');
    } catch (groqError) {
      logger.warn('Failed to initialize AI Spec Generator', groqError.message);
      logger.warn('Continuing without AI spec generation - fallback specs only');
    }
    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize application', error);
    throw error;
  }
}

app.post('/api/query', async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ success: false, error: 'Question is required' });
  }

  try {
    logger.info(`Query received: ${question}`);

    const result = await processQuestion(question, dynamicConfig);
    
    if (result.success && result.data) {
      try {
        let spec;
        if (aiSpecGenerator) {
          spec = await aiSpecGenerator.generateSpec(
            question,
            result.data,
            {
              chartType: result.chartType,
              xAxis: result.xAxis,
              yAxis: result.yAxis,
              query: result.query
            }
          );
        } else {
          logger.warn('AI Spec Generator not available, using fallback');
          spec = {
            root: 'data-card',
            elements: {
              'data-card': {
                type: 'Card',
                props: {
                  title: 'Query Results',
                  description: `Found ${result.data.length} records`,
                },
                children: [],
              },
            },
            state: {
              chartData: result.data,
            },
          };
        }

        const validation = SpecValidator.validate(spec);
        const propValidation = SpecValidator.validatePropBindings(spec);

        if (!validation.valid) {
          logger.warn('Spec validation failed', {
            question,
            errors: validation.errors,
          });

          const errorSpec = {
            root: 'error-card',
            elements: {
              'error-card': {
                type: 'Card',
                props: {
                  title: 'Error',
                  description: `Spec validation failed: ${validation.errors.join('; ')}`,
                },
                children: [],
              },
            },
            state: {},
          };

          return res.json({
            success: false,
            question,
            spec: errorSpec,
            error: `Spec validation failed: ${validation.errors[0]}`,
            data: [],
            validation: SpecValidator.report(validation),
          });
        }

        if (propValidation.length > 0) {
          logger.warn('Prop binding validation failed', {
            question,
            errors: propValidation,
          });
        }

        logger.info('Spec generated and validated successfully', {
          question,
          elementCount: Object.keys(spec.elements).length,
        });

        res.json({
          success: true,
          question,
          spec: spec,
          query: result.query,
          data: result.data || [],
          validation: SpecValidator.report(validation),
        });
      } catch (specError) {
        logger.error('Failed to generate spec', specError);
        const errorSpec = {
          root: 'error-card',
          elements: {
            'error-card': {
              type: 'Card',
              props: {
                title: 'Error',
                description: `Failed to generate visualization: ${specError.message}`,
              },
              children: [],
            },
          },
          state: {},
        };

        res.json({
          success: false,
          question,
          spec: errorSpec,
          error: specError.message,
          data: result.data || [],
        });
      }
    } else {
      const errorSpec = {
        root: 'error-card',
        elements: {
          'error-card': {
            type: 'Card',
            props: {
              title: 'Error',
              description: result.error || 'Failed to generate visualization',
            },
            children: [],
          },
        },
        state: {},
      };

      const validation = SpecValidator.validate(errorSpec);

      res.json({
        success: false,
        question,
        spec: errorSpec,
        error: result.error,
        data: [],
        validation: SpecValidator.report(validation),
      });
    }
  } catch (error) {
    logger.error('Query processing error', error);
    const errorSpec = {
      root: 'error-card',
      elements: {
        'error-card': {
          type: 'Card',
          props: {
            title: 'Error',
            description: error.message || 'Failed to process question',
          },
          children: [],
        },
      },
      state: {},
    };
    
    const validation = SpecValidator.validate(errorSpec);
    
    res.status(500).json({
      success: false,
      question,
      spec: errorSpec,
      error: error.message || 'Failed to process question',
      data: [],
      validation: SpecValidator.report(validation),
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    dynamicConfigReady: !!dynamicConfig
  });
});

app.listen(PORT, async () => {
  try {
    await initializeApp();
    logger.info(`API Server running on http://localhost:${PORT}`);
    logger.info('Available Endpoints:');
    logger.info(`  GET  http://localhost:${PORT}/health`);
    logger.info(`  POST http://localhost:${PORT}/api/query`);
    logger.info(`Example: POST /api/query with { "question": "top 5 products by sales" }`);
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
});
