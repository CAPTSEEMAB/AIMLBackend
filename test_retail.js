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

async function test() {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    console.log('✓ Connected to Retail table\n');
    
    // Test 1: Get top 5 rows
    console.log('Test 1: Top 5 rows from Retail');
    const test1 = await pool.request().query('SELECT TOP 5 Category, Product_Name, Sales FROM Retail');
    console.log(test1.recordset.slice(0, 3));
    console.log();
    
    // Test 2: Sales by category
    console.log('Test 2: Total Sales by Category');
    const test2 = await pool.request().query('SELECT Category, SUM(CAST(Sales as FLOAT)) as Total_Sales FROM Retail GROUP BY Category');
    console.log(test2.recordset);
    console.log();
    
    // Test 3: Count by region
    console.log('Test 3: Order count by Region');
    const test3 = await pool.request().query('SELECT Region, COUNT(*) as Order_Count FROM Retail GROUP BY Region');
    console.log(test3.recordset);
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

test();
