import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
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
    console.log('✅ Database connected successfully');
    connection.release();

    // Ensure OTP storage table exists
    await ensureOtpStorage();

    // Initialize with default users if table is empty
    await initializeDefaultUsers();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

const ensureOtpStorage = async () => {
  try {
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS userotp (
        UserID INT NOT NULL,
        OtpCode VARCHAR(10) NOT NULL,
        OtpExpiresAt DATETIME NOT NULL,
        PRIMARY KEY (UserID),
        CONSTRAINT fk_userotp_user FOREIGN KEY (UserID) REFERENCES useraccount(UserID) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`
    );
  } catch (error) {
    console.error('❌ Error ensuring OTP storage table:', error.message);
    throw error;
  }
};

// Initialize default users
const initializeDefaultUsers = async () => {
  try {
    // Check if useraccount table has any users
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM useraccount');
    const userCount = rows[0].count;

    if (userCount === 0) {
      const defaultUsers = [
        {
          username: 'admin@foothills.edu',
          passwordHash: await bcrypt.hash('admin123', 10),
          role: 'Admin'
        },
        {
          username: 'sarah.johnson@foothills.edu',
          passwordHash: await bcrypt.hash('teacher123', 10),
          role: 'Teacher'
        },
        {
          username: 'michael.chen@foothills.edu',
          passwordHash: await bcrypt.hash('teacher123', 10),
          role: 'Teacher'
        },
        {
          username: 'emily.davis@foothills.edu',
          passwordHash: await bcrypt.hash('teacher123', 10),
          role: 'Teacher'
        },
        {
          username: 'sarah.johnson@email.com',
          passwordHash: await bcrypt.hash('parent123', 10),
          role: 'Parent'
        }
      ];

      for (const user of defaultUsers) {
        await pool.execute(
          'INSERT INTO useraccount (Username, PasswordHash, Role) VALUES (?, ?, ?)',
          [user.username, user.passwordHash, user.role]
        );
      }
    }
  } catch (error) {
    console.error('❌ Error initializing default users:', error.message);
  }
};

// Database operations
export const findUserByEmail = async (email) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM useraccount WHERE Username = ?',
      [email]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

export const findUserById = async (id) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM useraccount WHERE UserID = ?',
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const { username, passwordHash, role } = userData;
    const [result] = await pool.execute(
      'INSERT INTO useraccount (Username, PasswordHash, Role) VALUES (?, ?, ?)',
      [username, passwordHash, role]
    );
    
    const newUser = await findUserById(result.insertId);
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const updateFields = [];
    const updateValues = [];
    
    if (updates.username) {
      updateFields.push('Username = ?');
      updateValues.push(updates.username);
    }
    if (updates.passwordHash) {
      updateFields.push('PasswordHash = ?');
      updateValues.push(updates.passwordHash);
    }
    if (updates.role) {
      updateFields.push('Role = ?');
      updateValues.push(updates.role);
    }
    
    if (updateFields.length === 0) {
      return await findUserById(id);
    }
    
    updateValues.push(id);
    const [result] = await pool.execute(
      `UPDATE useraccount SET ${updateFields.join(', ')} WHERE UserID = ?`,
      updateValues
    );
    
    if (result.affectedRows > 0) {
      return await findUserById(id);
    }
    return null;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM useraccount WHERE UserID = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const [rows] = await pool.execute('SELECT * FROM useraccount ORDER BY UserID');
    return rows;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Admin utilities
export const updateUserStatus = async (id, status) => {
  try {
    const [result] = await pool.execute(
      'UPDATE useraccount SET Status = ? WHERE UserID = ?',
      [status, id]
    );
    if (result.affectedRows > 0) {
      return await findUserById(id);
    }
    return null;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

export const getAuditTrail = async ({ limit = 50, offset = 0 } = {}) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM audittrail ORDER BY ActionDateTime DESC LIMIT ? OFFSET ?',
      [Number(limit), Number(offset)]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    throw error;
  }
};

export const createAuditTrail = async ({ userId, action, tableAffected = null, recordId = null }) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO audittrail (UserID, Action, TableAffected, RecordID) VALUES (?, ?, ?, ?)',
      [userId, action, tableAffected, recordId]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating audit trail entry:', error);
    // do not throw to avoid blocking core ops; rethrow so caller can decide
    throw error;
  }
};


export const getAttendanceReports = async ({ limit = 50, offset = 0 } = {}) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM attendancereport ORDER BY GeneratedDate DESC LIMIT ? OFFSET ?',
      [Number(limit), Number(offset)]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching attendance reports:', error);
    throw error;
  }
};

export const createAttendanceReport = async ({ generatedBy, studentId = null, scheduleId = null, dateRangeStart, dateRangeEnd, reportType, reportFile = null }) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO attendancereport (GeneratedBy, StudentID, ScheduleID, DateRangeStart, DateRangeEnd, ReportType, ReportFile) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [generatedBy, studentId, scheduleId, dateRangeStart, dateRangeEnd, reportType, reportFile]
    );
    const [rows] = await pool.execute('SELECT * FROM attendancereport WHERE ReportID = ?', [result.insertId]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error creating attendance report:', error);
    throw error;
  }
};

export const getAttendanceLog = async ({ limit = 50, offset = 0, date = null } = {}) => {
  try {
    let sql = `SELECT al.AttendanceID, al.StudentID, al.Date, al.TimeIn, al.TimeOut,
                      s.FullName, s.GradeLevel, sec.SectionName as Section
               FROM attendancelog al
               LEFT JOIN studentrecord s ON s.StudentID = al.StudentID
               LEFT JOIN section sec ON sec.SectionID = s.SectionID`;
    const params = [];
    if (date) {
      sql += ' WHERE al.Date = ?';
      params.push(date);
    }
    const limitInt = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : 50;
    const offsetInt = Number.isFinite(Number(offset)) ? Math.max(0, Number(offset)) : 0;
    sql += ` ORDER BY al.Date DESC, COALESCE(al.TimeIn, al.TimeOut) DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Error fetching attendance log:', error);
    throw error;
  }
};

// Get student subjects (now through studentschedule)
export const getStudentSubjects = async (studentId) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
         ss.StudentScheduleID, 
         ss.StudentID, 
         ts.SubjectID, 
         ts.TeacherID,
         s.SubjectName, 
         s.Description,
         ts.ScheduleID,
         ts.TimeIn,
         ts.TimeOut,
         ts.DayOfWeek
       FROM studentschedule ss
       JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
       LEFT JOIN subject s ON s.SubjectID = ts.SubjectID
       WHERE ss.StudentID = ?`,
      [studentId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching student subjects:', error);
    throw error;
  }
};

// Create subject attendance entry
export const createSubjectAttendance = async ({ studentId, subjectId, date, status = 'Present', validatedBy = null, timeIn = null }) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO subjectattendance (StudentID, SubjectID, Date, Status, ValidatedBy, CreatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [studentId, subjectId, date, status, validatedBy, timeIn ? `${date} ${timeIn}` : null]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating subject attendance:', error);
    throw error;
  }
};

// Get subject attendance for a student
export const getSubjectAttendance = async (studentId, date = null) => {
  try {
    let sql = `SELECT sa.SubjectAttendanceID, sa.StudentID, sa.SubjectID, sa.Date, sa.Status, sa.ValidatedBy, sa.CreatedAt,
                      s.SubjectName, s.Description
               FROM subjectattendance sa
               LEFT JOIN subject s ON s.SubjectID = sa.SubjectID
               WHERE sa.StudentID = ?`;
    const params = [studentId];
    
    if (date) {
      sql += ' AND sa.Date = ?';
      params.push(date);
    }
    
    sql += ' ORDER BY sa.Date DESC, sa.CreatedAt DESC';
    
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Error fetching subject attendance:', error);
    throw error;
  }
};

// Helper function to determine attendance status based on time and schedule
const calculateAttendanceStatus = (arrivalTime, scheduleTimeIn, scheduleTimeOut, gracePeriodMinutes) => {
  if (!arrivalTime || !scheduleTimeIn || !scheduleTimeOut) {
    return 'Present'; // Default to Present if no time data
  }

  const arrival = new Date(`2000-01-01 ${arrivalTime}`);
  const timeIn = new Date(`2000-01-01 ${scheduleTimeIn}`);
  const timeOut = new Date(`2000-01-01 ${scheduleTimeOut}`);
  const gracePeriod = gracePeriodMinutes || 15; // Default 15 minutes if not specified

  // Calculate the latest acceptable time (end time + grace period)
  const latestAcceptable = new Date(timeOut.getTime() + (gracePeriod * 60000));

  // If arrival is after the class has completely ended (including grace period), mark as Absent
  if (arrival > latestAcceptable) {
    return 'Absent';
  }
  // If arrival is after class start but before class end + grace period, mark as Late
  else if (arrival > timeIn) {
    return 'Late';
  }
  // If arrival is before or at class start, mark as Present
  else {
    return 'Present';
  }
};

// Attendance - manual create entry
export const createManualAttendance = async ({ studentId, date = null, timeIn = null, timeOut = null, status = 'Present', validatedBy = null }) => {
  try {
    // Normalize values
    const finalDate = date || new Date().toISOString().slice(0, 10);

    // Create attendance log entry (without status)
    const [result] = await pool.execute(
      'INSERT INTO attendancelog (StudentID, Date, TimeIn, TimeOut, ValidatedBy) VALUES (?, ?, ?, ?, ?)',
      [studentId, finalDate, timeIn, timeOut, validatedBy]
    );

    // Get all schedules for this student
    const [studentSchedules] = await pool.execute(`
      SELECT 
        ts.ScheduleID,
        ts.SubjectID, 
        s.SubjectName, 
        ts.TimeIn, 
        ts.TimeOut, 
        ts.GracePeriod,
        ts.DayOfWeek
      FROM studentschedule ss
      JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
      JOIN subject s ON s.SubjectID = ts.SubjectID
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
    `, [studentId, finalDate]);
    
    console.log(`Found ${studentSchedules.length} schedules for student ${studentId}`);
    
    // Create subject attendance with proper status calculation
    for (const schedule of studentSchedules) {
      try {
        let finalStatus;
        
        if (status === 'Present') {
          // Use automatic calculation based on arrival time and schedule
          finalStatus = calculateAttendanceStatus(
            timeIn, 
            schedule.TimeIn, 
            schedule.TimeOut, 
            schedule.GracePeriod
          );
        } else if (status === 'Excused') {
          // Use the provided status (Excused)
          finalStatus = 'Excused';
        } else {
          // Default to Present for any other status
          finalStatus = 'Present';
        }
        
        console.log(`Creating subject attendance for subject ${schedule.SubjectID} with status ${finalStatus}`);
        
        await createSubjectAttendance({
          studentId,
          subjectId: schedule.SubjectID,
          date: finalDate,
          status: finalStatus,
          validatedBy,
          timeIn
        });
        
        console.log(`Successfully created subject attendance for subject ${schedule.SubjectID}`);
      } catch (subjectError) {
        console.error(`Error creating subject attendance for subject ${schedule.SubjectID}:`, subjectError);
        // Continue with other subjects even if one fails
      }
    }

    const [rows] = await pool.execute(
      `SELECT al.AttendanceID, al.StudentID, al.Date, al.TimeIn, al.TimeOut,
              s.FullName, s.GradeLevel, sec.SectionName as Section
       FROM attendancelog al
       LEFT JOIN studentrecord s ON s.StudentID = al.StudentID
       LEFT JOIN section sec ON sec.SectionID = s.SectionID
       WHERE al.AttendanceID = ?`,
      [result.insertId]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error creating manual attendance:', error);
    throw error;
  }
};

// Section functions
export const getSections = async (gradeLevel = null, isActive = true) => {
  try {
    let sql = `
      SELECT s.SectionID, s.SectionName, s.GradeLevel, s.Description, s.Capacity, s.IsActive, s.CreatedAt, s.UpdatedAt
      FROM section s
      WHERE 1=1
    `;
    const params = [];
    
    if (gradeLevel) {
      sql += ' AND s.GradeLevel = ?';
      params.push(gradeLevel);
    }
    if (isActive !== null) {
      sql += ' AND s.IsActive = ?';
      params.push(isActive);
    }
    
    sql += ' ORDER BY s.GradeLevel, s.SectionName';
    
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Error fetching sections:', error);
    throw error;
  }
};

export const createSection = async ({ sectionName, gradeLevel, description = null, capacity = null, isActive = true }) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO section (SectionName, GradeLevel, Description, Capacity, IsActive) VALUES (?, ?, ?, ?, ?)',
      [sectionName, gradeLevel, description, capacity, isActive]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating section:', error);
    throw error;
  }
};

export const updateSection = async (sectionId, { sectionName, gradeLevel, description, capacity, isActive }) => {
  try {
    const [result] = await pool.execute(
      'UPDATE section SET SectionName = ?, GradeLevel = ?, Description = ?, Capacity = ?, IsActive = ? WHERE SectionID = ?',
      [sectionName, gradeLevel, description, capacity, isActive, sectionId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating section:', error);
    throw error;
  }
};

export const deleteSection = async (sectionId) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM section WHERE SectionID = ?',
      [sectionId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting section:', error);
    throw error;
  }
};

export const getSectionById = async (sectionId) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM section WHERE SectionID = ?',
      [sectionId]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching section by ID:', error);
    throw error;
  }
};

// Note: Section schedule functions have been removed. All scheduling now uses the teacherschedule table.

// Recalculate attendance status for existing records
export const recalculateAttendanceStatus = async (studentId, date) => {
  try {
    // Get the attendance log entry to get the arrival time
    const [attendanceLog] = await pool.execute(
      'SELECT TimeIn FROM attendancelog WHERE StudentID = ? AND Date = ?',
      [studentId, date]
    );
    
    if (attendanceLog.length === 0) {
      throw new Error('No attendance log found for this student and date');
    }
    
    const arrivalTime = attendanceLog[0].TimeIn;
    
    // Get all subject attendance records for this student and date
    const [subjectRecords] = await pool.execute(`
      SELECT sa.SubjectAttendanceID, sa.SubjectID, ts.TimeIn, ts.TimeOut, ts.GracePeriod
      FROM subjectattendance sa
      LEFT JOIN teacherschedule ts ON ts.SubjectID = sa.SubjectID 
        AND ts.SectionID = (SELECT SectionID FROM studentrecord WHERE StudentID = ?)
        AND ts.DayOfWeek = DAYNAME(?)
      WHERE sa.StudentID = ? AND sa.Date = ?
    `, [studentId, date, studentId, date]);
    
    // Update each subject attendance record with correct status
    for (const record of subjectRecords) {
      const status = calculateAttendanceStatus(
        arrivalTime,
        record.TimeIn,
        record.TimeOut,
        record.GracePeriod
      );
      
      await pool.execute(
        'UPDATE subjectattendance SET Status = ? WHERE SubjectAttendanceID = ?',
        [status, record.SubjectAttendanceID]
      );
    }
    
    return { success: true, message: 'Attendance status recalculated successfully' };
  } catch (error) {
    console.error('Error recalculating attendance status:', error);
    throw error;
  }
};

// Parents
export const searchParents = async (q) => {
  try {
    const like = `%${q}%`;
    const [rows] = await pool.execute(
      'SELECT ParentID, FullName, ContactInfo, UserID FROM parent WHERE FullName LIKE ? OR ContactInfo LIKE ? ORDER BY FullName LIMIT 20',
      [like, like]
    );
    return rows;
  } catch (error) {
    console.error('Error searching parents:', error);
    throw error;
  }
};

export const createParentProfile = async ({ fullName, contactInfo = null, relationship = 'Guardian', userId }) => {
  try {
    const [res] = await pool.execute(
      'INSERT INTO parent (FullName, ContactInfo, Relationship, UserID) VALUES (?, ?, ?, ?)',
      [fullName, contactInfo, relationship, userId]
    );
    const [rows] = await pool.execute('SELECT ParentID, FullName, ContactInfo, Relationship, UserID FROM parent WHERE ParentID = ?', [res.insertId]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error creating parent profile:', error);
    throw error;
  }
};

export const createParentUserAndProfile = async ({ fullName, contactInfo = null, email, password }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Create or find useraccount by Username
    const [exist] = await connection.execute('SELECT UserID FROM useraccount WHERE Username = ? LIMIT 1', [email]);
    let userId;
    if (exist.length > 0) {
      userId = exist[0].UserID;
    } else {
      const hash = await bcrypt.hash(password, 10);
      const [u] = await connection.execute(
        'INSERT INTO useraccount (Username, PasswordHash, Role) VALUES (?, ?, ?)',
        [email, hash, 'Parent']
      );
      userId = u.insertId;
    }

    // Create parent profile
    const [p] = await connection.execute(
      'INSERT INTO parent (FullName, ContactInfo, UserID) VALUES (?, ?, ?)',
      [fullName, contactInfo, userId]
    );

    await connection.commit();
    return { parentId: p.insertId, userId };
  } catch (error) {
    await connection.rollback();
    console.error('Error creating parent user/profile:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// OTP management functions for registration
export const storeOtp = async (email, otp, expiry, type, data = null) => {
  try {
    // Clear any existing OTP for this email and type
    await pool.execute(
      'DELETE FROM registration_otp WHERE email = ? AND type = ?',
      [email, type]
    );
    
    // Insert new OTP
    const [result] = await pool.execute(
      'INSERT INTO registration_otp (email, otp, expiry_date, type, data) VALUES (?, ?, ?, ?, ?)',
      [email, otp, expiry, type, data ? JSON.stringify(data) : null]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error storing OTP:', error);
    throw error;
  }
};

export const verifyOtp = async (email, otp, type) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM registration_otp WHERE email = ? AND otp = ? AND type = ? AND expiry_date > NOW()',
      [email, otp, type]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    const otpRecord = rows[0];
    const data = otpRecord.data ? JSON.parse(otpRecord.data) : null;
    
    return {
      ...otpRecord,
      data
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

export const clearOtp = async (email, type) => {
  try {
    await pool.execute(
      'DELETE FROM registration_otp WHERE email = ? AND type = ?',
      [email, type]
    );
  } catch (error) {
    console.error('Error clearing OTP:', error);
    throw error;
  }
};

// Enrollment documents management
export const storeEnrollmentDocuments = async (studentId, enrollmentData) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO enrollment_documents (StudentID, SubmittedByUserID, Documents, AdditionalInfo, CreatedAt) VALUES (?, ?, ?, ?, ?)',
      [studentId, enrollmentData.submittedByUserId, JSON.stringify(enrollmentData.documents), enrollmentData.additionalInfo, new Date()]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error storing enrollment documents:', error);
    throw error;
  }
};

export const linkStudentToParent = async (studentId, parentId) => {
  try {
    await pool.execute(
      'UPDATE studentrecord SET ParentID = ? WHERE StudentID = ?',
      [parentId, studentId]
    );
    return true;
  } catch (error) {
    console.error('Error linking student to parent:', error);
    throw error;
  }
};

// Student management
export const getStudents = async () => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.StudentID, s.FullName, s.GradeLevel, s.SectionID, s.ParentID, s.Status,
              IF(s.FingerprintTemplate IS NOT NULL AND OCTET_LENGTH(s.FingerprintTemplate) > 0, 1, 0) AS HasFingerprint,
              p.ContactInfo as ParentContact, p.FullName as ParentName,
              sec.SectionName as SectionName, sec.Description as SectionDescription, sec.Capacity as SectionCapacity
       FROM studentrecord s
       LEFT JOIN parent p ON p.ParentID = s.ParentID
       LEFT JOIN section sec ON sec.SectionID = s.SectionID
       WHERE s.EnrollmentStatus = 'approved'
       ORDER BY s.StudentID`
    );
    return rows;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

export const createStudent = async ({ fullName, dateOfBirth, gender, placeOfBirth, nationality, address, gradeLevel = null, sectionId = null, parentId = null, createdBy }) => {
  try {
    // Discover columns
    const dbName = process.env.DB_NAME || 'attendance';
    const [cols] = await pool.execute(
      'SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME IN ("FingerprintTemplate","CreatedBy","ParentID","ParentContact")',
      [dbName, 'studentrecord']
    );
    const hasFingerprint = cols.some(c => c.COLUMN_NAME === 'FingerprintTemplate');
    const fingerprintNotNull = cols.find(c => c.COLUMN_NAME === 'FingerprintTemplate')?.IS_NULLABLE === 'NO';
    const hasCreatedBy = cols.some(c => c.COLUMN_NAME === 'CreatedBy');
    const hasParentId = cols.some(c => c.COLUMN_NAME === 'ParentID');

    const columns = ['FullName', 'DateOfBirth', 'Gender', 'PlaceOfBirth', 'Nationality', 'Address', 'GradeLevel', 'SectionID', 'Status'];
    const values = [fullName, dateOfBirth, gender, placeOfBirth, nationality, address, gradeLevel, sectionId, 'Pending'];

    if (hasFingerprint) {
      // Supply empty buffer when not nullable
      const emptyTemplate = Buffer.from('');
      columns.push('FingerprintTemplate');
      values.push(fingerprintNotNull ? emptyTemplate : null);
    }

    if (hasParentId) {
      columns.push('ParentID');
      values.push(parentId);
    }

    if (hasCreatedBy) {
      columns.push('CreatedBy');
      values.push(createdBy || null);
    }

    const placeholders = columns.map(() => '?').join(', ');
    const [result] = await pool.execute(
      `INSERT INTO studentrecord (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    const [rows] = await pool.execute(
      `SELECT s.StudentID, s.FullName, s.GradeLevel, s.SectionID, s.ParentID,
              p.ContactInfo as ParentContact, p.FullName as ParentName,
              sec.SectionName as SectionName
       FROM studentrecord s
       LEFT JOIN parent p ON p.ParentID = s.ParentID
       LEFT JOIN section sec ON sec.SectionID = s.SectionID
       WHERE s.StudentID = ?`,
      [result.insertId]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

export const updateStudent = async (studentId, updates) => {
  try {
    const fields = [];
    const values = [];
    if (updates.fullName !== undefined) { fields.push('FullName = ?'); values.push(updates.fullName); }
    if (updates.gradeLevel !== undefined) { fields.push('GradeLevel = ?'); values.push(updates.gradeLevel); }
    if (updates.sectionId !== undefined) { fields.push('SectionID = ?'); values.push(updates.sectionId); }
    if (updates.parentId !== undefined) { fields.push('ParentID = ?'); values.push(updates.parentId); }
    if (fields.length === 0) {
      const [rows] = await pool.execute('SELECT * FROM studentrecord WHERE StudentID = ?', [studentId]);
      return rows[0] || null;
    }
    values.push(studentId);
    const [result] = await pool.execute(
      `UPDATE studentrecord SET ${fields.join(', ')} WHERE StudentID = ?`,
      values
    );
    if (result.affectedRows > 0) {
      const [rows] = await pool.execute(
        `SELECT s.StudentID, s.FullName, s.GradeLevel, s.SectionID, s.ParentID,
                p.ContactInfo as ParentContact,
                sec.SectionName as SectionName
         FROM studentrecord s
         LEFT JOIN parent p ON p.ParentID = s.ParentID
         LEFT JOIN section sec ON sec.SectionID = s.SectionID
         WHERE s.StudentID = ?`,
        [studentId]
      );
      return rows[0] || null;
    }
    return null;
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

export const deleteStudent = async (studentId) => {
  try {
    const [result] = await pool.execute('DELETE FROM studentrecord WHERE StudentID = ?', [studentId]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

export const updateParentContactByStudentId = async (studentId, contactInfo) => {
  try {
    const [result] = await pool.execute(
      'UPDATE parent p JOIN studentrecord s ON s.ParentID = p.ParentID SET p.ContactInfo = ? WHERE s.StudentID = ? AND s.ParentID IS NOT NULL',
      [contactInfo, studentId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating parent contact by student:', error);
    throw error;
  }
};

export const updateParentContactByParentId = async (parentId, contactInfo) => {
  try {
    const [result] = await pool.execute(
      'UPDATE parent SET ContactInfo = ? WHERE ParentID = ?',
      [contactInfo, parentId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating parent contact:', error);
    throw error;
  }
};

export const setUserOtp = async (userId, otp, expiresAt) => {
  try {
    await pool.execute(
      'REPLACE INTO userotp (UserID, OtpCode, OtpExpiresAt) VALUES (?, ?, ?)',
      [userId, String(otp), expiresAt]
    );
    return true;
  } catch (error) {
    console.error('Error setting user OTP:', error);
    throw error;
  }
};

export const consumeUserOtp = async (userId, otp) => {
  try {
    const [rows] = await pool.execute(
      'SELECT OtpCode, OtpExpiresAt FROM userotp WHERE UserID = ? LIMIT 1',
      [userId]
    );
    const row = rows[0];
    if (!row) return { valid: false };
    const now = new Date();
    const expires = row.OtpExpiresAt ? new Date(row.OtpExpiresAt) : null;
    const matches = String(row.OtpCode) === String(otp);
    const notExpired = !!expires && expires.getTime() > now.getTime();
    if (matches && notExpired) {
      await pool.execute('DELETE FROM userotp WHERE UserID = ?', [userId]);
      return { valid: true };
    }
    return { valid: false };
  } catch (error) {
    console.error('Error consuming user OTP:', error);
    throw error;
  }
};

// Role-specific record creation functions
export const createTeacherRecord = async ({ fullName, contactInfo = null, userId, hireDate = null }) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO teacherrecord (FullName, ContactInfo, UserID, HireDate) VALUES (?, ?, ?, ?)',
      [fullName, contactInfo, userId, hireDate]
    );
    return { teacherId: result.insertId };
  } catch (error) {
    console.error('Error creating teacher record:', error);
    throw error;
  }
};

export const createAdminRecord = async ({ fullName, contactInfo = null, userId, hireDate = null }) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO adminrecord (FullName, ContactInfo, UserID, HireDate) VALUES (?, ?, ?, ?)',
      [fullName, contactInfo, userId, hireDate]
    );
    return { adminId: result.insertId };
  } catch (error) {
    console.error('Error creating admin record:', error);
    throw error;
  }
};

export const createRegistrarRecord = async ({ fullName, contactInfo = null, userId, hireDate = null }) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO registrarrecord (FullName, ContactInfo, UserID, HireDate) VALUES (?, ?, ?, ?)',
      [fullName, contactInfo, userId, hireDate]
    );
    return { registrarId: result.insertId };
  } catch (error) {
    console.error('Error creating registrar record:', error);
    throw error;
  }
};

// Student status management
export const setStudentStatus = async (studentId, status) => {
  try {
    const [result] = await pool.execute(
      'UPDATE studentrecord SET Status = ? WHERE StudentID = ?',
      [status, studentId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating student status:', error);
    throw error;
  }
};


// Initialize database on startup
initializeDatabase();

// Export the pool for other modules that might need it
export { pool }; 