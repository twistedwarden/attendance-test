import express from 'express';
import { pool } from '../config/database.js';
import { createSubjectAttendance } from '../config/database.js';
import crypto from 'crypto';
import { sendEmail, renderAttendanceEmail } from '../config/email.js';

const router = express.Router();

// Helpers to get Philippines time (Asia/Manila)
const getPhilippinesNow = () => {
  // Use server time as base, format with Asia/Manila
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const parts = formatter.formatToParts(new Date());
  const date = `${parts.find(p=>p.type==='year').value}-${parts.find(p=>p.type==='month').value}-${parts.find(p=>p.type==='day').value}`;
  const time = timeFormatter.format(new Date());
  return { date, time };
};

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const deviceId = req.headers['x-device-id'];
  
  // Expected API key from ESP32 connection guide
  const expectedApiKey = '765a6c3504ca79e2cdbd9197fbe9f99d';
  
  if (!apiKey || !deviceId) {
    return res.status(401).json({
      success: false,
      message: 'Missing API key or device ID'
    });
  }
  
  if (apiKey !== expectedApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
  }
  
  req.deviceId = deviceId;
  next();
};

// Apply API key validation to all routes
router.use(validateApiKey);

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    
    res.json({
      success: true,
      message: 'Fingerprint API is healthy',
      deviceId: req.deviceId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }
});

// Verify fingerprint and record attendance
router.post('/verify-id', async (req, res) => {
  const { studentId } = req.body;
  const deviceId = req.deviceId;
  const startTime = Date.now();
  
  try {
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }
    
    // Check if student exists
    const [students] = await pool.query(
      'SELECT StudentID, FullName, GradeLevel FROM studentrecord WHERE StudentID = ?',
      [studentId]
    );
    
    if (students.length === 0) {
      // Log failed attempt (StudentID is NULL since student doesn't exist)
      await pool.query(
        'INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, Timestamp, ErrorMessage, DeviceIP) VALUES (?, ?, ?, ?, NOW(), ?, ?)',
        [null, deviceId, 'verify', 'failed', 'Student not found', req.ip]
      );
      
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const student = students[0];
    const { date: today, time: currentTime } = getPhilippinesNow();
    
    // Check if attendance already recorded today (using DATE() function to compare only date part)
    const [existingAttendance] = await pool.query(
      'SELECT AttendanceID FROM attendancelog WHERE StudentID = ? AND DATE(Date) = ?',
      [studentId, today]
    );
    
    if (existingAttendance.length > 0) {
      // Update existing attendance with time out
      await pool.query(
        'UPDATE attendancelog SET TimeOut = ? WHERE StudentID = ? AND DATE(Date) = ?',
        [currentTime, studentId, today]
      );
      
      // If timing out early, mark upcoming classes as Absent for the rest of the day
      try {
        const [remainingSchedules] = await pool.query(`
          SELECT 
            ts.SubjectID,
            ts.TimeIn,
            ts.TimeOut,
            ts.GracePeriod
          FROM studentschedule ss
          JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
          WHERE ss.StudentID = ? 
            AND ts.DayOfWeek = CASE DAYNAME(?)
              WHEN 'Monday' THEN 'Mon'
              WHEN 'Tuesday' THEN 'Tue'
              WHEN 'Wednesday' THEN 'Wed'
              WHEN 'Thursday' THEN 'Thu'
              WHEN 'Friday' THEN 'Fri'
              WHEN 'Saturday' THEN 'Sat'
              WHEN 'Sunday' THEN 'Sun'
            END
            AND ts.TimeIn >= ?
        `, [studentId, today, currentTime]);

        for (const schedule of remainingSchedules) {
          try {
            const [existing] = await pool.query(
              `SELECT SubjectAttendanceID, Status FROM subjectattendance
               WHERE StudentID = ? AND SubjectID = ? AND Date = ? LIMIT 1`,
              [studentId, schedule.SubjectID, today]
            );
            if (existing.length === 0) {
              await createSubjectAttendance({
                studentId,
                subjectId: schedule.SubjectID,
                date: today,
                status: 'Absent',
                validatedBy: null
              });
            } else {
              const currentStatus = (existing[0].Status || '').toLowerCase();
              if (currentStatus !== 'excused' && currentStatus !== 'absent') {
                await pool.query(
                  `UPDATE subjectattendance SET Status = ?, ValidatedBy = ? WHERE SubjectAttendanceID = ?`,
                  ['Absent', null, existing[0].SubjectAttendanceID]
                );
              }
            }
          } catch (e) {
            console.error('Failed to mark remaining subject as absent on early TimeOut:', e);
          }
        }
      } catch (schedErr) {
        console.error('Error checking remaining schedules on TimeOut:', schedErr);
      }

      // Log successful operation
      await pool.query(
        "INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, Timestamp, DeviceIP) VALUES (?, ?, ?, ?, CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'), ?)",
        [studentId, deviceId, 'verify', 'success', req.ip]
      );
      
      // Create notifications: parent and admin about time out
      try {
        // Resolve parent user id for the student
        const [recipients] = await pool.query(
          `SELECT ua.UserID as userId
           FROM studentrecord s
           JOIN parent p ON p.ParentID = s.ParentID
           JOIN useraccount ua ON ua.UserID = p.UserID
           WHERE s.StudentID = ?
           LIMIT 1`,
          [studentId]
        );
        const parentUserId = Array.isArray(recipients) && recipients.length > 0 ? recipients[0].userId : null;
        const [studentInfoRows] = await pool.query('SELECT FullName FROM studentrecord WHERE StudentID = ? LIMIT 1', [studentId]);
        const studentName = Array.isArray(studentInfoRows) && studentInfoRows.length > 0 ? studentInfoRows[0].FullName : 'Your child';
        const parentMsg = `${studentName} time out recorded at ${currentTime}`;
        if (parentUserId) {
          await pool.query(`INSERT INTO notification (RecipientID, Message, Status) VALUES (?, ?, 'Unread')`, [parentUserId, parentMsg]);
        }
        // Also notify admins (broadcast approach: send to all admin users)
        const [admins] = await pool.query(`SELECT UserID FROM useraccount WHERE Role = 'Admin'`);
        for (const a of admins) {
          await pool.query(`INSERT INTO notification (RecipientID, Message, Status) VALUES (?, ?, 'Unread')`, [a.UserID, `[ATTENDANCE] ${parentMsg}`]);
        }
      } catch (_) {
        // best-effort
      }

      // Try to fetch parent contact and send email for Time Out
      try {
        const [rows] = await pool.query(
          `SELECT al.AttendanceID, al.StudentID, al.Date, al.TimeIn, al.TimeOut,
                  s.FullName, s.GradeLevel, sec.SectionName as Section,
                  p.ContactInfo as ParentContact,
                  ua.Username as ParentEmail
           FROM attendancelog al
           LEFT JOIN studentrecord s ON s.StudentID = al.StudentID
           LEFT JOIN section sec ON sec.SectionID = s.SectionID
           LEFT JOIN parent p ON p.ParentID = s.ParentID
           LEFT JOIN useraccount ua ON ua.UserID = p.UserID
           WHERE al.StudentID = ? AND DATE(al.Date) = ?
           ORDER BY al.AttendanceID DESC LIMIT 1`,
          [studentId, today]
        );
        const row = rows[0] || null;
        if (row) {
          const parentEmail = row.ParentEmail || row.ParentContact || null;
          if (parentEmail) {
            const { subject, html } = renderAttendanceEmail({
              studentName: row.FullName,
              date: row.Date,
              timeIn: row.TimeIn,
              timeOut: currentTime,
            });
            // Fire-and-forget; do not block API
            sendEmail({ to: parentEmail, subject, html }).catch(() => {});
          }
        }
      } catch (e) {
        // non-fatal
        console.error('Fingerprint timeout email send failed:', e?.message || e);
      }

      return res.json({
        success: true,
        message: 'Time out recorded',
        student: {
          id: student.StudentID,
          name: student.FullName,
          grade: student.GradeLevel
        },
        action: 'timeout'
      });
    } else {
      // Create new attendance record
      await pool.query(
        'INSERT INTO attendancelog (StudentID, Date, TimeIn, TimeOut, ValidatedBy) VALUES (?, ?, ?, ?, ?)',
        [studentId, today, currentTime, null, 1] // Using admin user ID 1 as validator
      );
      
      // Log successful operation
      await pool.query(
        "INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, Timestamp, DeviceIP) VALUES (?, ?, ?, ?, CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'), ?)",
        [studentId, deviceId, 'verify', 'success', req.ip]
      );
      
      // Create subject-level attendance for today's schedules (Time In event only)
      try {
        const [studentSchedules] = await pool.query(`
          SELECT 
            ts.ScheduleID,
            ts.SubjectID,
            ts.TimeIn,
            ts.TimeOut,
            ts.GracePeriod,
            ts.DayOfWeek
          FROM studentschedule ss
          JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
          WHERE ss.StudentID = ? 
            AND ts.DayOfWeek = CASE DAYNAME(?)
              WHEN 'Monday' THEN 'Mon'
              WHEN 'Tuesday' THEN 'Tue'
              WHEN 'Wednesday' THEN 'Wed'
              WHEN 'Thursday' THEN 'Thu'
              WHEN 'Friday' THEN 'Fri'
              WHEN 'Saturday' THEN 'Sat'
              WHEN 'Sunday' THEN 'Sun'
            END
        `, [studentId, today]);

        // Helper to add minutes to HH:MM
        const addMinutes = (hhmm, minutes) => {
          try {
            const [h, m] = String(hhmm).split(':').map(n => parseInt(n, 10));
            const d = new Date(0, 0, 0, h || 0, m || 0, 0, 0);
            d.setMinutes(d.getMinutes() + (Number.isFinite(minutes) ? minutes : 0));
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            return `${hh}:${mm}`;
          } catch {
            return hhmm;
          }
        };

        for (const schedule of studentSchedules) {
          try {
            const scheduledIn = String(schedule.TimeIn).slice(0,5);
            const scheduledOut = String(schedule.TimeOut).slice(0,5);
            const grace = Number(schedule.GracePeriod) || 15;
            const latestOnTime = addMinutes(scheduledIn, grace);

            let finalStatus = 'Present';
            if (currentTime > latestOnTime && currentTime <= scheduledOut) {
              finalStatus = 'Late';
            }

            await createSubjectAttendance({
              studentId,
              subjectId: schedule.SubjectID,
              date: today,
              status: finalStatus,
              validatedBy: null,
              timeIn: currentTime
            });
          } catch (subjectErr) {
            console.error('Subject attendance creation error:', subjectErr);
          }
        }
      } catch (schedErr) {
        console.error('Schedule lookup for subject attendance failed:', schedErr);
      }

      // Create notifications: parent and admin about time in
      try {
        const [recipients] = await pool.query(
          `SELECT ua.UserID as userId
           FROM studentrecord s
           JOIN parent p ON p.ParentID = s.ParentID
           JOIN useraccount ua ON ua.UserID = p.UserID
           WHERE s.StudentID = ?
           LIMIT 1`,
          [studentId]
        );
        const parentUserId = Array.isArray(recipients) && recipients.length > 0 ? recipients[0].userId : null;
        const [studentInfoRows] = await pool.query('SELECT FullName FROM studentrecord WHERE StudentID = ? LIMIT 1', [studentId]);
        const studentName = Array.isArray(studentInfoRows) && studentInfoRows.length > 0 ? studentInfoRows[0].FullName : 'Your child';
        const parentMsg = `${studentName} time in recorded at ${currentTime}`;
        if (parentUserId) {
          await pool.query(`INSERT INTO notification (RecipientID, Message, Status) VALUES (?, ?, 'Unread')`, [parentUserId, parentMsg]);
        }
        const [admins] = await pool.query(`SELECT UserID FROM useraccount WHERE Role = 'Admin'`);
        for (const a of admins) {
          await pool.query(`INSERT INTO notification (RecipientID, Message, Status) VALUES (?, ?, 'Unread')`, [a.UserID, `[ATTENDANCE] ${parentMsg}`]);
        }
      } catch (_) {
        // best-effort
      }

      // Try to fetch parent contact and send email for Time In
      try {
        const [rows] = await pool.query(
          `SELECT al.AttendanceID, al.StudentID, al.Date, al.TimeIn, al.TimeOut,
                  s.FullName, s.GradeLevel, sec.SectionName as Section,
                  p.ContactInfo as ParentContact,
                  ua.Username as ParentEmail
           FROM attendancelog al
           LEFT JOIN studentrecord s ON s.StudentID = al.StudentID
           LEFT JOIN section sec ON sec.SectionID = s.SectionID
           LEFT JOIN parent p ON p.ParentID = s.ParentID
           LEFT JOIN useraccount ua ON ua.UserID = p.UserID
           WHERE al.StudentID = ? AND DATE(al.Date) = ?
           ORDER BY al.AttendanceID DESC LIMIT 1`,
          [studentId, today]
        );
        const row = rows[0] || null;
        if (row) {
          const parentEmail = row.ParentEmail || row.ParentContact || null;
          if (parentEmail) {
            const { subject, html } = renderAttendanceEmail({
              studentName: row.FullName,
              date: row.Date,
              timeIn: currentTime,
              timeOut: null,
            });
            // Fire-and-forget; do not block API
            sendEmail({ to: parentEmail, subject, html }).catch(() => {});
          }
        }
      } catch (e) {
        // non-fatal
        console.error('Fingerprint timein email send failed:', e?.message || e);
      }

      return res.json({
        success: true,
        message: 'Time in recorded',
        student: {
          id: student.StudentID,
          name: student.FullName,
          grade: student.GradeLevel
        },
        action: 'timein'
      });
    }
    
  } catch (error) {
    console.error('Fingerprint verification error:', error);
    
    // Log error (StudentID is NULL if student doesn't exist)
    await pool.query(
      "INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, Timestamp, ErrorMessage, DeviceIP) VALUES (?, ?, ?, ?, CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'), ?, ?)",
      [null, deviceId, 'verify', 'error', error.message, req.ip]
    );
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Enroll new fingerprint
router.post('/enroll', async (req, res) => {
  const { studentId, templateData } = req.body;
  const deviceId = req.deviceId;
  const startTime = Date.now();
  
  try {
    if (!studentId || !templateData) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and template data are required'
      });
    }
    
    // Check if student exists
    const [students] = await pool.query(
      'SELECT StudentID, FullName FROM studentrecord WHERE StudentID = ?',
      [studentId]
    );
    
    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Convert template data to buffer
    const templateBuffer = Buffer.from(templateData, 'base64');
    
    // Update student record with fingerprint template
    await pool.query(
      'UPDATE studentrecord SET FingerprintTemplate = ? WHERE StudentID = ?',
      [templateBuffer, studentId]
    );
    
    // Log successful enrollment
    await pool.query(
      "INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, Timestamp, DeviceIP) VALUES (?, ?, ?, ?, CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'), ?)",
      [studentId, deviceId, 'enroll', 'success', req.ip]
    );
    
    res.json({
      success: true,
      message: 'Fingerprint enrolled successfully',
      student: {
        id: students[0].StudentID,
        name: students[0].FullName
      }
    });
    
  } catch (error) {
    console.error('Fingerprint enrollment error:', error);
    
    // Log error (StudentID is NULL if student doesn't exist)
    await pool.query(
      "INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, Timestamp, ErrorMessage, DeviceIP) VALUES (?, ?, ?, ?, CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'), ?, ?)",
      [null, deviceId, 'enroll', 'error', error.message, req.ip]
    );
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete fingerprint
router.delete('/delete/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const deviceId = req.deviceId;
  const startTime = Date.now();
  
  try {
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }
    
    // Check if student exists
    const [students] = await pool.query(
      'SELECT StudentID, FullName FROM studentrecord WHERE StudentID = ?',
      [studentId]
    );
    
    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Clear fingerprint template
    await pool.query(
      'UPDATE studentrecord SET FingerprintTemplate = NULL WHERE StudentID = ?',
      [studentId]
    );
    
    // Log successful deletion
    await pool.query(
      "INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, Timestamp, DeviceIP) VALUES (?, ?, ?, ?, CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'), ?)",
      [studentId, deviceId, 'delete', 'success', req.ip]
    );
    
    res.json({
      success: true,
      message: 'Fingerprint deleted successfully',
      student: {
        id: students[0].StudentID,
        name: students[0].FullName
      }
    });
    
  } catch (error) {
    console.error('Fingerprint deletion error:', error);
    
    // Log error (StudentID is NULL if student doesn't exist)
    await pool.query(
      "INSERT INTO fingerprint_log (StudentID, ESP32DeviceID, Action, Status, Timestamp, ErrorMessage, DeviceIP) VALUES (?, ?, ?, ?, CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'), ?, ?)",
      [null, deviceId, 'delete', 'error', error.message, req.ip]
    );
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;