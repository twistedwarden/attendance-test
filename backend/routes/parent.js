import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { pool, storeEnrollmentDocuments } from '../config/database.js';

const router = express.Router();

// Get parent profile
router.get('/profile', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const parentId = req.user.parentId;
    if (!parentId) {
      return res.status(404).json({ success: false, message: 'Parent profile not found' });
    }

    const [rows] = await pool.execute(
      `SELECT p.ParentID, p.FullName, p.ContactInfo, ua.Username as Email
       FROM parent p
       LEFT JOIN useraccount ua ON ua.UserID = p.UserID
       WHERE p.ParentID = ?`,
      [parentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parent profile not found' });
    }

    const parent = rows[0];
    return res.json({
      success: true,
      data: {
        ParentID: parent.ParentID,
        FullName: parent.FullName,
        ContactInfo: parent.ContactInfo,
        Email: parent.Email
      }
    });
  } catch (error) {
    console.error('Get parent profile error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get students linked to parent
router.get('/students', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const parentId = req.user.parentId;
    if (!parentId) {
      return res.status(404).json({ success: false, message: 'Parent profile not found' });
    }

    const [rows] = await pool.execute(
      `SELECT s.StudentID, s.FullName, s.GradeLevel, s.SectionID, s.ParentID, s.Status, s.EnrollmentStatus,
              sec.SectionName, sec.Description as SectionDescription
       FROM studentrecord s
       LEFT JOIN section sec ON sec.SectionID = s.SectionID
       WHERE s.ParentID = ?
         AND (s.EnrollmentStatus IS NULL OR s.EnrollmentStatus <> 'declined')
       ORDER BY s.StudentID`,
      [parentId]
    );

    const students = rows.map(student => ({
      studentId: student.StudentID,
      fullName: student.FullName,
      gradeLevel: student.GradeLevel || '',
      section: student.SectionName || '',
      sectionId: student.SectionID ?? null,
      parentId: student.ParentID,
      status: student.Status,
      enrollmentStatus: student.EnrollmentStatus
    }));

    return res.json({ success: true, data: students });
  } catch (error) {
    console.error('Get parent students error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get attendance records for a specific student
router.get('/attendance/:studentId', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 30 } = req.query;
    const parentId = req.user.parentId;

    // Verify the student belongs to this parent
    const [studentCheck] = await pool.execute(
      'SELECT StudentID FROM studentrecord WHERE StudentID = ? AND ParentID = ?',
      [studentId, parentId]
    );

    if (studentCheck.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this student' });
    }

    // Get attendance records from both attendancelog and subjectattendance
    const [attendanceLog] = await pool.execute(
      `SELECT al.AttendanceID as attendanceId, al.StudentID as studentId, al.Date as date, 
              al.TimeIn as timeIn, al.TimeOut as timeOut, 'Present' as status
       FROM attendancelog al
       WHERE al.StudentID = ?
       ORDER BY al.Date DESC
       LIMIT ?`,
      [studentId, parseInt(limit)]
    );

    // Get subject attendance records with actual time data
    const [subjectAttendance] = await pool.execute(
      `SELECT sa.SubjectAttendanceID as attendanceId, sa.StudentID as studentId, 
              sa.Date as date, al.TimeIn as timeIn, al.TimeOut as timeOut, sa.Status as status
       FROM subjectattendance sa
       LEFT JOIN attendancelog al ON al.StudentID = sa.StudentID AND al.Date = sa.Date
       WHERE sa.StudentID = ?
       ORDER BY sa.Date DESC
       LIMIT ?`,
      [studentId, parseInt(limit)]
    );

    // Combine and format the records
    const allRecords = [...attendanceLog, ...subjectAttendance];
    
    // Remove duplicates and sort by date
    const uniqueRecords = allRecords.reduce((acc, record) => {
      const key = `${record.studentId}-${record.date}`;
      if (!acc[key] || record.status !== 'Present') {
        acc[key] = record;
      }
      return acc;
    }, {});

    const attendanceRecords = Object.values(uniqueRecords)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    return res.json({ success: true, data: attendanceRecords });
  } catch (error) {
    console.error('Get student attendance error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get attendance statistics for a student
router.get('/attendance-stats/:studentId', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const parentId = req.user.parentId;

    // Verify the student belongs to this parent
    const [studentCheck] = await pool.execute(
      'SELECT StudentID FROM studentrecord WHERE StudentID = ? AND ParentID = ?',
      [studentId, parentId]
    );

    if (studentCheck.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this student' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Get today's status
    const [todayRecord] = await pool.execute(
      `SELECT sa.Status 
       FROM subjectattendance sa
       WHERE sa.StudentID = ? AND sa.Date = ?
       ORDER BY sa.CreatedAt DESC
       LIMIT 1`,
      [studentId, today]
    );

    // Get weekly attendance (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    const [weeklyRecords] = await pool.execute(
      `SELECT sa.Status, sa.Date
       FROM subjectattendance sa
       WHERE sa.StudentID = ? AND sa.Date >= ?
       ORDER BY sa.Date DESC`,
      [studentId, oneWeekAgoStr]
    );

    // Calculate weekly percentage
    const presentDays = weeklyRecords.filter(record => 
      record.Status === 'Present' || record.Status === 'Late'
    ).length;
    
    const weeklyPercentage = weeklyRecords.length > 0 
      ? Math.round((presentDays / weeklyRecords.length) * 100)
      : 0;

    const stats = {
      todayStatus: todayRecord.length > 0 ? todayRecord[0].Status : 'No Record',
      weeklyPercentage
    };

    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get student attendance stats error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get enrollment review notifications for parent
router.get('/notifications', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const parentId = req.user.parentId;
    if (!parentId) {
      return res.status(404).json({ success: false, message: 'Parent profile not found' });
    }

    // Get enrollment review notifications for this parent's students
    const [notifications] = await pool.execute(
      `SELECT 
        er.ReviewID,
        er.StudentID,
        er.Status as ReviewStatus,
        er.ReviewDate,
        er.Notes,
        er.DeclineReason,
        sr.FullName as StudentName,
        sr.GradeLevel,
        sec.SectionName as Section,
        ua.Username as ReviewedByUsername,
        CASE WHEN nrs.ReadStatusID IS NOT NULL THEN 1 ELSE 0 END as IsRead
       FROM enrollment_review er
       JOIN studentrecord sr ON er.StudentID = sr.StudentID
       LEFT JOIN section sec ON sec.SectionID = sr.SectionID
       LEFT JOIN useraccount ua ON er.ReviewedByUserID = ua.UserID
       LEFT JOIN notification_read_status nrs ON er.ReviewID = nrs.ReviewID AND nrs.ParentID = ?
       WHERE sr.ParentID = ? AND er.ReviewDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       ORDER BY er.ReviewDate DESC
       LIMIT 20`,
      [parentId, parentId]
    );

    const formattedNotifications = notifications.map(notification => ({
      id: notification.ReviewID,
      studentId: notification.StudentID,
      studentName: notification.StudentName,
      gradeLevel: notification.GradeLevel,
      section: notification.Section,
      status: notification.ReviewStatus,
      reviewDate: notification.ReviewDate,
      notes: notification.Notes,
      declineReason: notification.DeclineReason,
      reviewedBy: notification.ReviewedByUsername,
      isRead: !!notification.IsRead,
      message: notification.ReviewStatus === 'approved' 
        ? `${notification.StudentName} enrollment has been approved!`
        : notification.ReviewStatus === 'declined'
        ? `${notification.StudentName} enrollment has been declined.`
        : `${notification.StudentName} enrollment status updated.`
    }));

    return res.json({ success: true, data: formattedNotifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Mark notification as read
router.post('/notifications/:reviewId/read', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const parentId = req.user.parentId;
    
    if (!parentId) {
      return res.status(404).json({ success: false, message: 'Parent profile not found' });
    }

    // Verify the notification belongs to this parent
    const [verification] = await pool.execute(
      `SELECT er.ReviewID 
       FROM enrollment_review er
       JOIN studentrecord sr ON er.StudentID = sr.StudentID
       WHERE er.ReviewID = ? AND sr.ParentID = ?`,
      [reviewId, parentId]
    );

    if (verification.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this notification' });
    }

    // Mark as read (INSERT IGNORE to handle duplicates)
    await pool.execute(
      `INSERT IGNORE INTO notification_read_status (ParentID, ReviewID) VALUES (?, ?)`,
      [parentId, reviewId]
    );

    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Mark all notifications as read
router.post('/notifications/mark-all-read', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const parentId = req.user.parentId;
    
    if (!parentId) {
      return res.status(404).json({ success: false, message: 'Parent profile not found' });
    }

    // Get all unread notifications for this parent
    const [unreadNotifications] = await pool.execute(
      `SELECT er.ReviewID
       FROM enrollment_review er
       JOIN studentrecord sr ON er.StudentID = sr.StudentID
       LEFT JOIN notification_read_status nrs ON er.ReviewID = nrs.ReviewID AND nrs.ParentID = ?
       WHERE sr.ParentID = ? AND er.ReviewDate >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND nrs.ReadStatusID IS NULL`,
      [parentId, parentId]
    );

    // Mark all as read
    if (unreadNotifications.length > 0) {
      const values = unreadNotifications.map(() => '(?, ?)').join(', ');
      const params = unreadNotifications.flatMap(notification => [parentId, notification.ReviewID]);
      
      await pool.execute(
        `INSERT IGNORE INTO notification_read_status (ParentID, ReviewID) VALUES ${values}`,
        params
      );
    }

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ===== ENROLLMENT FOLLOW-UP DOCUMENTS =====

// Get enrollment documents submitted by this parent (optionally filter by student)
router.get('/enrollment-documents', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const parentId = req.user.parentId;
    const { studentId } = req.query;

    if (!parentId) {
      return res.status(404).json({ success: false, message: 'Parent profile not found' });
    }

    let sql = `
      SELECT ed.DocumentID as documentId,
             ed.StudentID as studentId,
             sr.FullName as studentName,
             ed.SubmittedByUserID as submittedByUserId,
             ed.Documents as documents,
             ed.AdditionalInfo as additionalInfo,
             ed.CreatedAt as createdAt
      FROM enrollment_documents ed
      JOIN studentrecord sr ON sr.StudentID = ed.StudentID
      WHERE sr.ParentID = ?`;
    const params = [parentId];

    if (studentId) {
      sql += ' AND ed.StudentID = ?';
      params.push(studentId);
    }

    sql += ' ORDER BY ed.CreatedAt DESC, ed.DocumentID DESC';

    const [rows] = await pool.execute(sql, params);
    const data = rows.map(r => ({
      documentId: r.documentId,
      studentId: r.studentId,
      studentName: r.studentName,
      submittedByUserId: r.submittedByUserId,
      documents: r.documents ? JSON.parse(r.documents) : [],
      additionalInfo: r.additionalInfo || null,
      createdAt: r.createdAt
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Get enrollment documents error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Submit follow-up enrollment documents for a student
router.post('/enrollment-documents', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const parentId = req.user.parentId;
    const userId = req.user.userId;
    const { studentId, documents = [], additionalInfo = null } = req.body;

    if (!parentId) {
      return res.status(404).json({ success: false, message: 'Parent profile not found' });
    }

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'studentId is required' });
    }

    // Verify the student belongs to this parent
    const [studentCheck] = await pool.execute(
      'SELECT StudentID FROM studentrecord WHERE StudentID = ? AND ParentID = ? LIMIT 1',
      [studentId, parentId]
    );
    if (studentCheck.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this student' });
    }

    // Persist the follow-up document record
    const docId = await storeEnrollmentDocuments(studentId, {
      submittedByUserId: userId,
      documents,
      additionalInfo
    });

    return res.status(201).json({
      success: true,
      message: 'Follow-up documents submitted successfully',
      data: { documentId: docId }
    });
  } catch (error) {
    console.error('Submit follow-up documents error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get subject-based attendance for a specific student
router.get('/subject-attendance/:studentId', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 30 } = req.query;
    const parentId = req.user.parentId;

    // Verify the student belongs to this parent
    const [studentCheck] = await pool.execute(
      'SELECT StudentID FROM studentrecord WHERE StudentID = ? AND ParentID = ?',
      [studentId, parentId]
    );

    if (studentCheck.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this student' });
    }

    // Get subject attendance records with subject and schedule information
    const [subjectAttendance] = await pool.execute(
      `SELECT 
        sa.SubjectAttendanceID as attendanceId,
        sa.StudentID as studentId,
        sa.Date as date,
        al.TimeIn as timeIn,
        al.TimeOut as timeOut,
        sa.Status as status,
        sa.CreatedAt as createdAt,
        s.SubjectID as subjectId,
        s.SubjectName as subjectName,
        ts.ScheduleID as scheduleId,
        ts.TimeIn as scheduleTimeIn,
        ts.TimeOut as scheduleTimeOut,
        ts.DayOfWeek as dayOfWeek,
        COALESCE(ts.GracePeriod, 15) as gracePeriod,
        COALESCE(tr.FullName, ua.Username, 'Unknown Teacher') as teacherName
       FROM subjectattendance sa
       LEFT JOIN attendancelog al ON al.StudentID = sa.StudentID AND al.Date = sa.Date
       LEFT JOIN subject s ON s.SubjectID = sa.SubjectID
       LEFT JOIN teacherschedule ts ON ts.SubjectID = sa.SubjectID
       LEFT JOIN teacherrecord tr ON tr.UserID = ts.TeacherID
       LEFT JOIN useraccount ua ON ua.UserID = ts.TeacherID
       WHERE sa.StudentID = ?
       ORDER BY sa.Date DESC, sa.CreatedAt DESC
       LIMIT ?`,
      [studentId, parseInt(limit)]
    );

    // Group attendance by subject
    const subjectGroups = subjectAttendance.reduce((acc, record) => {
      const subjectKey = record.subjectId || 'unknown';
      if (!acc[subjectKey]) {
        acc[subjectKey] = {
          subjectId: record.subjectId,
          subjectName: record.subjectName || 'Unknown Subject',
          teacherName: record.teacherName || 'Unknown Teacher',
          scheduleTimeIn: record.scheduleTimeIn,
          scheduleTimeOut: record.scheduleTimeOut,
          dayOfWeek: record.dayOfWeek,
          gracePeriod: record.gracePeriod,
          attendanceRecords: []
        };
      }
      acc[subjectKey].attendanceRecords.push({
        attendanceId: record.attendanceId,
        date: record.date,
        timeIn: record.timeIn,
        timeOut: record.timeOut,
        status: record.status,
        createdAt: record.createdAt
      });
      return acc;
    }, {});

    // Calculate subject statistics
    const subjectStats = Object.values(subjectGroups).map(subject => {
      const records = subject.attendanceRecords;
      const totalDays = records.length;
      const presentDays = records.filter(r => r.status === 'Present').length;
      const lateDays = records.filter(r => r.status === 'Late').length;
      const absentDays = records.filter(r => r.status === 'Absent').length;
      const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;
      
      return {
        ...subject,
        stats: {
          totalDays,
          presentDays,
          lateDays,
          absentDays,
          attendanceRate
        }
      };
    });

    return res.json({ success: true, data: subjectStats });
  } catch (error) {
    console.error('Get subject attendance error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ===== EXCUSE LETTER ROUTES =====

// Get excuse letters for parent's students
router.get('/excuse-letters', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const parentId = req.user.parentId;
    const { studentId, status, limit = 50 } = req.query;

    if (!parentId) {
      return res.status(404).json({ success: false, message: 'Parent profile not found' });
    }

    let query = `
      SELECT 
        el.LetterID as excuseLetterId,
        el.StudentID as studentId,
        el.ParentID as parentId,
        NULL as subjectId,
        el.DateFiled as dateFrom,
        el.DateFiled as dateTo,
        el.Reason as reason,
        el.AttachmentFile as supportingDocumentPath,
        LOWER(el.Status) as status,
        'parent' as submittedBy,
        el.ParentID as submittedByUserId,
        el.ReviewedBy as reviewedByUserId,
        NULL as reviewNotes,
        el.DateFiled as createdAt,
        el.DateFiled as updatedAt,
        el.ReviewedDate as reviewedAt,
        sr.FullName as studentName,
        sr.GradeLevel as gradeLevel,
        sec.SectionName as sectionName,
        NULL as subjectName,
        COALESCE(tr.FullName, ua.Username) as reviewedByName
      FROM excuseletter el
      JOIN studentrecord sr ON sr.StudentID = el.StudentID
      LEFT JOIN section sec ON sec.SectionID = sr.SectionID
      LEFT JOIN teacherrecord tr ON tr.UserID = el.ReviewedBy
      LEFT JOIN useraccount ua ON ua.UserID = el.ReviewedBy
      WHERE el.ParentID = ?
    `;

    const params = [parentId];

    if (studentId) {
      query += ' AND el.StudentID = ?';
      params.push(studentId);
    }

    if (status && status !== 'all') {
      query += ' AND LOWER(el.Status) = ?';
      params.push(status.toLowerCase());
    }

    query += ' ORDER BY el.DateFiled DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await pool.execute(query, params);

    const excuseLetters = rows.map(letter => ({
      excuseLetterId: letter.excuseLetterId,
      studentId: letter.studentId,
      studentName: letter.studentName,
      gradeLevel: letter.gradeLevel,
      sectionName: letter.sectionName,
      subjectId: letter.subjectId,
      subjectName: letter.subjectName,
      dateFrom: letter.dateFrom,
      dateTo: letter.dateTo,
      reason: letter.reason,
      supportingDocumentPath: letter.supportingDocumentPath,
      status: letter.status,
      submittedBy: letter.submittedBy,
      submittedByUserId: letter.submittedByUserId,
      reviewedByUserId: letter.reviewedByUserId,
      reviewedByName: letter.reviewedByName,
      reviewNotes: letter.reviewNotes,
      createdAt: letter.createdAt,
      updatedAt: letter.updatedAt,
      reviewedAt: letter.reviewedAt
    }));

    return res.json({ success: true, data: excuseLetters });
  } catch (error) {
    console.error('Get excuse letters error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Submit excuse letter
router.post('/excuse-letters', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const parentId = req.user.parentId;
    const userId = req.user.userId;
    const { studentId, subjectId, dateFrom, dateTo, reason, supportingDocumentPath } = req.body;

    if (!parentId) {
      return res.status(404).json({ success: false, message: 'Parent profile not found' });
    }

    // Validate required fields
    if (!studentId || !dateFrom || !dateTo || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID, date from, date to, and reason are required' 
      });
    }

    // Verify the student belongs to this parent
    const [studentCheck] = await pool.execute(
      'SELECT StudentID FROM studentrecord WHERE StudentID = ? AND ParentID = ?',
      [studentId, parentId]
    );

    if (studentCheck.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this student' });
    }

    // Validate date range
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    if (fromDate > toDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date from cannot be after date to' 
      });
    }

    // Insert excuse letter using existing table structure
    const [result] = await pool.execute(
      `INSERT INTO excuseletter 
       (StudentID, ParentID, DateFiled, Reason, AttachmentFile, Status) 
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [studentId, parentId, dateFrom, reason, supportingDocumentPath || null]
    );

    const excuseLetterId = result.insertId;

    // Create notifications for teachers who teach this student
    if (subjectId) {
      // Notify specific subject teacher
      const [teacherRows] = await pool.execute(
        `SELECT DISTINCT ts.TeacherID 
         FROM teacherschedule ts
         JOIN studentschedule ss ON ss.ScheduleID = ts.ScheduleID
         WHERE ss.StudentID = ? AND ts.SubjectID = ?`,
        [studentId, subjectId]
      );

      for (const teacher of teacherRows) {
        await pool.execute(
          `INSERT INTO notification 
           (RecipientID, Message, Status) 
           VALUES (?, ?, 'Unread')`,
          [teacher.TeacherID, 'A new excuse letter requires your review']
        );
      }
    } else {
      // Notify all teachers who teach this student
      const [teacherRows] = await pool.execute(
        `SELECT DISTINCT ts.TeacherID 
         FROM teacherschedule ts
         JOIN studentschedule ss ON ss.ScheduleID = ts.ScheduleID
         WHERE ss.StudentID = ?`,
        [studentId]
      );

      for (const teacher of teacherRows) {
        await pool.execute(
          `INSERT INTO notification 
           (RecipientID, Message, Status) 
           VALUES (?, ?, 'Unread')`,
          [teacher.TeacherID, 'A new excuse letter requires your review']
        );
      }
    }

    return res.status(201).json({ 
      success: true, 
      data: { excuseLetterId },
      message: 'Excuse letter submitted successfully' 
    });
  } catch (error) {
    console.error('Submit excuse letter error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get excuse letter details
router.get('/excuse-letters/:excuseLetterId', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const { excuseLetterId } = req.params;
    const parentId = req.user.parentId;

    const [rows] = await pool.execute(
      `SELECT 
        el.LetterID as excuseLetterId,
        el.StudentID as studentId,
        el.ParentID as parentId,
        NULL as subjectId,
        el.DateFiled as dateFrom,
        el.DateFiled as dateTo,
        el.Reason as reason,
        el.AttachmentFile as supportingDocumentPath,
        LOWER(el.Status) as status,
        'parent' as submittedBy,
        el.ParentID as submittedByUserId,
        el.ReviewedBy as reviewedByUserId,
        NULL as reviewNotes,
        el.DateFiled as createdAt,
        el.DateFiled as updatedAt,
        el.ReviewedDate as reviewedAt,
        sr.FullName as studentName,
        sr.GradeLevel as gradeLevel,
        sec.SectionName as sectionName,
        NULL as subjectName,
        COALESCE(tr.FullName, ua.Username) as reviewedByName
      FROM excuseletter el
      JOIN studentrecord sr ON sr.StudentID = el.StudentID
      LEFT JOIN section sec ON sec.SectionID = sr.SectionID
      LEFT JOIN teacherrecord tr ON tr.UserID = el.ReviewedBy
      LEFT JOIN useraccount ua ON ua.UserID = el.ReviewedBy
      WHERE el.LetterID = ? AND el.ParentID = ?`,
      [excuseLetterId, parentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Excuse letter not found' });
    }

    const excuseLetter = rows[0];

    return res.json({ 
      success: true, 
      data: {
        excuseLetterId: excuseLetter.excuseLetterId,
        studentId: excuseLetter.studentId,
        studentName: excuseLetter.studentName,
        gradeLevel: excuseLetter.gradeLevel,
        sectionName: excuseLetter.sectionName,
        subjectId: excuseLetter.subjectId,
        subjectName: excuseLetter.subjectName,
        dateFrom: excuseLetter.dateFrom,
        dateTo: excuseLetter.dateTo,
        reason: excuseLetter.reason,
        supportingDocumentPath: excuseLetter.supportingDocumentPath,
        status: excuseLetter.status,
        submittedBy: excuseLetter.submittedBy,
        submittedByUserId: excuseLetter.submittedByUserId,
        reviewedByUserId: excuseLetter.reviewedByUserId,
        reviewedByName: excuseLetter.reviewedByName,
        reviewNotes: excuseLetter.reviewNotes,
        createdAt: excuseLetter.createdAt,
        updatedAt: excuseLetter.updatedAt,
        reviewedAt: excuseLetter.reviewedAt
      }
    });
  } catch (error) {
    console.error('Get excuse letter details error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
