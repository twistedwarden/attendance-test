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
         AND (sr.EnrollmentStatus IN ('approved','enrolled','Active'))
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
         AND (sr.EnrollmentStatus IN ('approved','enrolled','Active'))
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

// ===== REPORTS (Teacher-scoped) =====

// Get reports summary for the logged-in teacher
router.get('/reports', async (req, res) => {
  try {
    const teacherUserId = req.user.userId;
    const { period = 'week', scheduleId, gradeLevel } = req.query;

    // Optional: scope by scheduleId if provided and owned by teacher
    let subjectIdFilter = '';
    let params = [teacherUserId];
    if (scheduleId) {
      const [schedRows] = await pool.execute(
        `SELECT SubjectID FROM teacherschedule WHERE ScheduleID = ? AND TeacherID = ? LIMIT 1`,
        [Number(scheduleId), teacherUserId]
      );
      if (!Array.isArray(schedRows) || schedRows.length === 0) {
        return res.status(403).json({ success: false, message: 'You do not have access to this schedule' });
      }
      subjectIdFilter = ' AND sa.SubjectID = ?';
      params.push(schedRows[0].SubjectID);
    }

    // Date window
    let dateFilter = '';
    const now = new Date();
    const toDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const from = new Date(now);
    switch (String(period)) {
      case 'day':
      case 'today':
        // keep same day
        break;
      case 'month':
        from.setDate(from.getDate() - 30);
        break;
      case 'quarter':
        from.setDate(from.getDate() - 90);
        break;
      case 'year':
        from.setDate(from.getDate() - 365);
        break;
      case 'week':
      default:
        from.setDate(from.getDate() - 7);
        break;
    }
    const fromDate = `${from.getFullYear()}-${String(from.getMonth()+1).padStart(2,'0')}-${String(from.getDate()).padStart(2,'0')}`;
    dateFilter = ' AND sa.Date BETWEEN ? AND ?';

    // Get students under this teacher (optionally by schedule)
    let studentScopeSql = `
      SELECT DISTINCT ss.StudentID
      FROM studentschedule ss
      JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
      LEFT JOIN section sec ON sec.SectionID = ts.SectionID
      WHERE ts.TeacherID = ?`;
    const studentScopeParams = [teacherUserId];
    if (scheduleId) {
      studentScopeSql += ' AND ts.ScheduleID = ?';
      studentScopeParams.push(Number(scheduleId));
    }
    if (!scheduleId && gradeLevel) {
      studentScopeSql += ' AND sec.GradeLevel = ?';
      studentScopeParams.push(String(gradeLevel));
    }
    const [studentScopeRows] = await pool.execute(studentScopeSql, studentScopeParams);
    const studentIds = studentScopeRows.map(r => r.StudentID);

    const totalStudents = studentIds.length;
    if (totalStudents === 0) {
      return res.json({ success: true, data: { totalStudents: 0, averageAttendance: 0, perfectAttendance: 0, chronicAbsent: 0, trend: 0 } });
    }

    // Attendance stats within window
    const [attendanceRows] = await pool.execute(
      `SELECT sa.StudentID, sa.Status
       FROM subjectattendance sa
       WHERE sa.StudentID IN (${studentIds.map(() => '?').join(',')})${subjectIdFilter}${dateFilter}`,
      [...studentIds, ...(subjectIdFilter ? [params[1]] : []), fromDate, toDate]
    );

    // Compute aggregates
    const studentToHits = new Map();
    const studentToPresent = new Map();
    for (const row of attendanceRows) {
      const sid = row.StudentID;
      studentToHits.set(sid, (studentToHits.get(sid) || 0) + 1);
      if (row.Status === 'Present' || row.Status === 'Late') {
        studentToPresent.set(sid, (studentToPresent.get(sid) || 0) + 1);
      }
    }

    let sumRates = 0;
    let perfectAttendance = 0;
    let chronicAbsent = 0;
    for (const sid of studentIds) {
      const hits = studentToHits.get(sid) || 0;
      const prs = studentToPresent.get(sid) || 0;
      const rate = hits > 0 ? (prs / hits) * 100 : 0;
      sumRates += rate;
      if (hits > 0 && prs === hits) perfectAttendance += 1;
      if (hits > 0 && prs / hits <= 0.7) chronicAbsent += 1; // <=70% present considered chronic
    }

    const averageAttendance = totalStudents > 0 ? Number((sumRates / totalStudents).toFixed(1)) : 0;

    return res.json({
      success: true,
      data: {
        totalStudents,
        averageAttendance,
        perfectAttendance,
        chronicAbsent,
        trend: 0
      }
    });
  } catch (error) {
    console.error('Teacher reports error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Export teacher report as CSV
router.get('/reports/export', async (req, res) => {
  try {
    const teacherUserId = req.user.userId;
    const { label = 'attendance', period = 'week', scheduleId, gradeLevel } = req.query; // label decides dataset

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

    // Build scope
    let subjectId = null;
    if (scheduleId) {
      const [schedRows] = await pool.execute(
        `SELECT SubjectID FROM teacherschedule WHERE ScheduleID = ? AND TeacherID = ? LIMIT 1`,
        [Number(scheduleId), teacherUserId]
      );
      if (!Array.isArray(schedRows) || schedRows.length === 0) {
        return res.status(403).json({ success: false, message: 'You do not have access to this schedule' });
      }
      subjectId = schedRows[0].SubjectID;
    }

    // Date range
    const now = new Date();
    const toDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const from = new Date(now);
    switch (String(period)) {
      case 'day':
      case 'today':
        break;
      case 'month': from.setDate(from.getDate() - 30); break;
      case 'quarter': from.setDate(from.getDate() - 90); break;
      case 'year': from.setDate(from.getDate() - 365); break;
      case 'week':
      default: from.setDate(from.getDate() - 7); break;
    }
    const fromDate = `${from.getFullYear()}-${String(from.getMonth()+1).padStart(2,'0')}-${String(from.getDate()).padStart(2,'0')}`;

    // Student scope
    let studentScopeSql = `
      SELECT DISTINCT ss.StudentID, sr.FullName AS studentName, sec.SectionName AS sectionName, sec.GradeLevel AS gradeLevel
      FROM studentschedule ss
      JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
      JOIN studentrecord sr ON sr.StudentID = ss.StudentID
      LEFT JOIN section sec ON sec.SectionID = ts.SectionID
      WHERE ts.TeacherID = ?`;
    const studentScopeParams = [teacherUserId];
    if (scheduleId) {
      studentScopeSql += ' AND ts.ScheduleID = ?';
      studentScopeParams.push(Number(scheduleId));
    }
    if (!scheduleId && gradeLevel) {
      studentScopeSql += ' AND sec.GradeLevel = ?';
      studentScopeParams.push(String(gradeLevel));
    }
    const [rosterRows] = await pool.execute(studentScopeSql, studentScopeParams);
    const studentIds = rosterRows.map(r => r.StudentID);

    if (String(label) === 'student-list') {
      const header = ['studentId','studentName','sectionName','gradeLevel'];
      const rows = rosterRows.map(r => ({ studentId: r.StudentID, studentName: r.studentName, sectionName: r.sectionName || '', gradeLevel: r.gradeLevel || '' }));
      const csv = toCsv(rows, header);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="teacher-${label}-${Date.now()}.csv"`);
      return res.status(200).send(csv);
    }

    // Attendance dataset
    if (studentIds.length === 0) {
      const header = ['studentId','studentName','date','status'];
      const csv = toCsv([], header);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="teacher-${label}-${Date.now()}.csv"`);
      return res.status(200).send(csv);
    }

    const [attRows] = await pool.execute(
      `SELECT sa.StudentID as studentId, sr.FullName as studentName, sa.Date as date, sa.Status as status
       FROM subjectattendance sa
       JOIN studentrecord sr ON sr.StudentID = sa.StudentID
       WHERE sa.StudentID IN (${studentIds.map(() => '?').join(',')})
         ${subjectId ? ' AND sa.SubjectID = ?' : ''}
         AND sa.Date BETWEEN ? AND ?
       ORDER BY sa.Date DESC, sr.FullName ASC`,
      [...studentIds, ...(subjectId ? [subjectId] : []), fromDate, toDate]
    );

    const header = ['studentId','studentName','date','status'];
    const csv = toCsv(attRows, header);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="teacher-${label}-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Teacher export reports error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;

// ===== MESSAGES (Teacher -> Parent) =====

// List message recipients (parents within teacher's scope)
router.get('/messages/recipients', async (req, res) => {
  try {
    const teacherUserId = req.user.userId;

    const [rows] = await pool.execute(
      `SELECT 
         p.ParentID as parentId,
         p.FullName as parentName,
         ua.UserID as parentUserId,
         GROUP_CONCAT(DISTINCT sr.FullName ORDER BY sr.FullName SEPARATOR ', ') as studentNames
       FROM teacherschedule ts
       JOIN studentschedule ss ON ss.ScheduleID = ts.ScheduleID
       JOIN studentrecord sr ON sr.StudentID = ss.StudentID
       JOIN parent p ON p.ParentID = sr.ParentID
       JOIN useraccount ua ON ua.UserID = p.UserID
       WHERE ts.TeacherID = ?
       GROUP BY p.ParentID, p.FullName, ua.UserID
       ORDER BY p.FullName ASC`,
      [teacherUserId]
    );

    return res.json({ success: true, data: rows.map(r => ({
      parentId: r.parentId,
      parentUserId: r.parentUserId,
      parentName: r.parentName,
      studentNames: (r.studentNames || '').split(', ').filter(Boolean)
    }))});
  } catch (error) {
    console.error('Teacher list message recipients error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Helper to build a tagged message so we can query teacher-sent items
const buildTaggedMessage = ({ teacherId, parentId = null, studentId = null, type = 'general', message }) => {
  const safeType = String(type || 'general').toLowerCase();
  return `[TEACHER_MSG:${teacherId}:${parentId ?? 'null'}:${studentId ?? 'null'}:${safeType}] ${message}`;
};

// Parse tagged message header
const parseTaggedMessage = (text = '') => {
  const match = text.match(/^\[TEACHER_MSG:(\d+):(\d+|null):(\d+|null):([a-z]+)]\s*(.*)$/i);
  if (!match) return null;
  const [, teacherId, parentId, studentId, type, body] = match;
  return {
    teacherId: Number(teacherId),
    parentId: parentId === 'null' ? null : Number(parentId),
    studentId: studentId === 'null' ? null : Number(studentId),
    type: (type || 'general').toLowerCase(),
    body: body || ''
  };
};

// List conversation messages for this teacher (outgoing and incoming)
router.get('/messages', async (req, res) => {
  try {
    const teacherUserId = req.user.userId;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);

    // Outgoing (teacher -> parent)
    const [outRows] = await pool.execute(
      `SELECT NotificationID as id, RecipientID as recipientUserId, DateSent as dateSent, Message as message, Status as status
       FROM notification
       WHERE Message LIKE ?
       ORDER BY DateSent DESC
       LIMIT ?`,
      [ `%[TEACHER_MSG:${teacherUserId}:%`, limit ]
    );

    // Incoming (parent -> teacher) to this teacher user
    const [inRows] = await pool.execute(
      `SELECT NotificationID as id, RecipientID as recipientUserId, DateSent as dateSent, Message as message, Status as status
       FROM notification
       WHERE RecipientID = ? AND Message LIKE '[PARENT_MSG:%'
       ORDER BY DateSent DESC
       LIMIT ?`,
      [ teacherUserId, limit ]
    );

    const items = [];

    // Parse teacher -> parent items
    for (const r of outRows) {
      const meta = parseTaggedMessage(r.message);
      let parentName = null;
      let studentName = null;
      if (meta?.parentId) {
        const [p] = await pool.execute(`SELECT FullName FROM parent WHERE ParentID = ?`, [meta.parentId]);
        if (Array.isArray(p) && p.length > 0) parentName = p[0].FullName;
      }
      if (meta?.studentId) {
        const [s] = await pool.execute(`SELECT FullName FROM studentrecord WHERE StudentID = ?`, [meta.studentId]);
        if (Array.isArray(s) && s.length > 0) studentName = s[0].FullName;
      }
      items.push({
        id: r.id,
        direction: 'out',
        dateSent: r.dateSent,
        status: r.status?.toLowerCase() === 'read' ? 'read' : 'sent',
        type: meta?.type || 'general',
        parentName,
        studentName,
        message: meta?.body || r.message
      });
    }

    // Parse parent -> teacher items
    for (const r of inRows) {
      const match = r.message.match(/^\[PARENT_MSG:(\d+):(\d+|null):(\d+|null):([a-z]+)]\s*(.*)$/i);
      let parentName = null;
      let studentName = null;
      let type = 'general';
      let body = r.message;
      if (match) {
        const [, parentUserIdStr, parentIdStr, studentIdStr, t, b] = match;
        type = (t || 'general').toLowerCase();
        body = b || '';
        if (parentIdStr && parentIdStr !== 'null') {
          const [p] = await pool.execute(`SELECT FullName FROM parent WHERE ParentID = ?`, [Number(parentIdStr)]);
          if (Array.isArray(p) && p.length > 0) parentName = p[0].FullName;
        }
        if (studentIdStr && studentIdStr !== 'null') {
          const [s] = await pool.execute(`SELECT FullName FROM studentrecord WHERE StudentID = ?`, [Number(studentIdStr)]);
          if (Array.isArray(s) && s.length > 0) studentName = s[0].FullName;
        }
      }
      items.push({
        id: r.id,
        direction: 'in',
        dateSent: r.dateSent,
        status: r.status?.toLowerCase() === 'read' ? 'read' : 'sent',
        type,
        parentName,
        studentName,
        message: body
      });
    }

    // Sort combined list by date desc and cap to limit
    items.sort((a, b) => new Date(b.dateSent) - new Date(a.dateSent));
    return res.json({ success: true, data: items.slice(0, limit) });
  } catch (error) {
    console.error('Teacher list messages error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Send message to a parent
router.post('/messages', async (req, res) => {
  try {
    const teacherUserId = req.user.userId;
    const { parentId, parentUserId, studentId, type = 'general', message } = req.body || {};

    if (!message || String(message).trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Determine parent and their user id
    let resolvedParentId = parentId ? Number(parentId) : null;
    let resolvedParentUserId = parentUserId ? Number(parentUserId) : null;

    if (!resolvedParentId && studentId) {
      // Resolve parent from student
      const [rows] = await pool.execute(`SELECT ParentID FROM studentrecord WHERE StudentID = ? LIMIT 1`, [Number(studentId)]);
      if (!Array.isArray(rows) || rows.length === 0 || !rows[0].ParentID) {
        return res.status(400).json({ success: false, message: 'Unable to resolve parent for student' });
      }
      resolvedParentId = rows[0].ParentID;
    }

    if (!resolvedParentUserId && resolvedParentId) {
      const [rows] = await pool.execute(`SELECT UserID FROM parent WHERE ParentID = ? LIMIT 1`, [resolvedParentId]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Parent user not found' });
      }
      resolvedParentUserId = rows[0].UserID;
    }

    if (!resolvedParentUserId) {
      return res.status(400).json({ success: false, message: 'parentId, parentUserId or studentId required' });
    }

    // Validate teacher teaches this student or has this parent in scope
    if (studentId) {
      const [rows] = await pool.execute(
        `SELECT 1
         FROM teacherschedule ts
         JOIN studentschedule ss ON ss.ScheduleID = ts.ScheduleID
         WHERE ts.TeacherID = ? AND ss.StudentID = ?
         LIMIT 1`,
        [teacherUserId, Number(studentId)]
      );
      if (rows.length === 0) {
        return res.status(403).json({ success: false, message: 'You do not teach this student' });
      }
    } else if (resolvedParentId) {
      const [rows] = await pool.execute(
        `SELECT 1
         FROM teacherschedule ts
         JOIN studentschedule ss ON ss.ScheduleID = ts.ScheduleID
         JOIN studentrecord sr ON sr.StudentID = ss.StudentID
         WHERE ts.TeacherID = ? AND sr.ParentID = ?
         LIMIT 1`,
        [teacherUserId, resolvedParentId]
      );
      if (rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Parent is not within your student roster' });
      }
    }

    const tagged = buildTaggedMessage({
      teacherId: teacherUserId,
      parentId: resolvedParentId,
      studentId: studentId ? Number(studentId) : null,
      type,
      message: String(message).trim()
    });

    await pool.execute(
      `INSERT INTO notification (RecipientID, Message, Status) VALUES (?, ?, 'Unread')`,
      [resolvedParentUserId, tagged]
    );

    return res.status(201).json({ success: true, message: 'Message sent' });
  } catch (error) {
    console.error('Teacher send message error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

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
         p.ContactInfo as parentContact,
         ua.Username as parentEmail
       FROM studentrecord sr
       LEFT JOIN section sec ON sec.SectionID = sr.SectionID
       LEFT JOIN parent p ON p.ParentID = sr.ParentID
       LEFT JOIN useraccount ua ON ua.UserID = p.UserID
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

// ===== EXCUSE LETTER ROUTES =====

// Get excuse letters for teacher's students
router.get('/excuse-letters', async (req, res) => {
  try {
    const teacherUserId = req.user.userId;
    const { studentId, status, subjectId, limit = 50 } = req.query;

    // Sanitize inputs
    const safeLimit = Math.min(
      Math.max(parseInt(String(limit), 10) || 50, 1),
      200
    );
    const safeStudentId = studentId ? Number(studentId) : null;
    const safeSubjectId = subjectId ? Number(subjectId) : null;

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
        p.FullName as parentName,
        p.ContactInfo as parentContact,
        COALESCE(tr.FullName, ua.Username) as reviewedByName
      FROM excuseletter el
      JOIN studentrecord sr ON sr.StudentID = el.StudentID
      LEFT JOIN section sec ON sec.SectionID = sr.SectionID
      LEFT JOIN parent p ON p.ParentID = el.ParentID
      LEFT JOIN teacherrecord tr ON tr.UserID = el.ReviewedBy
      LEFT JOIN useraccount ua ON ua.UserID = el.ReviewedBy
      WHERE el.StudentID IN (
        SELECT DISTINCT ss.StudentID 
        FROM studentschedule ss
        JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
        WHERE ts.TeacherID = ?
      )
    `;

    const params = [teacherUserId];

    if (safeStudentId) {
      query += ' AND el.StudentID = ?';
      params.push(safeStudentId);
    }

    if (status && status !== 'all') {
      query += ' AND LOWER(el.Status) = ?';
      params.push(status.toLowerCase());
    }

    if (safeSubjectId) {
      query += ' AND el.SubjectID = ?';
      params.push(safeSubjectId);
    }

    // Inline LIMIT because some MySQL versions/connectors disallow parameter binding for LIMIT
    query += ` ORDER BY el.DateFiled DESC LIMIT ${safeLimit}`;

    const [rows] = await pool.execute(query, params);

    const excuseLetters = rows.map(letter => ({
      excuseLetterId: letter.excuseLetterId,
      studentId: letter.studentId,
      studentName: letter.studentName,
      gradeLevel: letter.gradeLevel,
      sectionName: letter.sectionName,
      subjectId: letter.subjectId,
      subjectName: letter.subjectName,
      parentName: letter.parentName,
      parentContact: letter.parentContact,
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

// Get excuse letter details
router.get('/excuse-letters/:excuseLetterId', async (req, res) => {
  try {
    const { excuseLetterId } = req.params;
    const teacherUserId = req.user.userId;

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
        p.FullName as parentName,
        p.ContactInfo as parentContact,
        COALESCE(tr.FullName, ua.Username) as reviewedByName
      FROM excuseletter el
      JOIN studentrecord sr ON sr.StudentID = el.StudentID
      LEFT JOIN section sec ON sec.SectionID = sr.SectionID
      LEFT JOIN parent p ON p.ParentID = el.ParentID
      LEFT JOIN teacherrecord tr ON tr.UserID = el.ReviewedBy
      LEFT JOIN useraccount ua ON ua.UserID = el.ReviewedBy
      WHERE el.LetterID = ? AND el.StudentID IN (
        SELECT DISTINCT ss.StudentID 
        FROM studentschedule ss
        JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
        WHERE ts.TeacherID = ?
      )`,
      [excuseLetterId, teacherUserId]
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
        parentName: excuseLetter.parentName,
        parentContact: excuseLetter.parentContact,
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

// Review excuse letter (approve/decline)
router.post('/excuse-letters/:excuseLetterId/review', async (req, res) => {
  try {
    const { excuseLetterId } = req.params;
    const teacherUserId = req.user.userId;
    const { status, reviewNotes } = req.body;

    if (!status || !['approved', 'declined'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status must be either "approved" or "declined"' 
      });
    }

    // Verify the teacher has access to this excuse letter
    const [verifyRows] = await pool.execute(
      `SELECT el.LetterID, el.StudentID, el.Status
       FROM excuseletter el
       WHERE el.LetterID = ? AND el.StudentID IN (
         SELECT DISTINCT ss.StudentID 
         FROM studentschedule ss
         JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
         WHERE ts.TeacherID = ?
       )`,
      [excuseLetterId, teacherUserId]
    );

    if (verifyRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Excuse letter not found' });
    }

    if (verifyRows[0].Status.toLowerCase() !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Excuse letter has already been reviewed' 
      });
    }

    // Map our status to the existing enum values
    const dbStatus = status === 'approved' ? 'Approved' : 'Rejected';

    // Update excuse letter using existing table structure
    await pool.execute(
      `UPDATE excuseletter 
       SET Status = ?, ReviewedBy = ?, ReviewedDate = NOW()
       WHERE LetterID = ?`,
      [dbStatus, teacherUserId, excuseLetterId]
    );

    // Create notification for parent using existing notification table
    await pool.execute(
      `INSERT INTO notification 
       (RecipientID, Message, Status) 
       SELECT p.UserID, ?, 'Unread'
       FROM excuseletter el
       JOIN parent p ON p.ParentID = el.ParentID
       WHERE el.LetterID = ?`,
      [`Your excuse letter has been ${status}`, excuseLetterId]
    );

    // If approved, update related attendance records
    if (status === 'approved') {
      const studentId = verifyRows[0].StudentID;
      
      // Get the excuse letter details
      const [excuseDetails] = await pool.execute(
        `SELECT DateFiled FROM excuseletter WHERE LetterID = ?`,
        [excuseLetterId]
      );

      if (excuseDetails.length > 0) {
        const { DateFiled } = excuseDetails[0];
        
        // Update all subject attendance records for the date
        await pool.execute(
          `UPDATE subjectattendance 
           SET Status = 'Excused' 
           WHERE StudentID = ? AND Date = ? AND Status = 'Absent'`,
          [studentId, DateFiled]
        );
      }
    }

    return res.json({ 
      success: true, 
      message: `Excuse letter ${status} successfully` 
    });
  } catch (error) {
    console.error('Review excuse letter error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Submit excuse letter (for teachers)
router.post('/excuse-letters', async (req, res) => {
  try {
    const teacherUserId = req.user.userId;
    const { studentId, subjectId, dateFrom, dateTo, reason, supportingDocumentPath } = req.body;

    // Validate required fields
    if (!studentId || !dateFrom || !dateTo || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID, date from, date to, and reason are required' 
      });
    }

    // Verify the teacher has access to this student
    const [studentCheck] = await pool.execute(
      `SELECT sr.StudentID, sr.ParentID
       FROM studentrecord sr
       JOIN studentschedule ss ON ss.StudentID = sr.StudentID
       JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
       WHERE sr.StudentID = ? AND ts.TeacherID = ?`,
      [studentId, teacherUserId]
    );

    if (studentCheck.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this student' });
    }

    const parentId = studentCheck[0].ParentID;

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

    // Create notification for parent using existing notification table
    await pool.execute(
      `INSERT INTO notification 
       (RecipientID, Message, Status) 
       VALUES (?, ?, 'Unread')`,
      [parentId, 'A new excuse letter has been submitted for your child']
    );

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


