require('dotenv').config();
const sql = require('mssql');

// Azure SQL connection pool
let pool = null;

const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.AZURE_SQL_USER,
      password: process.env.AZURE_SQL_PASSWORD
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableKeepAlive: true,
    connectionTimeout: 30000,
    requestTimeout: 30000
  }
};

// Initialize connection pool
const getPool = async () => {
  if (!pool) {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✓ Azure SQL connected');
  }
  return pool;
};

const getTableName = () => process.env.AZURE_SQL_TABLE || 'products';

module.exports = { sql, getPool, getTableName };
