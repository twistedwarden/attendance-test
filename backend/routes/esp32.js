import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// API Key authentication middleware for ESP32
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.API_KEY || '765a6c3504ca79e2cdbd9197fbe9f99d';
  
  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
  }
  
  next();
};

// Dual authentication middleware - supports both JWT (web) and API key (ESP32)
const authenticateDual = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const apiKey = req.headers['x-api-key'];
  
  // Check for JWT token first (web users)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req, res, next);
  }
  
  // Fall back to API key authentication (ESP32 devices)
  if (apiKey) {
    return authenticateApiKey(req, res, next);
  }
  
  // No valid authentication found
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Provide either JWT token or API key.'
  });
};

// Apply dual authentication to all routes
router.use(authenticateDual);

// Get all ESP32 devices
router.get('/devices', async (req, res) => {
  try {
    const [devices] = await pool.query(`
      SELECT 
        d.*,
        COUNT(fl.LogID) as totalOperations,
        COUNT(CASE WHEN fl.Status = 'success' THEN 1 END) as successfulOperations,
        COUNT(CASE WHEN fl.Status = 'error' THEN 1 END) as errorOperations,
        MAX(fl.Timestamp) as lastOperation
      FROM esp32_devices d
      LEFT JOIN fingerprint_log fl ON d.DeviceID = fl.ESP32DeviceID
      GROUP BY d.DeviceID
      ORDER BY d.LastSeen DESC
    `);
    
    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    console.error('Error fetching ESP32 devices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ESP32 devices'
    });
  }
});

// Get device status and health
router.get('/devices/:deviceId/status', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const [device] = await pool.query(
      'SELECT * FROM esp32_devices WHERE DeviceID = ?',
      [deviceId]
    );
    
    if (device.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    // Get recent operations
    const [operations] = await pool.query(`
      SELECT 
        fl.*,
        sr.FullName as StudentName
      FROM fingerprint_log fl
      LEFT JOIN studentrecord sr ON fl.StudentID = sr.StudentID
      WHERE fl.ESP32DeviceID = ?
      ORDER BY fl.Timestamp DESC
      LIMIT 10
    `, [deviceId]);
    
    // Get device statistics
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as totalOperations,
        COUNT(CASE WHEN Status = 'success' THEN 1 END) as successfulOperations,
        COUNT(CASE WHEN Status = 'error' THEN 1 END) as errorOperations,
        COUNT(CASE WHEN Status = 'failed' THEN 1 END) as failedOperations,
        0 as avgResponseTime
      FROM fingerprint_log 
      WHERE ESP32DeviceID = ? 
      AND Timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `, [deviceId]);
    
    res.json({
      success: true,
      data: {
        device: device[0],
        recentOperations: operations,
        statistics: stats[0]
      }
    });
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device status'
    });
  }
});

// ESP32 sends status update (POST)
router.post('/devices/:deviceId/status', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { status, lastSeen, uptime, fingerprintCount, wifiSSID } = req.body;
    
    // Update device status and last seen
    await pool.query(
      'UPDATE esp32_devices SET Status = ?, LastSeen = NOW(), UpdatedAt = NOW(), WiFiSSID = COALESCE(?, WiFiSSID) WHERE DeviceID = ?',
      [status || 'active', wifiSSID || null, deviceId]
    );
    
    res.json({
      success: true,
      message: 'Device status updated successfully'
    });
  } catch (error) {
    console.error('Error updating device status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device status'
    });
  }
});

// Update device status
router.put('/devices/:deviceId/status', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { status, location, deviceName } = req.body;
    
    if (!status || !['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or maintenance'
      });
    }
    
    const updateFields = ['Status = ?'];
    const updateValues = [status];
    
    if (location) {
      updateFields.push('Location = ?');
      updateValues.push(location);
    }
    
    if (deviceName) {
      updateFields.push('DeviceName = ?');
      updateValues.push(deviceName);
    }
    
    updateValues.push(deviceId);
    
    await pool.query(
      `UPDATE esp32_devices SET ${updateFields.join(', ')}, UpdatedAt = NOW() WHERE DeviceID = ?`,
      updateValues
    );
    
    res.json({
      success: true,
      message: 'Device status updated successfully'
    });
  } catch (error) {
    console.error('Error updating device status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device status'
    });
  }
});

// Store pending commands in memory (in production, use Redis or database)
const pendingCommands = new Map();

// Send command to ESP32 device
router.post('/devices/:deviceId/command', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { command, parameters } = req.body;
    
            // Validate command
            const validCommands = ['restart', 'reset', 'clear_all', 'test_connection', 'update_settings', 'enroll', 'delete_fingerprint'];
            if (!validCommands.includes(command)) {
              return res.status(400).json({
                success: false,
                message: `Invalid command. Valid commands: ${validCommands.join(', ')}`
              });
            }
    
    // Check if device exists
    const [device] = await pool.query(
      'SELECT * FROM esp32_devices WHERE DeviceID = ?',
      [deviceId]
    );
    
    if (device.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    // Store command for ESP32 to pick up
    const commandId = Date.now();
    pendingCommands.set(deviceId, {
      command,
      parameters,
      timestamp: new Date(),
      commandId
    });
    
    // Log the command in fingerprint_log
    await pool.query(
      'INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, Timestamp, DeviceIP) VALUES (?, ?, ?, ?, NOW(), ?)',
      [null, deviceId, 'command', 'success', req.ip]
    );
    
    // Execute command based on type
    let message = '';
    switch (command) {
      case 'restart':
        message = 'Device restart command queued successfully';
        break;
      case 'reset':
        // Clear all fingerprints from database
        await pool.query('UPDATE studentrecord SET FingerprintTemplate = NULL');
        message = 'Device reset command queued successfully';
        break;
      case 'clear_all':
        // Clear all fingerprints from database
        await pool.query('UPDATE studentrecord SET FingerprintTemplate = NULL');
        message = 'All fingerprints cleared from database';
        break;
      case 'test_connection':
        message = 'Connection test command queued successfully';
        break;
      case 'update_settings':
        message = 'Settings update command queued successfully';
        break;
      default:
        message = `Command '${command}' queued successfully`;
    }
    
    res.json({
      success: true,
      message: message,
      commandId: commandId
    });
  } catch (error) {
    console.error('Error sending command to device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send command to device'
    });
  }
});

// ESP32 polls this endpoint to get pending commands
router.get('/devices/:deviceId/command', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Check for pending command
    const pendingCommand = pendingCommands.get(deviceId);
    
    if (pendingCommand) {
      // Remove command after sending (one-time execution)
      pendingCommands.delete(deviceId);
      
      res.json({
        success: true,
        hasCommand: true,
        command: pendingCommand.command,
        parameters: pendingCommand.parameters,
        commandId: pendingCommand.commandId
      });
    } else {
      res.json({
        success: true,
        hasCommand: false
      });
    }
  } catch (error) {
    console.error('Error getting command for device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get command for device'
    });
  }
});

// Get device logs
router.get('/devices/:deviceId/logs', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const limitInt = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
    const offsetInt = Math.max(parseInt(offset, 10) || 0, 0);
    
    const [logs] = await pool.query(`
      SELECT 
        fl.*,
        sr.FullName as StudentName
      FROM fingerprint_log fl
      LEFT JOIN studentrecord sr ON fl.StudentID = sr.StudentID
      WHERE fl.ESP32DeviceID = ?
      ORDER BY fl.Timestamp DESC
      LIMIT ${limitInt} OFFSET ${offsetInt}
    `, [deviceId]);
    
    const [totalCount] = await pool.query(
      'SELECT COUNT(*) as count FROM fingerprint_log WHERE ESP32DeviceID = ?',
      [deviceId]
    );
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        total: totalCount[0].count,
        limit: limitInt,
        offset: offsetInt
      }
    });
  } catch (error) {
    console.error('Error fetching device logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device logs'
    });
  }
});

// Clear logs for a device
router.delete('/devices/:deviceId/logs', async (req, res) => {
  try {
    const { deviceId } = req.params;
    await pool.query('DELETE FROM fingerprint_log WHERE ESP32DeviceID = ?', [deviceId]);
    res.json({ success: true, message: 'Logs cleared' });
  } catch (error) {
    console.error('Error clearing device logs:', error);
    res.status(500).json({ success: false, message: 'Failed to clear logs' });
  }
});

// Get fingerprint enrollment status for a device
router.get('/devices/:deviceId/enrollment-status', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Get students with fingerprints enrolled
    const [enrolledStudents] = await pool.query(`
      SELECT 
        sr.StudentID,
        sr.FullName,
        sr.GradeLevel,
        sr.FingerprintTemplate,
        CASE 
          WHEN sr.FingerprintTemplate IS NOT NULL THEN 'enrolled'
          ELSE 'not_enrolled'
        END as enrollmentStatus
      FROM studentrecord sr
      WHERE sr.FingerprintTemplate IS NOT NULL
      ORDER BY sr.FullName
    `);
    
    // Get total students
    const [totalStudents] = await pool.query(
      'SELECT COUNT(*) as count FROM studentrecord'
    );
    
    // Get enrollment statistics
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as totalStudents,
        COUNT(CASE WHEN FingerprintTemplate IS NOT NULL THEN 1 END) as enrolledStudents,
        COUNT(CASE WHEN FingerprintTemplate IS NULL THEN 1 END) as notEnrolledStudents
      FROM studentrecord
    `);
    
    res.json({
      success: true,
      data: {
        enrolledStudents,
        statistics: stats[0]
      }
    });
  } catch (error) {
    console.error('Error fetching enrollment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollment status'
    });
  }
});

// Get enrolled fingerprint IDs for a device
router.get('/devices/:deviceId/fingerprints', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Get students with fingerprints enrolled
    const [fingerprints] = await pool.query(`
      SELECT 
        sr.StudentID,
        sr.FullName,
        sr.GradeLevel,
        sr.FingerprintTemplate,
        CASE 
          WHEN sr.FingerprintTemplate IS NOT NULL THEN 'enrolled'
          ELSE 'not_enrolled'
        END as enrollmentStatus,
        fl.Timestamp as lastEnrollment
      FROM studentrecord sr
      LEFT JOIN fingerprint_log fl ON sr.StudentID = fl.StudentID 
        AND fl.Action = 'enroll' 
        AND fl.Status = 'success'
      WHERE sr.FingerprintTemplate IS NOT NULL
      ORDER BY sr.StudentID
    `);
    
    res.json({
      success: true,
      data: fingerprints
    });
  } catch (error) {
    console.error('Error fetching fingerprints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fingerprints'
    });
  }
});

// Delete specific fingerprint by student ID
router.delete('/devices/:deviceId/fingerprints/:studentId', async (req, res) => {
  try {
    const { deviceId, studentId } = req.params;
    
    // Check if student exists
    const [student] = await pool.query(
      'SELECT StudentID, FullName FROM studentrecord WHERE StudentID = ?',
      [studentId]
    );
    
    if (student.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Try to resolve fingerprintId for device-side deletion
    let fingerprintId = null;
    try {
      const [mapped] = await pool.query(
        'SELECT FingerprintID FROM fingerprint_mapping WHERE StudentID = ? LIMIT 1',
        [studentId]
      );
      if (mapped.length > 0) {
        fingerprintId = parseInt(mapped[0].FingerprintID);
      } else {
        const [legacy] = await pool.query(
          "SELECT CAST(FingerprintTemplate AS UNSIGNED) as fid FROM studentrecord WHERE StudentID = ? AND FingerprintTemplate IS NOT NULL AND FingerprintTemplate != ''",
          [studentId]
        );
        if (legacy.length > 0 && !isNaN(legacy[0].fid)) {
          fingerprintId = parseInt(legacy[0].fid);
        }
      }
    } catch (_) {
      // best-effort; continue
    }

    // Clear fingerprint template for this student (database)
    await pool.query(
      'UPDATE studentrecord SET FingerprintTemplate = NULL WHERE StudentID = ?',
      [studentId]
    );

    // Remove normalized mappings for this student (database)
    await pool.query(
      'DELETE FROM fingerprint_mapping WHERE StudentID = ?',
      [studentId]
    );

    // Queue device command to delete the fingerprint on the ESP32 (if we know the slot)
    if (!isNaN(fingerprintId) && fingerprintId > 0) {
      const commandId = Date.now();
      pendingCommands.set(deviceId, {
        command: 'delete_fingerprint',
        parameters: { fingerprintId },
        timestamp: new Date(),
        commandId
      });
    }
    
    // Log the deletion
    await pool.query(
      'INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, Timestamp, DeviceIP) VALUES (?, ?, ?, ?, NOW(), ?)',
      [studentId, deviceId, 'delete', 'success', req.ip]
    );
    
    res.json({
      success: true,
      message: `Fingerprint deleted for student ${student[0].FullName}`,
      student: {
        id: student[0].StudentID,
        name: student[0].FullName
      }
    });
  } catch (error) {
    console.error('Error deleting fingerprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete fingerprint'
    });
  }
});

// Clear all fingerprints from a device (database only)
router.delete('/devices/:deviceId/clear-fingerprints', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Clear all fingerprint templates from database
    await pool.query(
      'UPDATE studentrecord SET FingerprintTemplate = NULL'
    );

    // Clear mapping table
    await pool.query('TRUNCATE TABLE fingerprint_mapping');

    // Queue device command to clear all fingerprints on ESP32
    const commandId = Date.now();
    pendingCommands.set(deviceId, {
      command: 'clear_all',
      parameters: {},
      timestamp: new Date(),
      commandId
    });
    
    // Log the action
    await pool.query(
      'INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, Timestamp, DeviceIP) VALUES (?, ?, ?, ?, NOW(), ?)',
      [null, deviceId, 'clear', 'success', req.ip]
    );
    
    res.json({
      success: true,
      message: 'All fingerprints cleared from database'
    });
  } catch (error) {
    console.error('Error clearing fingerprints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear fingerprints'
    });
  }
});

// Enroll fingerprint for a student
router.post('/devices/:deviceId/enroll', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { studentId, fingerprintId } = req.body;
    
    if (!studentId || !fingerprintId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and fingerprint ID are required'
      });
    }
    
    // Check if student exists
    const [student] = await pool.query(
      'SELECT StudentID, FullName FROM studentrecord WHERE StudentID = ?',
      [studentId]
    );
    
    if (student.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Update student record with fingerprint template (legacy compatibility)
    await pool.query(
      'UPDATE studentrecord SET FingerprintTemplate = ? WHERE StudentID = ?',
      [fingerprintId.toString(), studentId]
    );

    // Upsert into normalized mapping table
    await pool.query(
      `INSERT INTO fingerprint_mapping (StudentID, FingerprintID, FingerName, IsPrimary)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE FingerName = VALUES(FingerName), IsPrimary = VALUES(IsPrimary), UpdatedAt = CURRENT_TIMESTAMP`,
      [studentId, parseInt(fingerprintId), null, 1]
    );
    
    // Log the enrollment
    await pool.query(
      'INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, Timestamp, DeviceIP) VALUES (?, ?, ?, ?, NOW(), ?)',
      [studentId, deviceId, 'enroll', 'success', req.ip]
    );
    
    res.json({
      success: true,
      message: `Fingerprint enrolled for student ${student[0].FullName}`,
      student: {
        id: student[0].StudentID,
        name: student[0].FullName,
        fingerprintId: fingerprintId
      }
    });
  } catch (error) {
    console.error('Error enrolling fingerprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll fingerprint'
    });
  }
});

// Delete specific fingerprint by student ID
router.delete('/devices/:deviceId/fingerprints/:studentId', async (req, res) => {
  try {
    const { deviceId, studentId } = req.params;
    
    // Check if student exists
    const [student] = await pool.query(
      'SELECT StudentID, FullName FROM studentrecord WHERE StudentID = ?',
      [studentId]
    );
    
    if (student.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Clear fingerprint template for this student
    await pool.query(
      'UPDATE studentrecord SET FingerprintTemplate = NULL WHERE StudentID = ?',
      [studentId]
    );
    
    // Log the deletion
    await pool.query(
      'INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, Timestamp, DeviceIP) VALUES (?, ?, ?, ?, NOW(), ?)',
      [studentId, deviceId, 'delete', 'success', req.ip]
    );
    
    res.json({
      success: true,
      message: `Fingerprint deleted for student ${student[0].FullName}`,
      student: {
        id: student[0].StudentID,
        name: student[0].FullName
      }
    });
  } catch (error) {
    console.error('Error deleting fingerprint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete fingerprint'
    });
  }
});

// Get available fingerprint IDs (not yet used)
router.get('/devices/:deviceId/available-ids', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Get all possible fingerprint IDs (1-127 for most sensors)
    const allIds = Array.from({ length: 127 }, (_, i) => i + 1);
    
    // Get enrolled fingerprint IDs from database
    const [enrolled] = await pool.query(`
      SELECT DISTINCT CAST(FingerprintTemplate AS UNSIGNED) as fingerprintId 
      FROM studentrecord 
      WHERE FingerprintTemplate IS NOT NULL 
      AND FingerprintTemplate != ''
      AND CAST(FingerprintTemplate AS UNSIGNED) BETWEEN 1 AND 127
    `);
    
    const enrolledIds = enrolled.map(row => row.fingerprintId);
    const availableIds = allIds.filter(id => !enrolledIds.includes(id));
    
    res.json({
      success: true,
      data: availableIds,
      total: availableIds.length,
      enrolled: enrolledIds.length
    });
  } catch (error) {
    console.error('Error fetching available fingerprint IDs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available fingerprint IDs'
    });
  }
});

// Get enrolled fingerprint IDs
router.get('/devices/:deviceId/enrolled-ids', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Get enrolled fingerprint IDs with student information
    const [enrolled] = await pool.query(`
      SELECT DISTINCT
        sr.StudentID,
        sr.FullName,
        sr.GradeLevel,
        CAST(sr.FingerprintTemplate AS UNSIGNED) as fingerprintId,
        (SELECT MAX(fl.Timestamp) FROM fingerprint_log fl 
         WHERE fl.StudentID = sr.StudentID 
         AND fl.Action = 'enroll' 
         AND fl.Status = 'success') as enrolledAt
      FROM studentrecord sr
      WHERE sr.FingerprintTemplate IS NOT NULL 
      AND sr.FingerprintTemplate != ''
      AND CAST(sr.FingerprintTemplate AS UNSIGNED) BETWEEN 1 AND 127
      ORDER BY CAST(sr.FingerprintTemplate AS UNSIGNED)
    `);
    
    res.json({
      success: true,
      data: enrolled,
      total: enrolled.length
    });
  } catch (error) {
    console.error('Error fetching enrolled fingerprint IDs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrolled fingerprint IDs'
    });
  }
});

// Get all students for enrollment selection
router.get('/devices/:deviceId/students', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Get all students with their enrollment status
    const [students] = await pool.query(`
      SELECT 
        sr.StudentID,
        sr.FullName,
        sr.GradeLevel,
        CASE 
          WHEN sr.FingerprintTemplate IS NOT NULL 
            AND sr.FingerprintTemplate != ''
            AND CAST(sr.FingerprintTemplate AS UNSIGNED) BETWEEN 1 AND 127
          THEN 'enrolled'
          ELSE 'not_enrolled'
        END as enrollmentStatus,
        CAST(sr.FingerprintTemplate AS UNSIGNED) as fingerprintId
      FROM studentrecord sr
      ORDER BY sr.StudentID
    `);
    
    res.json({
      success: true,
      data: students,
      total: students.length
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
});

// Get student ID for a specific fingerprint ID
router.get('/devices/:deviceId/fingerprint-mapping/:fingerprintId', async (req, res) => {
  try {
    const { deviceId, fingerprintId } = req.params;
    
    // Prefer normalized mapping table
    const [mapped] = await pool.query(
      `SELECT fm.StudentID, sr.FullName, sr.GradeLevel, fm.FingerprintID as fingerprintId
       FROM fingerprint_mapping fm
       LEFT JOIN studentrecord sr ON sr.StudentID = fm.StudentID
       WHERE fm.FingerprintID = ?
       LIMIT 1`,
      [parseInt(fingerprintId)]
    );
    
    if (mapped.length > 0) {
      const student = mapped[0];
      res.json({
        success: true,
        studentId: student.StudentID,
        studentName: student.FullName,
        gradeLevel: student.GradeLevel,
        fingerprintId: student.fingerprintId
      });
    } else {
      // Fallback to legacy column for backward compatibility
      const [legacy] = await pool.query(`
        SELECT 
          sr.StudentID,
          sr.FullName,
          sr.GradeLevel,
          CAST(sr.FingerprintTemplate AS UNSIGNED) as fingerprintId
        FROM studentrecord sr
        WHERE sr.FingerprintTemplate = ?
        AND CAST(sr.FingerprintTemplate AS UNSIGNED) BETWEEN 1 AND 127
        LIMIT 1
      `, [fingerprintId]);
      if (legacy.length > 0) {
        const student = legacy[0];
        res.json({
          success: true,
          studentId: student.StudentID,
          studentName: student.FullName,
          gradeLevel: student.GradeLevel,
          fingerprintId: student.fingerprintId
        });
      } else {
        res.json({
          success: false,
          message: 'No student found for fingerprint ID ' + fingerprintId
        });
      }
    }
  } catch (error) {
    console.error('Error fetching fingerprint mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fingerprint mapping'
    });
  }
});

export default router;
