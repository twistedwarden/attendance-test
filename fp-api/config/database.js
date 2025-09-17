import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database connection pool
let pool;

// Initialize database connection
const initializeDatabase = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'attendance',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test the connection
    const connection = await pool.getConnection();
    console.log('✅ Fingerprint API Database connected successfully');
    connection.release();

    // Ensure fingerprint tables exist
    await ensureFingerprintTables();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

const ensureFingerprintTables = async () => {
  try {
    // Create fingerprint_log table for tracking ESP32 interactions
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS fingerprint_log (
        LogID INT AUTO_INCREMENT PRIMARY KEY,
        StudentID INT,
        ESP32DeviceID VARCHAR(50),
        Action ENUM('enroll', 'verify', 'delete') NOT NULL,
        Status ENUM('success', 'failed', 'error') NOT NULL,
        Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ErrorMessage TEXT NULL,
        DeviceIP VARCHAR(45),
        FOREIGN KEY (StudentID) REFERENCES studentrecord(StudentID) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    // Create esp32_devices table for device management
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS esp32_devices (
        DeviceID VARCHAR(50) PRIMARY KEY,
        DeviceName VARCHAR(100) NOT NULL,
        Location VARCHAR(100),
        Status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
        LastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    console.log('✅ Fingerprint tables ensured');
  } catch (error) {
    console.error('❌ Error ensuring fingerprint tables:', error.message);
    throw error;
  }
};

// Database operations for fingerprint management
export const enrollFingerprint = async (studentId, fingerprintTemplate, deviceId, deviceIP) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Update student record with fingerprint template
    const [result] = await connection.execute(
      'UPDATE studentrecord SET FingerprintTemplate = ? WHERE StudentID = ?',
      [fingerprintTemplate, studentId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Student not found');
    }

    // Log the enrollment
    await connection.execute(
      'INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, DeviceIP) VALUES (?, ?, ?, ?, ?)',
      [studentId, deviceId, 'enroll', 'success', deviceIP]
    );

    await connection.commit();
    return { success: true, message: 'Fingerprint enrolled successfully' };
  } catch (error) {
    await connection.rollback();
    
    // Log the error
    await connection.execute(
      'INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, ErrorMessage, DeviceIP) VALUES (?, ?, ?, ?, ?, ?)',
      [studentId, deviceId, 'enroll', 'error', error.message, deviceIP]
    );
    
    throw error;
  } finally {
    connection.release();
  }
};

export const verifyFingerprint = async (fingerprintTemplate, deviceId, deviceIP) => {
  const connection = await pool.getConnection();
  try {
    // Find matching student by fingerprint template
    const [rows] = await connection.execute(
      'SELECT StudentID, FullName, GradeLevel FROM studentrecord WHERE FingerprintTemplate = ?',
      [fingerprintTemplate]
    );

    if (rows.length === 0) {
      // Log failed verification
      await connection.execute(
        'INSERT INTO fingerprint_log (ESP32DeviceID, Action, Status, ErrorMessage, DeviceIP) VALUES (?, ?, ?, ?, ?)',
        [deviceId, 'verify', 'failed', 'No matching fingerprint found', deviceIP]
      );
      
      return { success: false, message: 'Fingerprint not found', student: null };
    }

    const student = rows[0];

    // Log successful verification
    await connection.execute(
      'INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, DeviceIP) VALUES (?, ?, ?, ?, ?)',
      [student.StudentID, deviceId, 'verify', 'success', deviceIP]
    );

    return { 
      success: true, 
      message: 'Fingerprint verified successfully', 
      student: {
        studentId: student.StudentID,
        fullName: student.FullName,
        gradeLevel: student.GradeLevel
      }
    };
  } catch (error) {
    // Log the error
    await connection.execute(
      'INSERT INTO fingerprint_log (ESP32DeviceID, Action, Status, ErrorMessage, DeviceIP) VALUES (?, ?, ?, ?, ?)',
      [deviceId, 'verify', 'error', error.message, deviceIP]
    );
    
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteFingerprint = async (studentId, deviceId, deviceIP) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Clear fingerprint template
    const [result] = await connection.execute(
      'UPDATE studentrecord SET FingerprintTemplate = NULL WHERE StudentID = ?',
      [studentId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Student not found');
    }

    // Log the deletion
    await connection.execute(
      'INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, DeviceIP) VALUES (?, ?, ?, ?, ?)',
      [studentId, deviceId, 'delete', 'success', deviceIP]
    );

    await connection.commit();
    return { success: true, message: 'Fingerprint deleted successfully' };
  } catch (error) {
    await connection.rollback();
    
    // Log the error
    await connection.execute(
      'INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, ErrorMessage, DeviceIP) VALUES (?, ?, ?, ?, ?)',
      [studentId, deviceId, 'delete', 'error', error.message, deviceIP]
    );
    
    throw error;
  } finally {
    connection.release();
  }
};

export const getStudentByFingerprint = async (fingerprintTemplate) => {
  try {
    const [rows] = await pool.execute(
      'SELECT StudentID, FullName, GradeLevel FROM studentrecord WHERE FingerprintTemplate = ?',
      [fingerprintTemplate]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error getting student by fingerprint:', error);
    throw error;
  }
};

export const getFingerprintLogs = async (limit = 50, offset = 0) => {
  try {
    const [rows] = await pool.execute(
      `SELECT fl.*, sr.FullName as StudentName 
       FROM fingerprint_log fl 
       LEFT JOIN studentrecord sr ON sr.StudentID = fl.StudentID 
       ORDER BY fl.Timestamp DESC 
       LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching fingerprint logs:', error);
    throw error;
  }
};

export const registerESP32Device = async (deviceId, deviceName, location) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO esp32_devices (DeviceID, DeviceName, Location) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE DeviceName = ?, Location = ?, LastSeen = CURRENT_TIMESTAMP',
      [deviceId, deviceName, location, deviceName, location]
    );
    return { success: true, message: 'ESP32 device registered successfully' };
  } catch (error) {
    console.error('Error registering ESP32 device:', error);
    throw error;
  }
};

export const updateESP32DeviceStatus = async (deviceId, status) => {
  try {
    const [result] = await pool.execute(
      'UPDATE esp32_devices SET Status = ?, LastSeen = CURRENT_TIMESTAMP WHERE DeviceID = ?',
      [status, deviceId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating ESP32 device status:', error);
    throw error;
  }
};

export const getESP32Devices = async () => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM esp32_devices ORDER BY LastSeen DESC'
    );
    return rows;
  } catch (error) {
    console.error('Error fetching ESP32 devices:', error);
    throw error;
  }
};

// Initialize database on startup
initializeDatabase();

// Export the pool for other modules that might need it
export { pool };

