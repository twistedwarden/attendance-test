import express from 'express';
import { authenticateToken, requireTeacher } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();

// All routes here require an authenticated teacher (or admin acting as teacher)
router.use(authenticateToken, requireTeacher);

// Get schedules for the logged-in teacher
router.get('/schedules', async (req, res) => {
  try {
    const teacherUserId = req.user.userId;
    const [rows] = await pool.execute(
      `SELECT 
         ts.ScheduleID AS id,
         ts.TeacherID AS teacherId,
         ts.SectionID AS sectionId,
         sec.SectionName AS sectionName,
         sec.GradeLevel AS gradeLevel,
         ts.TimeIn AS startTime,
         ts.TimeOut AS endTime,
         ts.DayOfWeek AS dayOfWeek,
         ts.GracePeriod AS gracePeriod,
         s.SubjectID AS subjectId,
         s.SubjectName AS subjectName
       FROM teacherschedule ts
       LEFT JOIN section sec ON sec.SectionID = ts.SectionID
       LEFT JOIN subject s ON s.SubjectID = ts.SubjectID
       WHERE ts.TeacherID = ?
       ORDER BY FIELD(ts.DayOfWeek,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), ts.TimeIn`,
      [teacherUserId]
    );

    const data = rows.map(r => ({
      id: r.id,
      teacherId: r.teacherId,
      sectionId: r.sectionId,
      sectionName: r.sectionName || null,
      gradeLevel: r.gradeLevel || null,
      startTime: (r.startTime || '').toString().slice(0,5),
      endTime: (r.endTime || '').toString().slice(0,5),
      dayOfWeek: r.dayOfWeek,
      gracePeriod: r.gracePeriod ?? 15,
      subjectId: r.subjectId,
      subjectName: r.subjectName || 'Subject'
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Teacher get schedules error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get students for a specific schedule of this teacher
router.get('/students', async (req, res) => {
  try {
    const teacherUserId = req.user.userId;
    const scheduleId = Number(req.query.scheduleId);
    if (!scheduleId) {
      return res.status(400).json({ success: false, message: 'scheduleId is required' });
    }

    // Verify schedule belongs to teacher
    const [schedRows] = await pool.execute('SELECT ScheduleID FROM teacherschedule WHERE ScheduleID = ? AND TeacherID = ? LIMIT 1', [scheduleId, teacherUserId]);
    if (!Array.isArray(schedRows) || schedRows.length === 0) {
      return res.status(403).json({ success: false, message: 'You do not have access to this schedule' });
    }

    const [rows] = await pool.execute(
      `SELECT 
         ss.StudentScheduleID as id,
         sr.StudentID as studentId,
         sr.FullName as studentName,
         sr.GradeLevel as gradeLevel,
         sec.SectionName as sectionName
       FROM studentschedule ss
       LEFT JOIN studentrecord sr ON sr.StudentID = ss.StudentID
       LEFT JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
       LEFT JOIN section sec ON sec.SectionID = ts.SectionID
       WHERE ss.ScheduleID = ?
       ORDER BY sr.FullName`,
      [scheduleId]
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Teacher get students error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get subject attendance for a schedule and date (per student)
router.get('/subject-attendance', async (req, res) => {
  try {
    const teacherUserId = req.user.userId;
    const scheduleId = Number(req.query.scheduleId);
    const date = (req.query.date || '').toString();
    if (!scheduleId || !date) {
      return res.status(400).json({ success: false, message: 'scheduleId and date are required' });
    }

    // Validate schedule ownership and obtain subject id
    const [schedRows] = await pool.execute(
      `SELECT ScheduleID, SubjectID FROM teacherschedule WHERE ScheduleID = ? AND TeacherID = ? LIMIT 1`,
      [scheduleId, teacherUserId]
    );
    if (!Array.isArray(schedRows) || schedRows.length === 0) {
      return res.status(403).json({ success: false, message: 'You do not have access to this schedule' });
    }
    const subjectId = schedRows[0].SubjectID;

    // List students under this schedule with their attendance (if any) for the date
    const [rows] = await pool.execute(
      `SELECT 
         sr.StudentID as studentId,
         sr.FullName as studentName,
         sec.SectionName as sectionName,
         sa.SubjectAttendanceID as subjectAttendanceId,
         sa.Status as status
       FROM studentschedule ss
       LEFT JOIN studentrecord sr ON sr.StudentID = ss.StudentID
       LEFT JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
       LEFT JOIN section sec ON sec.SectionID = ts.SectionID
       LEFT JOIN subjectattendance sa 
         ON sa.StudentID = ss.StudentID AND sa.SubjectID = ts.SubjectID AND sa.Date = ?
       WHERE ss.ScheduleID = ?
       ORDER BY sr.FullName`,
      [date, scheduleId]
    );

    return res.json({ success: true, data: rows.map(r => ({
      studentId: r.studentId,
      studentName: r.studentName,
      sectionName: r.sectionName,
      subjectAttendanceId: r.subjectAttendanceId || null,
      status: r.status || null,
      subjectId,
      date
    })) });
  } catch (error) {
    console.error('Teacher get subject attendance error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Upsert subject attendance for a student under this teacher's schedule
router.post('/subject-attendance', async (req, res) => {
  try {
    const teacherUserId = req.user.userId;
    const { scheduleId, studentId, date, status } = req.body || {};
    if (!scheduleId || !studentId || !date || !status) {
      return res.status(400).json({ success: false, message: 'scheduleId, studentId, date, status are required' });
    }
    if (!['Present','Late','Excused','Absent'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Validate schedule ownership and obtain subject id
    const [schedRows] = await pool.execute(
      `SELECT ScheduleID, SubjectID FROM teacherschedule WHERE ScheduleID = ? AND TeacherID = ? LIMIT 1`,
      [Number(scheduleId), teacherUserId]
    );
    if (!Array.isArray(schedRows) || schedRows.length === 0) {
      return res.status(403).json({ success: false, message: 'You do not have access to this schedule' });
    }
    const subjectId = schedRows[0].SubjectID;

    // Ensure the student is assigned to this schedule
    const [assignRows] = await pool.execute(
      `SELECT StudentScheduleID FROM studentschedule WHERE ScheduleID = ? AND StudentID = ? LIMIT 1`,
      [Number(scheduleId), Number(studentId)]
    );
    if (!Array.isArray(assignRows) || assignRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Student is not assigned to this schedule' });
    }

    // Upsert attendance
    const [existingRows] = await pool.execute(
      `SELECT SubjectAttendanceID FROM subjectattendance WHERE StudentID = ? AND SubjectID = ? AND Date = ? LIMIT 1`,
      [Number(studentId), Number(subjectId), date]
    );

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      // Update
      await pool.execute(
        `UPDATE subjectattendance SET Status = ?, ValidatedBy = ? WHERE SubjectAttendanceID = ?`,
        [status, teacherUserId, existingRows[0].SubjectAttendanceID]
      );
      return res.json({ success: true, data: { subjectAttendanceId: existingRows[0].SubjectAttendanceID, status } });
    }

    // Insert
    const [ins] = await pool.execute(
      `INSERT INTO subjectattendance (StudentID, SubjectID, Date, Status, ValidatedBy) VALUES (?, ?, ?, ?, ?)`,
      [Number(studentId), Number(subjectId), date, status, teacherUserId]
    );
    return res.status(201).json({ success: true, data: { subjectAttendanceId: ins.insertId, status } });
  } catch (error) {
    console.error('Teacher upsert subject attendance error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;

// Get detailed student info (personal, parent, section) and attendance for this teacher's schedule
router.get('/student-details', async (req, res) => {
  try {
    const teacherUserId = req.user.userId;
    const studentId = Number(req.query.studentId);
    const scheduleId = Number(req.query.scheduleId);
    const dateFrom = req.query.dateFrom ? String(req.query.dateFrom) : null;
    const dateTo = req.query.dateTo ? String(req.query.dateTo) : null;

    if (!studentId || !scheduleId) {
      return res.status(400).json({ success: false, message: 'studentId and scheduleId are required' });
    }

    // Validate schedule ownership and obtain subject id
    const [schedRows] = await pool.execute(
      `SELECT ScheduleID, SubjectID FROM teacherschedule WHERE ScheduleID = ? AND TeacherID = ? LIMIT 1`,
      [scheduleId, teacherUserId]
    );
    if (!Array.isArray(schedRows) || schedRows.length === 0) {
      return res.status(403).json({ success: false, message: 'You do not have access to this schedule' });
    }
    const subjectId = schedRows[0].SubjectID;

    // Ensure the student is assigned to this schedule
    const [assignRows] = await pool.execute(
      `SELECT StudentScheduleID FROM studentschedule WHERE ScheduleID = ? AND StudentID = ? LIMIT 1`,
      [scheduleId, studentId]
    );
    if (!Array.isArray(assignRows) || assignRows.length === 0) {
      return res.status(403).json({ success: false, message: 'Student is not assigned to this schedule' });
    }

    // Get student personal + parent + section info
    const [infoRows] = await pool.execute(
      `SELECT 
         sr.StudentID as studentId,
         sr.FullName as fullName,
         sr.Gender as gender,
         sr.DateOfBirth as dateOfBirth,
         sr.Address as address,
         sr.GradeLevel as gradeLevel,
         sr.SectionID as sectionId,
         sec.SectionName as sectionName,
         p.ParentID as parentId,
         p.FullName as parentName,
         p.ContactInfo as parentContact
       FROM studentrecord sr
       LEFT JOIN section sec ON sec.SectionID = sr.SectionID
       LEFT JOIN parent p ON p.ParentID = sr.ParentID
       WHERE sr.StudentID = ?
       LIMIT 1`,
      [studentId]
    );

    const student = infoRows[0] || null;
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Attendance for this subject (optionally filtered by date range)
    let attendanceSql = `
      SELECT SubjectAttendanceID as id, Date as date, Status as status, ValidatedBy as validatedBy
      FROM subjectattendance
      WHERE StudentID = ? AND SubjectID = ?`;
    const params = [studentId, subjectId];
    if (dateFrom) {
      attendanceSql += ' AND Date >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      attendanceSql += ' AND Date <= ?';
      params.push(dateTo);
    }
    attendanceSql += ' ORDER BY Date DESC LIMIT 60';

    const [attendanceRows] = await pool.execute(attendanceSql, params);

    return res.json({
      success: true,
      data: {
        student,
        subject: { subjectId, scheduleId },
        attendance: attendanceRows
      }
    });
  } catch (error) {
    console.error('Teacher get student details error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


