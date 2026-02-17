const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { processQuestion, initializeDynamicConfig } = require('./nl2sql-simple');
const { AxisDetector } = require('./services/chart-detector');
const Logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;
const logger = new Logger('Server');

app.use(cors());
app.use(express.json());

let dynamicConfig = null;
let axisDetector = null;

async function initializeApp() {
  try {
    logger.info('Initializing application...');
    dynamicConfig = await initializeDynamicConfig();
    axisDetector = new AxisDetector(dynamicConfig, logger);
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
    const { xAxis, yAxis } = axisDetector.detectAxes(result.data, result.chartType);
    const { xAxis: xAxis2, yAxis: yAxis2 } = result.secondaryChartType 
      ? axisDetector.detectAxes(result.data, result.secondaryChartType) 
      : { xAxis: null, yAxis: null };

    res.json({
      success: result.success,
      question,
      query: result.query,
      data: result.data || [],
      chartType: result.chartType || 'table',
      xAxis,
      yAxis,
      secondaryChartType: result.secondaryChartType || null,
      xAxis2,
      yAxis2,
      error: result.error,
    });
  } catch (error) {
    logger.error('Query processing error', error);
    res.status(500).json({
      success: false,
      question,
      error: error.message || 'Failed to process question',
      data: [],
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
