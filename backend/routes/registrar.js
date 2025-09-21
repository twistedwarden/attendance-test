import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ===== FILE UPLOAD CONFIGURATION =====

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'enrollment-documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only document files (PDF, DOC, DOCX, images) are allowed'));
    }
  }
});

// ===== OVERVIEW AND STATS =====

// Get registrar overview statistics
router.get('/overview', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    // Get total students
    const [totalStudentsResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM studentrecord'
    );
    const totalStudents = totalStudentsResult[0].total;

    // Get enrollment stats
    const [enrollmentStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN EnrollmentStatus = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN EnrollmentStatus = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN EnrollmentStatus = 'declined' THEN 1 ELSE 0 END) as declined
      FROM studentrecord
    `);

    // Get attendance rate (simplified calculation)
    const [attendanceResult] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT al.StudentID) as students_with_attendance,
        COUNT(DISTINCT sr.StudentID) as total_students
      FROM studentrecord sr
      LEFT JOIN attendancelog al ON sr.StudentID = al.StudentID 
        AND al.Date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      WHERE sr.EnrollmentStatus = 'enrolled'
    `);

    const attendanceRate = attendanceResult[0].total_students > 0 
      ? Math.round((attendanceResult[0].students_with_attendance / attendanceResult[0].total_students) * 100)
      : 0;

    // Get recent activity (simplified since no CreatedAt column)
    const [recentActivity] = await pool.execute(`
      SELECT 
        'enrollment' as type,
        CONCAT('New enrollment application from ', sr.FullName) as description,
        NOW() as timestamp,
        'success' as status
      FROM studentrecord sr
      ORDER BY sr.StudentID DESC
      LIMIT 5
    `);

    res.json({
      totalStudents,
      pendingEnrollments: enrollmentStats[0].pending,
      approvedEnrollments: enrollmentStats[0].approved,
      declinedEnrollments: enrollmentStats[0].declined,
      attendanceRate,
      recentActivity: recentActivity.map(activity => ({
        id: Math.random().toString(36).substr(2, 9),
        type: activity.type,
        description: activity.description,
        timestamp: new Date(activity.timestamp).toLocaleString(),
        status: activity.status
      }))
    });
  } catch (error) {
    console.error('Registrar overview error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ===== ENROLLMENT MANAGEMENT =====

// Get enrollments with filtering and pagination
router.get('/enrollments', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (status !== 'all') {
      whereClause = 'WHERE sr.EnrollmentStatus = ?';
      params.push(status);
    }

    if (search) {
      const searchCondition = `AND (sr.FullName LIKE ? OR p.FullName LIKE ? OR sr.GradeLevel LIKE ?)`;
      whereClause += whereClause ? ` ${searchCondition}` : `WHERE ${searchCondition}`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const query = `
      SELECT 
        sr.StudentID as id,
        sr.FullName as studentName,
        sr.DateOfBirth as dateOfBirth,
        sr.Gender as gender,
        sr.PlaceOfBirth as placeOfBirth,
        sr.Nationality as nationality,
        sr.Address as address,
        sr.GradeLevel as gradeLevel,
        sec.SectionName as section,
        sr.EnrollmentStatus as enrollmentStatus,
        sr.EnrollmentDate as enrollmentDate,
        sr.CreatedBy as createdBy,
        p.FullName as parentName,
        p.ContactInfo as parentContact,
        er.ReviewID as reviewId,
        er.Status as reviewStatus,
        er.ReviewDate as reviewDate,
        er.DeclineReason as declineReason,
        er.Notes as reviewNotes,
        er.ReviewedByUserID as reviewedBy,
        ua.Username as reviewedByUsername,
        ed.Documents as documents,
        ed.AdditionalInfo as additionalInfo,
        ed.SubmittedByUserID as submittedBy
      FROM studentrecord sr
      LEFT JOIN parent p ON sr.ParentID = p.ParentID
      LEFT JOIN enrollment_review er ON sr.StudentID = er.StudentID
      LEFT JOIN useraccount ua ON er.ReviewedByUserID = ua.UserID
      LEFT JOIN enrollment_documents ed ON sr.StudentID = ed.StudentID
      LEFT JOIN section sec ON sr.SectionID = sec.SectionID
      ${whereClause}
      ORDER BY sr.StudentID DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));

    const [enrollments] = await pool.execute(query, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM studentrecord sr
      LEFT JOIN parent p ON sr.ParentID = p.ParentID
      ${whereClause}
    `;

    const [countResult] = await pool.execute(countQuery, params.slice(0, -2));
    const total = countResult[0].total;
    const pages = Math.ceil(total / limit);

    res.json({
      data: enrollments.map(enrollment => ({
        ...enrollment,
        documents: enrollment.documents ? JSON.parse(enrollment.documents) : [],
        enrollmentDate: enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toISOString() : null,
        reviewDate: enrollment.reviewDate ? new Date(enrollment.reviewDate).toISOString() : null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get enrollment statistics
router.get('/enrollments/stats', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN EnrollmentStatus = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN EnrollmentStatus = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN EnrollmentStatus = 'declined' THEN 1 ELSE 0 END) as declined
      FROM studentrecord
    `);

    res.json(stats[0]);
  } catch (error) {
    console.error('Enrollment stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// List available teacher schedules for registrar
router.get('/schedules', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    const sql = `
      SELECT 
        ts.ScheduleID AS id,
        COALESCE(sub.SubjectName, CAST(ts.SubjectID AS CHAR)) AS subject,
        COALESCE(tr.FullName, ua.Username, CAST(ts.TeacherID AS CHAR)) AS teacher,
        ts.TeacherID AS teacherId,
        ts.SectionID AS sectionId,
        sec.SectionName AS sectionName,
        sec.Capacity AS sectionCapacity,
        sec.GradeLevel AS gradeLevel,
        ts.DayOfWeek AS dayOfWeek,
        ts.TimeIn AS startTime,
        ts.TimeOut AS endTime
      FROM teacherschedule ts
      LEFT JOIN subject sub ON sub.SubjectID = ts.SubjectID
      LEFT JOIN teacherrecord tr ON tr.UserID = ts.TeacherID
      LEFT JOIN useraccount ua ON ua.UserID = ts.TeacherID
      LEFT JOIN section sec ON sec.SectionID = ts.SectionID
      ORDER BY ts.ScheduleID`;
    const [rows] = await pool.execute(sql);

    const data = rows.map((r) => ({
      id: r.id,
      subject: r.subject || 'Subject',
      teacher: r.teacher || '—',
      teacherId: r.teacherId || 0,
      sectionId: r.sectionId || null,
      sectionName: r.sectionName || null,
      sectionCapacity: r.sectionCapacity || null,
      gradeLevel: r.gradeLevel || null,
      dayOfWeek: r.dayOfWeek,
      startTime: (r.startTime || '').toString().slice(0,5),
      endTime: (r.endTime || '').toString().slice(0,5)
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Registrar list schedules error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Approve enrollment
router.post('/enrollments/:id/approve', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes = null, sectionId = null, scheduleIds = [] } = req.body;

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update student enrollment status and set status to Active (and optional section assignment)
      if (sectionId) {
        await connection.execute(
          'UPDATE studentrecord SET EnrollmentStatus = ?, Status = ?, EnrollmentDate = NOW(), SectionID = ? WHERE StudentID = ?',
          ['approved', 'Active', sectionId, id]
        );
      } else {
        await connection.execute(
          'UPDATE studentrecord SET EnrollmentStatus = ?, Status = ?, EnrollmentDate = NOW() WHERE StudentID = ?',
          ['approved', 'Active', id]
        );
      }

      // Create or update enrollment review record
      const [existingReview] = await connection.execute(
        'SELECT ReviewID FROM enrollment_review WHERE StudentID = ?',
        [id]
      );

      if (existingReview.length > 0) {
        await connection.execute(
          'UPDATE enrollment_review SET Status = ?, ReviewDate = NOW(), Notes = ?, ReviewedByUserID = ? WHERE StudentID = ?',
          ['approved', notes, req.user.userId, id]
        );
      } else {
        // Get the student's created by user ID
        const [student] = await connection.execute(
          'SELECT CreatedBy FROM studentrecord WHERE StudentID = ?',
          [id]
        );
        
        await connection.execute(
          'INSERT INTO enrollment_review (StudentID, SubmittedByUserID, Status, ReviewDate, Notes, ReviewedByUserID) VALUES (?, ?, ?, NOW(), ?, ?)',
          [id, student[0].CreatedBy, 'approved', notes, req.user.userId]
        );
      }

      await connection.commit();

      // After approval, optionally assign schedules
      if (Array.isArray(scheduleIds) && scheduleIds.length > 0) {
        const values = scheduleIds.map((sid) => [id, sid, req.user.userId]);
        // Insert ignoring duplicates
        await pool.query(
          'INSERT IGNORE INTO studentschedule (StudentID, ScheduleID, CreatedBy) VALUES ' +
          values.map(() => '(?, ?, ?)').join(', '),
          values.flat()
        );
      }

      res.json({
        success: true,
        message: 'Enrollment approved successfully',
        data: { sectionAssigned: !!sectionId, schedulesAssigned: Array.isArray(scheduleIds) ? scheduleIds.length : 0 }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Approve enrollment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Decline enrollment
router.post('/enrollments/:id/decline', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes = null } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Decline reason is required' });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update student enrollment status
      await connection.execute(
        'UPDATE studentrecord SET EnrollmentStatus = ? WHERE StudentID = ?',
        ['declined', id]
      );

      // Create or update enrollment review record
      const [existingReview] = await connection.execute(
        'SELECT ReviewID FROM enrollment_review WHERE StudentID = ?',
        [id]
      );

      if (existingReview.length > 0) {
        await connection.execute(
          'UPDATE enrollment_review SET Status = ?, ReviewDate = NOW(), DeclineReason = ?, Notes = ?, ReviewedByUserID = ? WHERE StudentID = ?',
          ['declined', reason, notes, req.user.userId, id]
        );
      } else {
        // Get the student's created by user ID
        const [student] = await connection.execute(
          'SELECT CreatedBy FROM studentrecord WHERE StudentID = ?',
          [id]
        );
        
        await connection.execute(
          'INSERT INTO enrollment_review (StudentID, SubmittedByUserID, Status, ReviewDate, DeclineReason, Notes, ReviewedByUserID) VALUES (?, ?, ?, NOW(), ?, ?, ?)',
          [id, student[0].CreatedBy, 'declined', reason, notes, req.user.userId]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Enrollment declined successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Decline enrollment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ===== STUDENT MANAGEMENT =====

// Get students with filtering
router.get('/students', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    const { search = '', gradeLevel = '', status = '' } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (sr.FullName LIKE ? OR p.FullName LIKE ? OR sr.GradeLevel LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (gradeLevel) {
      whereClause += ' AND sr.GradeLevel = ?';
      params.push(gradeLevel);
    }

    if (status) {
      whereClause += ' AND sr.EnrollmentStatus = ?';
      params.push(status);
    }

    const query = `
      SELECT 
        sr.StudentID as id,
        sr.FullName as studentName,
        sr.DateOfBirth as dateOfBirth,
        sr.Gender as gender,
        sr.PlaceOfBirth as placeOfBirth,
        sr.Nationality as nationality,
        sr.Address as address,
        sr.GradeLevel as gradeLevel,
        sec.SectionName as section,
        sr.EnrollmentStatus as enrollmentStatus,
        sr.EnrollmentDate as enrollmentDate,
        NOW() as lastModified,
        p.FullName as parentName,
        p.ContactInfo as parentContact
      FROM studentrecord sr
      LEFT JOIN parent p ON sr.ParentID = p.ParentID
      LEFT JOIN section sec ON sr.SectionID = sec.SectionID
      ${whereClause}
      ORDER BY sr.StudentID DESC
    `;

    const [students] = await pool.execute(query, params);

    res.json({
      data: students.map(student => ({
        ...student,
        enrollmentDate: student.enrollmentDate ? new Date(student.enrollmentDate).toISOString() : null,
        lastModified: new Date(student.lastModified).toISOString()
      }))
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update student information
router.put('/students/:id', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate required fields
    if (!updateData.studentName) {
      return res.status(400).json({ success: false, message: 'Student name is required' });
    }

    // Build dynamic update query
    const allowedFields = [
      'FullName', 'DateOfBirth', 'Gender', 'PlaceOfBirth', 'Nationality', 
      'Address', 'GradeLevel', 'SectionID'
    ];

    const updateFields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      const dbField = key === 'studentName' ? 'FullName' : 
                     key === 'dateOfBirth' ? 'DateOfBirth' :
                     key === 'gender' ? 'Gender' :
                     key === 'placeOfBirth' ? 'PlaceOfBirth' :
                     key === 'nationality' ? 'Nationality' :
                     key === 'address' ? 'Address' :
                     key === 'gradeLevel' ? 'GradeLevel' :
                     key === 'section' ? 'SectionID' : null;

      if (dbField && allowedFields.includes(dbField)) {
        updateFields.push(`${dbField} = ?`);
        values.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    // Handle section assignment
    if (updateData.section) {
      const [sectionResult] = await pool.execute(
        'SELECT SectionID FROM section WHERE SectionName = ? AND GradeLevel = ?',
        [updateData.section, updateData.gradeLevel || '']
      );

      if (sectionResult.length > 0) {
        const sectionIndex = updateFields.findIndex(field => field.includes('SectionID'));
        if (sectionIndex !== -1) {
          values[sectionIndex] = sectionResult[0].SectionID;
        }
      }
    }

    values.push(id);

    const query = `UPDATE studentrecord SET ${updateFields.join(', ')} WHERE StudentID = ?`;

    await pool.execute(query, values);

    res.json({
      success: true,
      message: 'Student updated successfully'
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get sections
router.get('/sections', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    const [sections] = await pool.execute(`
      SELECT 
        s.SectionID as id,
        s.SectionName as name,
        s.GradeLevel as gradeLevel,
        s.Capacity as capacity,
        COUNT(sr.StudentID) as currentEnrollment
      FROM section s
  LEFT JOIN studentrecord sr ON s.SectionID = sr.SectionID AND sr.EnrollmentStatus IN ('approved','enrolled')
      GROUP BY s.SectionID, s.SectionName, s.GradeLevel, s.Capacity
      ORDER BY s.GradeLevel, s.SectionName
    `);

    res.json({
      data: sections.map(section => ({
        ...section,
        currentEnrollment: parseInt(section.currentEnrollment)
      }))
    });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ===== REPORTS =====

// Get reports data
router.get('/reports', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    const { dateRange = '30', gradeLevel = 'all', reportType = 'overview' } = req.query;

    // Build filters
    const paramsBasic = [];
    const whereStudent = ['1=1'];

    if (gradeLevel && gradeLevel !== 'all') {
      whereStudent.push('sr.GradeLevel = ?');
      paramsBasic.push(gradeLevel);
    }

    // For student counts, use EnrollmentDate as available when filtering by date
    const dateIsAll = String(dateRange) === 'all';
    let dateStudentsClause = '';
    if (!dateIsAll) {
      const days = parseInt(String(dateRange)) || 30;
      dateStudentsClause = ' AND COALESCE(sr.EnrollmentDate, NOW()) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
      paramsBasic.push(days);
    }

    // Basic stats
    const [basicStats] = await pool.execute(
      `SELECT 
        COUNT(*) as totalStudents,
        SUM(CASE WHEN sr.EnrollmentStatus IN ('enrolled','approved','Active') THEN 1 ELSE 0 END) as enrolledStudents,
        SUM(CASE WHEN sr.EnrollmentStatus = 'pending' THEN 1 ELSE 0 END) as pendingEnrollments
      FROM studentrecord sr
      WHERE ${whereStudent.join(' AND ')}${dateStudentsClause}`,
      paramsBasic
    );

    // Attendance rate (unique students with any attendance hit in the range)
    const paramsAttendance = [];
    const whereAttendance = ["sr.EnrollmentStatus IN ('enrolled','approved','Active')"]; // enrolled-ish only
    if (gradeLevel && gradeLevel !== 'all') {
      whereAttendance.push('sr.GradeLevel = ?');
      paramsAttendance.push(gradeLevel);
    }
    let attendJoinWindow = '';
    if (!dateIsAll) {
      const days = parseInt(String(dateRange)) || 30;
      attendJoinWindow = ' AND al.Date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
      paramsAttendance.push(days);
    }

    const [attendanceResult] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT al.StudentID) as students_with_attendance,
        COUNT(DISTINCT sr.StudentID) as total_students
      FROM studentrecord sr
      LEFT JOIN attendancelog al ON sr.StudentID = al.StudentID ${attendJoinWindow}
      WHERE ${whereAttendance.join(' AND ')}`,
      paramsAttendance
    );

    const attendanceRate = attendanceResult[0].total_students > 0
      ? Math.round((attendanceResult[0].students_with_attendance / attendanceResult[0].total_students) * 100)
      : 0;

    // Monthly stats for last 6 months based on EnrollmentDate; attendance is rate per month
    const paramsMonthly = [];
    const whereMonthly = ['1=1'];
    if (gradeLevel && gradeLevel !== 'all') {
      whereMonthly.push('sr.GradeLevel = ?');
      paramsMonthly.push(gradeLevel);
    }
    // last 6 months window
    whereMonthly.push("COALESCE(sr.EnrollmentDate, NOW()) >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH)");

    const [monthlyStats] = await pool.execute(
      `SELECT 
        DATE_FORMAT(COALESCE(sr.EnrollmentDate, CURDATE()), '%Y-%m') as month,
        COUNT(*) as enrollments,
        ROUND(AVG(CASE WHEN al.Date IS NOT NULL THEN 1 ELSE 0 END) * 100, 1) as attendance
      FROM studentrecord sr
      LEFT JOIN attendancelog al ON sr.StudentID = al.StudentID 
        AND DATE_FORMAT(al.Date, '%Y-%m') = DATE_FORMAT(COALESCE(sr.EnrollmentDate, CURDATE()), '%Y-%m')
      WHERE ${whereMonthly.join(' AND ')}
      GROUP BY DATE_FORMAT(COALESCE(sr.EnrollmentDate, CURDATE()), '%Y-%m')
      ORDER BY month DESC
      LIMIT 6`,
      paramsMonthly
    );

    // Grade level stats
    const paramsGrade = [];
    const whereGrade = ["sr.EnrollmentStatus IN ('enrolled','approved','Active')"]; 
    // Do NOT exclude grades without recent attendance; only limit the joined attendance rows by date if needed
    const attendanceDateJoin = !dateIsAll ? 'AND al.Date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)' : '';
    if (!dateIsAll) {
      paramsGrade.push(parseInt(String(dateRange)) || 30);
    }
    const [gradeLevelStats] = await pool.execute(
      `SELECT 
        sr.GradeLevel as grade,
        COUNT(*) as students,
        ROUND(AVG(CASE WHEN al.Date IS NOT NULL THEN 1 ELSE 0 END) * 100, 1) as attendance
      FROM studentrecord sr
      LEFT JOIN attendancelog al ON sr.StudentID = al.StudentID ${attendanceDateJoin}
      WHERE ${whereGrade.join(' AND ')}
      GROUP BY sr.GradeLevel
      ORDER BY sr.GradeLevel`,
      paramsGrade
    );

    // Recent activity (fallback due to missing CreatedAt)
    const [recentActivity] = await pool.execute(`
      SELECT 
        'enrollment' as type,
        CONCAT('Enrollment application from ', sr.FullName) as description,
        NOW() as timestamp
      FROM studentrecord sr
      ORDER BY sr.StudentID DESC
      LIMIT 10
    `);

    res.json({
      attendanceRate,
      totalStudents: basicStats[0].totalStudents,
      enrolledStudents: basicStats[0].enrolledStudents,
      pendingEnrollments: basicStats[0].pendingEnrollments,
      monthlyStats: monthlyStats.map(stat => ({
        month: stat.month,
        enrollments: parseInt(stat.enrollments),
        attendance: parseFloat(stat.attendance) || 0
      })),
      gradeLevelStats: gradeLevelStats.map(stat => ({
        grade: stat.grade,
        students: parseInt(stat.students),
        attendance: parseFloat(stat.attendance) || 0
      })),
      recentActivity: recentActivity.map(activity => ({
        id: Math.random().toString(36).substr(2, 9),
        type: activity.type,
        description: activity.description,
        timestamp: new Date(activity.timestamp).toLocaleString()
      }))
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Export reports
router.get('/reports/export', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    const { type = 'summary', dateRange = '30', gradeLevel = 'all' } = req.query;

    const escapeCsv = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const toCsv = (rows, header) => {
      let csv = header.join(',') + '\n';
      for (const row of rows) {
        csv += header.map((h) => escapeCsv(row[h])).join(',') + '\n';
      }
      return csv;
    };

    const dateIsAll = String(dateRange) === 'all';
    const daysVal = parseInt(String(dateRange)) || 30;

    switch (type) {
      case 'enrollment': {
        const params = [];
        const where = ['1=1'];
        if (gradeLevel && gradeLevel !== 'all') {
          where.push('sr.GradeLevel = ?');
          params.push(gradeLevel);
        }
        if (!dateIsAll) {
          where.push('COALESCE(sr.EnrollmentDate, NOW()) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)');
          params.push(daysVal);
        }
        const [rows] = await pool.execute(
          `SELECT 
            sr.FullName as StudentName,
            sr.GradeLevel as GradeLevel,
            sr.EnrollmentStatus as Status,
            sr.EnrollmentDate as EnrollmentDate,
            p.FullName as ParentName
           FROM studentrecord sr
           LEFT JOIN parent p ON p.ParentID = sr.ParentID
           WHERE ${where.join(' AND ')}
           ORDER BY COALESCE(sr.EnrollmentDate, NOW()) DESC
           LIMIT 2000`,
          params
        );
        const mapped = rows.map(r => ({
          StudentName: r.StudentName,
          GradeLevel: r.GradeLevel,
          Status: r.Status,
          EnrollmentDate: r.EnrollmentDate ? new Date(r.EnrollmentDate).toISOString().split('T')[0] : '',
          ParentName: r.ParentName || ''
        }));
        const csv = toCsv(mapped, ['StudentName','GradeLevel','Status','EnrollmentDate','ParentName']);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="report-enrollment-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }
      case 'attendance': {
        const params = [daysVal];
        const where = ['al.Date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)'];
        if (gradeLevel && gradeLevel !== 'all') {
          where.push('sr.GradeLevel = ?');
          params.push(gradeLevel);
        }
        const [rows] = await pool.execute(
          `SELECT 
            sr.FullName as StudentName,
            sr.GradeLevel as GradeLevel,
            sec.SectionName as Section,
            al.Date as Date,
            al.TimeIn as TimeIn,
            al.TimeOut as TimeOut
           FROM attendancelog al
           JOIN studentrecord sr ON sr.StudentID = al.StudentID
           LEFT JOIN section sec ON sec.SectionID = sr.SectionID
           WHERE ${where.join(' AND ')}
           ORDER BY al.Date DESC, sr.FullName
           LIMIT 5000`,
          params
        );
        const mapped = rows.map(r => ({
          StudentName: r.StudentName,
          GradeLevel: r.GradeLevel,
          Section: r.Section || '',
          Date: r.Date ? new Date(r.Date).toISOString().split('T')[0] : '',
          TimeIn: r.TimeIn ? String(r.TimeIn).slice(0,8) : '',
          TimeOut: r.TimeOut ? String(r.TimeOut).slice(0,8) : ''
        }));
        const csv = toCsv(mapped, ['StudentName','GradeLevel','Section','Date','TimeIn','TimeOut']);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="report-attendance-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }
      case 'students': {
        const params = [];
        const where = ['1=1'];
        if (gradeLevel && gradeLevel !== 'all') {
          where.push('sr.GradeLevel = ?');
          params.push(gradeLevel);
        }
        const [rows] = await pool.execute(
          `SELECT 
            sr.FullName as StudentName,
            sr.GradeLevel as GradeLevel,
            sec.SectionName as Section,
            p.FullName as ParentName,
            p.ContactInfo as Contact
           FROM studentrecord sr
           LEFT JOIN parent p ON p.ParentID = sr.ParentID
           LEFT JOIN section sec ON sec.SectionID = sr.SectionID
           WHERE ${where.join(' AND ')}
           ORDER BY sr.GradeLevel, sr.FullName
           LIMIT 5000`,
          params
        );
        const mapped = rows.map(r => ({
          StudentName: r.StudentName,
          GradeLevel: r.GradeLevel,
          Section: r.Section || '',
          ParentName: r.ParentName || '',
          Contact: r.Contact || ''
        }));
        const csv = toCsv(mapped, ['StudentName','GradeLevel','Section','ParentName','Contact']);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="report-students-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }
      case 'summary':
      default: {
        // Reuse the stats logic quickly
        const paramsBasic = [];
        const whereStudent = ['1=1'];
        if (gradeLevel && gradeLevel !== 'all') {
          whereStudent.push('sr.GradeLevel = ?');
          paramsBasic.push(gradeLevel);
        }
        let dateStudentsClause = '';
        if (!dateIsAll) {
          dateStudentsClause = ' AND COALESCE(sr.EnrollmentDate, NOW()) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
          paramsBasic.push(daysVal);
        }
        const [basicStats] = await pool.execute(
          `SELECT 
            COUNT(*) as totalStudents,
            SUM(CASE WHEN sr.EnrollmentStatus IN ('enrolled','approved','Active') THEN 1 ELSE 0 END) as enrolledStudents,
            SUM(CASE WHEN sr.EnrollmentStatus = 'pending' THEN 1 ELSE 0 END) as pendingEnrollments
          FROM studentrecord sr
          WHERE ${whereStudent.join(' AND ')}${dateStudentsClause}`,
          paramsBasic
        );
        const [attendanceResult] = await pool.execute(
          `SELECT 
            COUNT(DISTINCT al.StudentID) as students_with_attendance,
            COUNT(DISTINCT sr.StudentID) as total_students
          FROM studentrecord sr
          LEFT JOIN attendancelog al ON sr.StudentID = al.StudentID ${!dateIsAll ? 'AND al.Date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)' : ''}
          WHERE sr.EnrollmentStatus IN ('enrolled','approved','Active')${gradeLevel && gradeLevel !== 'all' ? ' AND sr.GradeLevel = ?' : ''}`,
          !dateIsAll
            ? gradeLevel && gradeLevel !== 'all'
              ? [daysVal, gradeLevel]
              : [daysVal]
            : gradeLevel && gradeLevel !== 'all' ? [gradeLevel] : []
        );
        const attRate = attendanceResult[0].total_students > 0
          ? Math.round((attendanceResult[0].students_with_attendance / attendanceResult[0].total_students) * 100)
          : 0;
        const rows = [{
          Metric: 'Total Students',
          Value: basicStats[0].totalStudents,
          Date: new Date().toISOString().split('T')[0]
        },{
          Metric: 'Enrolled Students',
          Value: basicStats[0].enrolledStudents,
          Date: new Date().toISOString().split('T')[0]
        },{
          Metric: 'Pending Enrollments',
          Value: basicStats[0].pendingEnrollments,
          Date: new Date().toISOString().split('T')[0]
        },{
          Metric: 'Attendance Rate (%)',
          Value: attRate,
          Date: new Date().toISOString().split('T')[0]
        }];
        const csv = toCsv(rows, ['Metric','Value','Date']);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="report-summary-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }
      case 'monthly': {
        const paramsMonthly = [];
        const whereMonthly = ['1=1'];
        if (gradeLevel && gradeLevel !== 'all') {
          whereMonthly.push('sr.GradeLevel = ?');
          paramsMonthly.push(gradeLevel);
        }
        whereMonthly.push("COALESCE(sr.EnrollmentDate, NOW()) >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH)");
        const [rows] = await pool.execute(
          `SELECT 
            DATE_FORMAT(COALESCE(sr.EnrollmentDate, CURDATE()), '%Y-%m') as Month,
            COUNT(*) as Enrollments,
            ROUND(AVG(CASE WHEN al.Date IS NOT NULL THEN 1 ELSE 0 END) * 100, 1) as Attendance
           FROM studentrecord sr
           LEFT JOIN attendancelog al ON sr.StudentID = al.StudentID 
             AND DATE_FORMAT(al.Date, '%Y-%m') = DATE_FORMAT(COALESCE(sr.EnrollmentDate, CURDATE()), '%Y-%m')
           WHERE ${whereMonthly.join(' AND ')}
           GROUP BY DATE_FORMAT(COALESCE(sr.EnrollmentDate, CURDATE()), '%Y-%m')
           ORDER BY Month DESC
           LIMIT 6`,
          paramsMonthly
        );
        const csv = toCsv(rows, ['Month','Enrollments','Attendance']);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="report-monthly-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }
      case 'grade': {
        const params = [];
        // Always include enrolled/approved/Active students; do not require attendance existence
        const attendanceDateJoin = !dateIsAll ? 'AND al.Date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)' : '';
        if (!dateIsAll) {
          params.push(daysVal);
        }
        const [rows] = await pool.execute(
          `SELECT 
            sr.GradeLevel as Grade,
            COUNT(*) as Students,
            ROUND(AVG(CASE WHEN al.Date IS NOT NULL THEN 1 ELSE 0 END) * 100, 1) as Attendance
           FROM studentrecord sr
           LEFT JOIN attendancelog al ON sr.StudentID = al.StudentID ${attendanceDateJoin}
           WHERE sr.EnrollmentStatus IN ('enrolled','approved','Active')
           GROUP BY sr.GradeLevel
           ORDER BY sr.GradeLevel`,
          params
        );
        const csv = toCsv(rows, ['Grade','Students','Attendance']);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="report-grade-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }
      case 'activity': {
        const [rows] = await pool.execute(
          `SELECT 
            'enrollment' as Type,
            CONCAT('Enrollment application from ', sr.FullName) as Description,
            NOW() as Timestamp
           FROM studentrecord sr
           ORDER BY sr.StudentID DESC
           LIMIT 10`
        );
        const mapped = rows.map(r => ({
          Type: r.Type,
          Description: r.Description,
          Timestamp: new Date(r.Timestamp).toLocaleString()
        }));
        const csv = toCsv(mapped, ['Type','Description','Timestamp']);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="report-activity-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ===== ATTENDANCE MANAGEMENT =====

// Get attendance statistics
router.get('/attendance/stats', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    const { dateRange = '30', gradeLevel = '' } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (dateRange !== 'all') {
      whereClause += ' AND al.Date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
      params.push(parseInt(dateRange));
    }

    if (gradeLevel) {
      whereClause += ' AND sr.GradeLevel = ?';
      params.push(gradeLevel);
    }

    const query = `
      SELECT 
        COUNT(DISTINCT al.StudentID) as students_with_attendance,
        COUNT(DISTINCT sr.StudentID) as total_students,
        ROUND(AVG(CASE WHEN al.Date IS NOT NULL THEN 1 ELSE 0 END) * 100, 1) as attendance_rate
      FROM studentrecord sr
      LEFT JOIN attendancelog al ON sr.StudentID = al.StudentID ${whereClause.replace('WHERE 1=1', '')}
      WHERE sr.EnrollmentStatus = 'enrolled'
    `;

    const [stats] = await pool.execute(query, params);

    res.json({
      attendanceRate: parseFloat(stats[0].attendance_rate) || 0,
      totalStudents: parseInt(stats[0].total_students),
      studentsWithAttendance: parseInt(stats[0].students_with_attendance)
    });
  } catch (error) {
    console.error('Attendance stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get attendance logs
router.get('/attendance/logs', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    const { date, gradeLevel = '', section = '', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (date) {
      whereClause += ' AND al.Date = ?';
      params.push(date);
    }

    if (gradeLevel) {
      whereClause += ' AND sr.GradeLevel = ?';
      params.push(gradeLevel);
    }

    if (section) {
      whereClause += ' AND sec.SectionName = ?';
      params.push(section);
    }

    const query = `
      SELECT 
        al.AttendanceID as id,
        sr.FullName as studentName,
        sr.GradeLevel as gradeLevel,
        sec.SectionName as section,
        al.Date as date,
        'Present' as status,
        al.TimeIn as timeIn,
        al.TimeOut as timeOut,
        '' as notes
      FROM attendancelog al
      JOIN studentrecord sr ON al.StudentID = sr.StudentID
      LEFT JOIN section sec ON sr.SectionID = sec.SectionID
      ${whereClause}
      ORDER BY al.Date DESC, sr.FullName
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));

    const [logs] = await pool.execute(query, params);

    res.json({
      data: logs.map(log => ({
        ...log,
        date: new Date(log.date).toISOString().split('T')[0],
        timeIn: log.timeIn ? new Date(log.timeIn).toISOString() : null,
        timeOut: log.timeOut ? new Date(log.timeOut).toISOString() : null
      }))
    });
  } catch (error) {
    console.error('Attendance logs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ===== NOTIFICATIONS =====

// Get notifications
router.get('/notifications', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    const [notifications] = await pool.execute(`
      SELECT 
        n.NotificationID as id,
        n.Title as title,
        n.Message as message,
        n.Type as type,
        n.IsRead as isRead,
        n.CreatedAt as createdAt
      FROM notification n
      WHERE n.UserID = ? OR n.UserID IS NULL
      ORDER BY n.CreatedAt DESC
      LIMIT 50
    `, [req.user.userId]);

    res.json({
      data: notifications.map(notification => ({
        ...notification,
        createdAt: new Date(notification.createdAt).toISOString()
      }))
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Mark notification as read
router.post('/notifications/:id/read', authenticateToken, requireRole(['registrar', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE notification SET IsRead = 1 WHERE NotificationID = ? AND UserID = ?',
      [id, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ===== FILE UPLOAD =====

// Upload enrollment documents
router.post('/upload-documents', authenticateToken, requireRole(['parent', 'registrar', 'admin']), upload.array('documents', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files'
    });
  }
});

// ===== DOCUMENT SERVING =====

// Serve enrollment documents
router.get('/documents/:filename', async (req, res) => {
  try {
    // Check authentication - either from header or query parameter
    const authHeader = req.headers.authorization;
    const tokenFromQuery = req.query.token;
    
    if (!authHeader && !tokenFromQuery) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // If token is in query parameter, validate it
    if (tokenFromQuery) {
      try {
        const decoded = jwt.verify(tokenFromQuery, process.env.JWT_SECRET);
        console.log('Decoded token:', { userId: decoded.userId, role: decoded.role });
        
        // Check if user has required role - for now, allow any authenticated user for testing
        // TODO: Restrict to ['registrar', 'admin'] in production
        if (!decoded.userId) {
          return res.status(403).json({ success: false, message: 'Invalid user ID in token' });
        }
      } catch (error) {
        console.error('Token validation error:', error);
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
    }
    
    const { filename } = req.params;
    
    // Decode the filename
    const decodedFilename = decodeURIComponent(filename);
    
    // For now, we'll serve files from a documents directory
    // In a real implementation, you'd want to:
    // 1. Store files in a secure directory outside the web root
    // 2. Validate the filename to prevent directory traversal
    // 3. Check if the user has permission to access this specific document
    
    // path and fs are already imported at the top
    
    // Create documents directory if it doesn't exist
    const documentsDir = path.join(process.cwd(), 'uploads', 'enrollment-documents');
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }
    
    const filePath = path.join(documentsDir, decodedFilename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Determine content type based on file extension
    const ext = path.extname(decodedFilename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.html':
        contentType = 'text/html';
        break;
      case '.rtf':
        contentType = 'application/rtf';
        break;
      default:
        contentType = 'application/octet-stream';
    }
    
    // Check if this is a view request (has token query parameter) or download request
    const isViewRequest = !!tokenFromQuery;
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    
    if (isViewRequest) {
      // For viewing, try to force inline display
      res.setHeader('Content-Disposition', `inline; filename="${decodedFilename}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
    } else {
      // For download, use attachment
      res.setHeader('Content-Disposition', `attachment; filename="${decodedFilename}"`);
    }
    
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: 'Error reading file' 
        });
      }
    });
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Document serving error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error serving document' 
    });
  }
});

export default router;
