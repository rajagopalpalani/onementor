const db = require('../config/mysql');

async function clearDatabase() {
  let connection;
  
  try {
    connection = await db.getConnection();
    
    console.log('Starting database cleanup...');
    
    // Disable foreign key checks temporarily
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Get all table names from the database
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_TYPE = 'BASE TABLE'
    `, [process.env.DB_NAME || 'onementor']);
    
    // Filter out registration_fees table
    const tablesToClear = tables
      .map(row => row.TABLE_NAME)
      .filter(tableName => tableName !== 'registration_fees');
    
    if (tablesToClear.length === 0) {
      console.log('No tables to clear (only registration_fees exists).');
      return;
    }
    
    console.log(`Found ${tablesToClear.length} tables to clear:`, tablesToClear);
    
    // Truncate each table
    for (const tableName of tablesToClear) {
      try {
        await connection.query(`TRUNCATE TABLE \`${tableName}\``);
        console.log(`✓ Cleared table: ${tableName}`);
      } catch (error) {
        console.error(`✗ Error clearing table ${tableName}:`, error.message);
      }
    }
    
    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\nDatabase cleanup completed successfully!');
    console.log('Note: registration_fees table was preserved.');
    
  } catch (error) {
    console.error('Error during database cleanup:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
    // Close the connection pool
    await db.end();
    process.exit(0);
  }
}

// Run the script
clearDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
