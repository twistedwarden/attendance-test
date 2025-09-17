import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { pool } from '../config/database.js';

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

export default router;
