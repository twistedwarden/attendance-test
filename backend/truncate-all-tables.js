import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'attendance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// List of all tables in the database (in order to handle foreign key constraints)
const tables = [
  'attendancereport',
  'subjectattendance', 
  'attendancelog',
  'studentschedule',
  'enrollment_documents',
  'registration_otp',
  'userotp',
  'notificationlog',
  'audittrail',
  'loginactivity',
  'studentrecord',
  'teacherrecord',
  'adminrecord',
  'registrarrecord',
  'parent',
  'teacherschedule',
  'subject',
  'section',
  'useraccount'
];

async function truncateAllTables() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔄 Starting to truncate all tables...');
    
    // Disable foreign key checks temporarily
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Foreign key checks disabled');
    
    // Truncate each table
    for (const table of tables) {
      try {
        await connection.execute(`TRUNCATE TABLE \`${table}\``);
        console.log(`✅ Truncated table: ${table}`);
      } catch (error) {
        // Table might not exist, continue with others
        console.log(`⚠️  Table ${table} not found or already empty: ${error.message}`);
      }
    }
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Foreign key checks re-enabled');
    
    console.log('🎉 All tables have been successfully truncated!');
    
  } catch (error) {
    console.error('❌ Error truncating tables:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Run the truncation
truncateAllTables()
  .then(() => {
    console.log('✅ Database truncation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database truncation failed:', error);
    process.exit(1);
  });
