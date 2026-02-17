const sql = require('mssql');

const config = {
  server: 'mssqlserver-nt.database.windows.net',
  database: 'nt-sqlserver-ms',
  authentication: {
    type: 'default',
    options: {
      userName: 'msserver',
      password: 'admin@911'
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectionTimeout: 30000,
    requestTimeout: 30000
  }
};

async function testQuery() {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✓ Connected to Azure SQL\n');
    
    // Test 1: Get row count
    const countResult = await pool.request().query('SELECT COUNT(*) as cnt FROM Retail');
    console.log('Row Count:', countResult.recordset[0]);
    
    // Test 2: Sample data
    const sampleResult = await pool.request().query('SELECT TOP 2 * FROM Retail');
    console.log('\nSample Data (Top 2):');
    console.log(sampleResult.recordset);
    
    // Test 3: Sales by Category
    const categoryResult = await pool.request().query('SELECT Category, SUM(Sales) as Total_Sales FROM Retail GROUP BY Category');
    console.log('\nSales by Category:');
    console.log(categoryResult.recordset);
    
    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testQuery();
