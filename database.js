require('dotenv').config();
const sql = require('mssql');

let pool = null;

const getConfig = () => {
  if (process.env.AZURE_SQL_ACCESS_TOKEN) {
    return {
      server: process.env.AZURE_SQL_SERVER,
      database: process.env.AZURE_SQL_DATABASE,
      authentication: {
        type: 'azure-active-directory-access-token',
        options: {
          token: process.env.AZURE_SQL_ACCESS_TOKEN
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
  } else {
    return {
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
  }
};

const getPool = async () => {
  if (!pool) {
    const config = getConfig();
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✓ Azure SQL connected');
  }
  return pool;
};

const getTableName = () => process.env.AZURE_SQL_TABLE || 'products';

module.exports = { sql, getPool, getTableName };
