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

async function listTables() {
  try {
    console.log('Connecting to Azure SQL...\n');
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✓ Connected!\n');
    
    // Get all table names
    const result = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log('📊 Tables in database "nt-sqlserver-ms":\n');
    console.log('─'.repeat(50));
    
    result.recordset.forEach((row, index) => {
      console.log(`${index + 1}. ${row.TABLE_NAME}`);
    });
    
    console.log('─'.repeat(50));
    console.log(`\nTotal tables: ${result.recordset.length}\n`);
    
    // Get detailed info for each table
    console.log('\n📋 Table Details:\n');
    for (const table of result.recordset) {
      const tableInfo = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${table.TABLE_NAME}'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log(`${table.TABLE_NAME}:`);
      tableInfo.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
      });
      console.log();
    }
    
    await pool.close();
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

listTables();
