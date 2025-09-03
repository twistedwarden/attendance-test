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

    // Initialize with default users if table is empty
    await initializeDefaultUsers();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
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
      console.log('📝 Initializing default users...');
      
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

      console.log('✅ Default users initialized successfully');
    } else {
      console.log(`📊 Found ${userCount} existing users in database`);
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

export const getRegistrations = async ({ status = 'Pending' } = {}) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM registration WHERE Status = ? ORDER BY RegistrationID DESC',
      [status]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching registrations:', error);
    throw error;
  }
};

export const reviewRegistration = async ({ registrationId, reviewerUserId, decision }) => {
  // decision: 'Approved' | 'Denied'
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      'SELECT * FROM registration WHERE RegistrationID = ? FOR UPDATE',
      [registrationId]
    );
    const registration = rows[0];
    if (!registration) {
      await connection.rollback();
      return { updated: false, createdUserId: null };
    }

    // Update registration status
    await connection.execute(
      'UPDATE registration SET Status = ?, ReviewedBy = ?, ReviewedDate = NOW() WHERE RegistrationID = ?',
      [decision, reviewerUserId, registrationId]
    );

    let createdUserId = null;
    if (decision === 'Approved') {
      // Create corresponding useraccount with Active status (idempotent by Username)
      const role = registration.UserType; // 'Parent' or 'Teacher'
      try {
        // Check if user already exists
        const [existingUsers] = await connection.execute(
          'SELECT UserID FROM useraccount WHERE Username = ? LIMIT 1',
          [registration.Username]
        );
        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
          createdUserId = existingUsers[0].UserID;
        } else {
          const [insertResult] = await connection.execute(
            'INSERT INTO useraccount (Username, PasswordHash, Role, Status) VALUES (?, ?, ?, ?)',
            [registration.Username, registration.PasswordHash, role, 'Active']
          );
          createdUserId = insertResult.insertId;
        }
      } catch (e) {
        console.error('Non-blocking user creation error during registration approval:', e?.message || e);
        // Do not fail the approval if user creation fails; leave createdUserId as null
      }
    }

    await connection.commit();
    return { updated: true, createdUserId };
  } catch (error) {
    await connection.rollback();
    console.error('Error reviewing registration:', error);
    throw error;
  } finally {
    connection.release();
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
    let sql = `SELECT al.AttendanceID, al.StudentID, al.Date, al.TimeIn, al.TimeOut, al.Status,
                      s.FullName, s.GradeLevel, s.Section
               FROM attendancelog al
               LEFT JOIN studentrecord s ON s.StudentID = al.StudentID`;
    const params = [];
    if (date) {
      sql += ' WHERE al.Date = ?';
      params.push(date);
    }
    sql += ' ORDER BY al.Date DESC, COALESCE(al.TimeIn, al.TimeOut) DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Error fetching attendance log:', error);
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

export const createParentProfile = async ({ fullName, contactInfo = null, userId }) => {
  try {
    const [res] = await pool.execute(
      'INSERT INTO parent (FullName, ContactInfo, UserID) VALUES (?, ?, ?)',
      [fullName, contactInfo, userId]
    );
    const [rows] = await pool.execute('SELECT ParentID, FullName, ContactInfo, UserID FROM parent WHERE ParentID = ?', [res.insertId]);
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

// Student management
export const getStudents = async () => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.StudentID, s.FullName, s.GradeLevel, s.Section, s.ParentID,
              IF(s.FingerprintTemplate IS NOT NULL AND OCTET_LENGTH(s.FingerprintTemplate) > 0, 1, 0) AS HasFingerprint,
              p.ContactInfo as ParentContact, p.FullName as ParentName
       FROM studentrecord s
       LEFT JOIN parent p ON p.ParentID = s.ParentID
       ORDER BY s.StudentID`
    );
    return rows;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

export const createStudent = async ({ fullName, gradeLevel = null, section = null, parentId = null, createdBy }) => {
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

    const columns = ['FullName', 'GradeLevel', 'Section'];
    const values = [fullName, gradeLevel, section];

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
      `SELECT s.StudentID, s.FullName, s.GradeLevel, s.Section, s.ParentID,
              p.ContactInfo as ParentContact, p.FullName as ParentName
       FROM studentrecord s
       LEFT JOIN parent p ON p.ParentID = s.ParentID
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
    if (updates.section !== undefined) { fields.push('Section = ?'); values.push(updates.section); }
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
        `SELECT s.StudentID, s.FullName, s.GradeLevel, s.Section, s.ParentID,
                p.ContactInfo as ParentContact
         FROM studentrecord s
         LEFT JOIN parent p ON p.ParentID = s.ParentID
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

// Initialize database on startup
initializeDatabase();

// Export the pool for other modules that might need it
export { pool }; 