import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
let connection;

const connectToDatabase = async () => {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'attendance',
    });
    console.log('✅ Connected to database');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

const runMigration = async (migrationFile) => {
  try {
    console.log(`📄 Running migration: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL file by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    
    console.log(`✅ Migration completed: ${migrationFile}`);
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationFile}`, error.message);
    throw error;
  }
};

const getMigrationFiles = () => {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 No migrations directory found');
    return [];
  }
  
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
};

const checkMigrationTable = async () => {
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS fingerprint_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_file VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
  } catch (error) {
    console.error('❌ Failed to create migrations table:', error.message);
    throw error;
  }
};

const isMigrationExecuted = async (migrationFile) => {
  try {
    const [rows] = await connection.execute(
      'SELECT id FROM fingerprint_migrations WHERE migration_file = ?',
      [migrationFile]
    );
    return rows.length > 0;
  } catch (error) {
    return false;
  }
};

const markMigrationExecuted = async (migrationFile) => {
  try {
    await connection.execute(
      'INSERT INTO fingerprint_migrations (migration_file) VALUES (?)',
      [migrationFile]
    );
  } catch (error) {
    console.error('❌ Failed to mark migration as executed:', error.message);
    throw error;
  }
};

const main = async () => {
  try {
    console.log('🔐 Fingerprint API Database Migration');
    console.log('=====================================');
    
    // Connect to database
    await connectToDatabase();
    
    // Check/create migrations table
    await checkMigrationTable();
    
    // Get migration files
    const migrationFiles = getMigrationFiles();
    
    if (migrationFiles.length === 0) {
      console.log('📄 No migration files found');
      return;
    }
    
    console.log(`📄 Found ${migrationFiles.length} migration files`);
    
    // Run migrations
    let executedCount = 0;
    for (const migrationFile of migrationFiles) {
      const isExecuted = await isMigrationExecuted(migrationFile);
      
      if (isExecuted) {
        console.log(`⏭️  Skipping already executed migration: ${migrationFile}`);
        continue;
      }
      
      await runMigration(migrationFile);
      await markMigrationExecuted(migrationFile);
      executedCount++;
    }
    
    console.log('');
    console.log(`🎉 Migration completed successfully!`);
    console.log(`📊 Executed ${executedCount} new migrations`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as runMigrations };
