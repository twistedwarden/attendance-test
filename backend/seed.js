import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const getPool = async () => {
	return mysql.createPool({
		host: process.env.DB_HOST || 'localhost',
		port: process.env.DB_PORT || 3306,
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME || 'attendance',
		waitForConnections: true,
		connectionLimit: 10,
	});
};

const ensureDatabase = async (pool) => {
	// No-op: schema should already exist via v1.sql/setup, but we ensure minimal tables
	await pool.query('SELECT 1');
};

const hasColumn = async (pool, table, column) => {
	const db = process.env.DB_NAME || 'attendance';
	const [rows] = await pool.query(
		`SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
		[db, table, column]
	);
	return rows.length > 0;
};

const tableExists = async (pool, table) => {
	const db = process.env.DB_NAME || 'attendance';
	const [rows] = await pool.query(
		`SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
		[db, table]
	);
	return rows.length > 0;
};

const countRows = async (pool, table) => {
	const [rows] = await pool.query(`SELECT COUNT(*) as c FROM \`${table}\``);
	return rows[0].c || 0;
};

const insertUsers = async (pool) => {
	const usersToCreate = [
		{ Username: 'admin@foothills.edu', Password: 'admin123', Role: 'Admin', Status: 'Active' },
		{ Username: 'registrar@foothills.edu', Password: 'registrar123', Role: 'Registrar', Status: 'Active' },
		{ Username: 'sarah.johnson@foothills.edu', Password: 'teacher123', Role: 'Teacher', Status: 'Active' },
		{ Username: 'michael.chen@foothills.edu', Password: 'teacher123', Role: 'Teacher', Status: 'Active' },
		{ Username: 'emily.davis@foothills.edu', Password: 'teacher123', Role: 'Teacher', Status: 'Active' },
		{ Username: 'parent.ava@example.com', Password: 'parent123', Role: 'Parent', Status: 'Active' },
		{ Username: 'parent.liam@example.com', Password: 'parent123', Role: 'Parent', Status: 'Active' },
		{ Username: 'parent.noah@example.com', Password: 'parent123', Role: 'Parent', Status: 'Active' },
		{ Username: 'parent.sophia@example.com', Password: 'parent123', Role: 'Parent', Status: 'Active' },
	];

	const hasStatus = await hasColumn(pool, 'useraccount', 'Status');

	const createdIds = {};
	for (const u of usersToCreate) {
		const [existing] = await pool.query('SELECT UserID FROM useraccount WHERE Username = ?', [u.Username]);
		if (existing.length > 0) {
			createdIds[u.Username] = existing[0].UserID;
			continue;
		}
		const hash = await bcrypt.hash(u.Password, 10);
		let query, params;
		if (hasStatus) {
			query = 'INSERT INTO useraccount (Username, PasswordHash, Role, Status) VALUES (?, ?, ?, ?)';
			params = [u.Username, hash, u.Role, u.Status];
		} else {
			query = 'INSERT INTO useraccount (Username, PasswordHash, Role) VALUES (?, ?, ?)';
			params = [u.Username, hash, u.Role];
		}
		const [res] = await pool.query(query, params);
		createdIds[u.Username] = res.insertId;
	}
	return createdIds;
};

const insertParents = async (pool, userIds) => {
	const parents = [
		{ FullName: 'Alice Johnson', ContactInfo: '+1 (555) 123-4567', userKey: 'parent.ava@example.com' },
		{ FullName: 'Bob Chen', ContactInfo: '+1 (555) 234-5678', userKey: 'parent.liam@example.com' },
		{ FullName: 'Nora Davis', ContactInfo: '+1 (555) 345-6789', userKey: 'parent.noah@example.com' },
		{ FullName: 'Susan Brown', ContactInfo: '+1 (555) 456-7890', userKey: 'parent.sophia@example.com' },
	];
	const parentIds = {};
	for (const p of parents) {
		const userId = userIds[p.userKey];
		const [existing] = await pool.query('SELECT ParentID FROM parent WHERE UserID = ?', [userId]);
		if (existing.length > 0) {
			parentIds[p.userKey] = existing[0].ParentID;
			continue;
		}
		const [res] = await pool.query(
			'INSERT INTO parent (FullName, ContactInfo, UserID) VALUES (?, ?, ?)',
			[p.FullName, p.ContactInfo, userId]
		);
		parentIds[p.userKey] = res.insertId;
	}
	return parentIds;
};

const insertStudents = async (pool, createdByUserId, parentIds) => {
	const students = [
		{ FullName: 'Ava Johnson', GradeLevel: '1', Section: 'A', ParentKey: 'parent.ava@example.com' },
		{ FullName: 'Liam Chen', GradeLevel: '2', Section: 'B', ParentKey: 'parent.liam@example.com' },
		{ FullName: 'Noah Davis', GradeLevel: '3', Section: 'A', ParentKey: 'parent.noah@example.com' },
		{ FullName: 'Sophia Brown', GradeLevel: '4', Section: 'C', ParentKey: 'parent.sophia@example.com' },
	];
	const studentIds = {};
	const hasCreatedBy = await hasColumn(pool, 'studentrecord', 'CreatedBy');
	const hasFingerprint = await hasColumn(pool, 'studentrecord', 'FingerprintTemplate');
	const hasParentIdCol = await hasColumn(pool, 'studentrecord', 'ParentID');
	const hasParentContactCol = await hasColumn(pool, 'studentrecord', 'ParentContact');
	const dummyTemplate = Buffer.from('');
	for (const s of students) {
		const [existing] = await pool.query('SELECT StudentID FROM studentrecord WHERE FullName = ? AND GradeLevel = ? AND Section = ?', [s.FullName, s.GradeLevel, s.Section]);
		if (existing.length > 0) {
			studentIds[s.FullName] = existing[0].StudentID;
			// Also try to backfill ParentID if column exists and currently NULL
			if (hasParentIdCol && parentIds[s.ParentKey]) {
				await pool.query('UPDATE studentrecord SET ParentID = ? WHERE FullName = ? AND GradeLevel = ? AND Section = ? AND (ParentID IS NULL OR ParentID = 0)', [parentIds[s.ParentKey], s.FullName, s.GradeLevel, s.Section]);
			}
			continue;
		}
		const parentId = s.ParentKey ? parentIds[s.ParentKey] || null : null;
		const cols = ['FullName', 'GradeLevel', 'Section'];
		const vals = [s.FullName, s.GradeLevel, s.Section];
		if (hasFingerprint) { cols.push('FingerprintTemplate'); vals.push(dummyTemplate); }
		if (hasParentIdCol) { cols.push('ParentID'); vals.push(parentId); }
		if (hasParentContactCol && !hasParentIdCol) { cols.push('ParentContact'); vals.push(null); }
		if (hasCreatedBy) { cols.push('CreatedBy'); vals.push(createdByUserId); }
		const placeholders = cols.map(() => '?').join(', ');
		const query = `INSERT INTO studentrecord (${cols.join(', ')}) VALUES (${placeholders})`;
		const [res] = await pool.query(query, vals);
		studentIds[s.FullName] = res.insertId;
	}
	return studentIds;
};

const insertSubjects = async (pool) => {
	const subjects = [
		{ SubjectName: 'Mathematics', Description: 'Numbers and problem solving' },
		{ SubjectName: 'Science', Description: 'Experiments and discovery' },
		{ SubjectName: 'English', Description: 'Reading and writing' },
	];
	const subjectIds = {};
	for (const s of subjects) {
		const [existing] = await pool.query('SELECT SubjectID FROM subject WHERE SubjectName = ?', [s.SubjectName]);
		if (existing.length > 0) {
			subjectIds[s.SubjectName] = existing[0].SubjectID;
			continue;
		}
		const [res] = await pool.query('INSERT INTO subject (SubjectName, Description) VALUES (?, ?)', [s.SubjectName, s.Description]);
		subjectIds[s.SubjectName] = res.insertId;
	}
	return subjectIds;
};

const insertTeacherSchedules = async (pool, userIds, subjectIds) => {
	const teacherMap = {
		'sarah.johnson@foothills.edu': { GradeLevel: '1', Section: 'A', Subject: 'Mathematics', TimeIn: '08:00:00', TimeOut: '09:00:00', DayOfWeek: 'Mon' },
		'michael.chen@foothills.edu': { GradeLevel: '2', Section: 'B', Subject: 'Science', TimeIn: '09:00:00', TimeOut: '10:00:00', DayOfWeek: 'Tue' },
		'emily.davis@foothills.edu': { GradeLevel: '3', Section: 'A', Subject: 'English', TimeIn: '10:00:00', TimeOut: '11:00:00', DayOfWeek: 'Wed' },
	};
	const scheduleIds = {};
	for (const [email, sched] of Object.entries(teacherMap)) {
		const teacherId = userIds[email];
		const subjectId = subjectIds[sched.Subject];
		const [existing] = await pool.query('SELECT ScheduleID FROM teacherschedule WHERE TeacherID = ? AND SubjectID = ? AND DayOfWeek = ?', [teacherId, subjectId, sched.DayOfWeek]);
		if (existing.length > 0) {
			scheduleIds[email] = existing[0].ScheduleID;
			continue;
		}
		const [res] = await pool.query(
			'INSERT INTO teacherschedule (TeacherID, SubjectID, GradeLevel, Section, TimeIn, TimeOut, DayOfWeek) VALUES (?, ?, ?, ?, ?, ?, ?)',
			[teacherId, subjectId, sched.GradeLevel, sched.Section, sched.TimeIn, sched.TimeOut, sched.DayOfWeek]
		);
		scheduleIds[email] = res.insertId;
	}
	return scheduleIds;
};

const insertStudentSubjects = async (pool, studentIds, userIds, subjectIds) => {
	const mappings = [
		{ student: 'Ava Johnson', subject: 'Mathematics', teacher: 'sarah.johnson@foothills.edu' },
		{ student: 'Liam Chen', subject: 'Science', teacher: 'michael.chen@foothills.edu' },
		{ student: 'Noah Davis', subject: 'English', teacher: 'emily.davis@foothills.edu' },
	];
	for (const m of mappings) {
		const studentId = studentIds[m.student];
		const subjectId = subjectIds[m.subject];
		const teacherId = userIds[m.teacher];
		const [exists] = await pool.query('SELECT 1 FROM studentsubject WHERE StudentID = ? AND SubjectID = ? AND TeacherID = ? LIMIT 1', [studentId, subjectId, teacherId]);
		if (exists.length === 0) {
			await pool.query('INSERT INTO studentsubject (StudentID, SubjectID, TeacherID) VALUES (?, ?, ?)', [studentId, subjectId, teacherId]);
		}
	}
};

const insertAttendanceLogs = async (pool, studentIds, validatorUserId) => {
	const today = new Date();
	const fmt = (d) => d.toISOString().slice(0, 10);
	const logs = [
		{ student: 'Ava Johnson', Date: fmt(today), TimeIn: '08:05:00', TimeOut: '15:00:00', Status: 'Present' },
		{ student: 'Liam Chen', Date: fmt(today), TimeIn: null, TimeOut: null, Status: 'Absent' },
		{ student: 'Noah Davis', Date: fmt(today), TimeIn: '08:25:00', TimeOut: '15:00:00', Status: 'Late' },
	];
	for (const l of logs) {
		const id = studentIds[l.student];
		const [exists] = await pool.query('SELECT 1 FROM attendancelog WHERE StudentID = ? AND Date = ? LIMIT 1', [id, l.Date]);
		if (exists.length === 0) {
			await pool.query(
				'INSERT INTO attendancelog (StudentID, Date, TimeIn, TimeOut, Status, ValidatedBy) VALUES (?, ?, ?, ?, ?, ?)',
				[id, l.Date, l.TimeIn, l.TimeOut, l.Status, validatorUserId]
			);
		}
	}
};

const insertExcuseLetters = async (pool, studentIds, reviewerUserId, parentIds) => {
	const hasParentIdCol = await hasColumn(pool, 'excuseletter', 'ParentID');
	const hasReviewedByCol = await hasColumn(pool, 'excuseletter', 'ReviewedBy');
	const hasReviewedDateCol = await hasColumn(pool, 'excuseletter', 'ReviewedDate');
	const hasAttachmentCol = await hasColumn(pool, 'excuseletter', 'AttachmentFile');
	const hasStatusCol = await hasColumn(pool, 'excuseletter', 'Status');
	const letters = [
		{ student: 'Liam Chen', reason: 'Medical appointment', status: 'Pending', parentKey: 'parent.liam@example.com' },
		{ student: 'Noah Davis', reason: 'Family emergency', status: 'Approved', parentKey: 'parent.noah@example.com' },
	];
	for (const e of letters) {
		const sId = studentIds[e.student];
		const [exists] = await pool.query('SELECT 1 FROM excuseletter WHERE StudentID = ? AND Reason = ? LIMIT 1', [sId, e.reason]);
		if (exists.length === 0) {
			const cols = ['StudentID', 'DateFiled', 'Reason'];
			const vals = [sId, new Date().toISOString().slice(0,10), e.reason];
			if (hasAttachmentCol) { cols.push('AttachmentFile'); vals.push(null); }
			if (hasStatusCol) { cols.push('Status'); vals.push(e.status); }
			if (hasParentIdCol) { cols.push('ParentID'); vals.push(e.parentKey ? parentIds[e.parentKey] || null : null); }
			if (hasReviewedByCol) { cols.push('ReviewedBy'); vals.push(e.status !== 'Pending' ? reviewerUserId : null); }
			if (hasReviewedDateCol) { cols.push('ReviewedDate'); vals.push(null); }
			const placeholders = cols.map(() => '?').join(', ');
			const q = `INSERT INTO excuseletter (${cols.join(', ')}) VALUES (${placeholders})`;
			await pool.query(q, vals);
		}
	}
};

const insertNotifications = async (pool, userIds) => {
	const useNotification = await tableExists(pool, 'notification');
	const useNotificationLog = !useNotification && await tableExists(pool, 'notificationlog');
	if (!useNotification && !useNotificationLog) return;

	const notifications = [
		{ to: 'parent.liam@example.com', message: 'Your child was absent today.' },
		{ to: 'parent.ava@example.com', message: 'Your child was present today.' },
	];
	for (const n of notifications) {
		const uid = userIds[n.to];
		if (!uid) continue;
		if (useNotification) {
			const hasStatus = await hasColumn(pool, 'notification', 'Status');
			const [exists] = await pool.query('SELECT 1 FROM notification WHERE RecipientID = ? AND Message = ? LIMIT 1', [uid, n.message]);
			if (exists.length === 0) {
				if (hasStatus) {
					await pool.query('INSERT INTO notification (RecipientID, Message, Status) VALUES (?, ?, ?)', [uid, n.message, 'Unread']);
				} else {
					await pool.query('INSERT INTO notification (RecipientID, Message) VALUES (?, ?)', [uid, n.message]);
				}
			}
		} else if (useNotificationLog) {
			const [exists] = await pool.query('SELECT 1 FROM notificationlog WHERE RecipientID = ? AND Message = ? LIMIT 1', [uid, n.message]);
			if (exists.length === 0) {
				await pool.query('INSERT INTO notificationlog (RecipientID, DateSent, Message) VALUES (?, NOW(), ?)', [uid, n.message]);
			}
		}
	}
};

const insertRegistrationRequests = async (pool, reviewerUserId) => {
	const regs = [
		{ UserType: 'Teacher', FullName: 'Karen Miller', ContactInfo: 'karen@example.com', Username: 'karen.miller@foothills.edu', Password: 'teacher123', Status: 'Approved' },
		{ UserType: 'Parent', FullName: 'Daniel Green', ContactInfo: '+1 (555) 888-2222', Username: 'daniel.green@example.com', Password: 'parent123', Status: 'Denied' },
		{ UserType: 'Parent', FullName: 'Olivia Parker', ContactInfo: '+1 (555) 111-3344', Username: 'olivia.parker@example.com', Password: 'parent123', Status: 'Pending' }
	];
	// Detect registration table columns
	const hasRegStatus = await hasColumn(pool, 'registration', 'Status');
	const hasRegReviewedBy = await hasColumn(pool, 'registration', 'ReviewedBy');
	const hasRegReviewedDate = await hasColumn(pool, 'registration', 'ReviewedDate');
	// Detect useraccount Status column
	const hasUserStatus = await hasColumn(pool, 'useraccount', 'Status');
	for (const r of regs) {
		const [exists] = await pool.query('SELECT 1 FROM registration WHERE Username = ? LIMIT 1', [r.Username]);
		if (exists.length === 0) {
			const hash = await bcrypt.hash(r.Password, 10);
			const cols = ['UserType', 'FullName', 'ContactInfo', 'Username', 'PasswordHash'];
			const vals = [r.UserType, r.FullName, r.ContactInfo, r.Username, hash];
			if (hasRegStatus) { cols.push('Status'); vals.push(r.Status); }
			if (r.Status !== 'Pending') {
				if (hasRegReviewedBy) { cols.push('ReviewedBy'); vals.push(reviewerUserId); }
				if (hasRegReviewedDate) { cols.push('ReviewedDate'); vals.push(new Date()); }
			}
			const placeholders = cols.map(() => '?').join(', ');
			await pool.query(`INSERT INTO registration (${cols.join(', ')}) VALUES (${placeholders})`, vals);
		}
		// If approved, ensure useraccount exists
		if (r.Status === 'Approved') {
			const [u] = await pool.query('SELECT UserID FROM useraccount WHERE Username = ? LIMIT 1', [r.Username]);
			if (u.length === 0) {
				const hash = await bcrypt.hash(r.Password, 10);
				if (hasUserStatus) {
					await pool.query('INSERT INTO useraccount (Username, PasswordHash, Role, Status) VALUES (?, ?, ?, ?)', [r.Username, hash, r.UserType, 'Active']);
				} else {
					await pool.query('INSERT INTO useraccount (Username, PasswordHash, Role) VALUES (?, ?, ?)', [r.Username, hash, r.UserType]);
				}
			}
		}
	}
};

const insertReports = async (pool, generatorUserId, studentIds) => {
	const now = new Date();
	const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
	const today = now.toISOString().slice(0, 10);
	const payload = JSON.stringify({ summary: 'Seeded report', generatedAt: now.toISOString() });
	const entries = [
		{ Student: 'Ava Johnson', type: 'Monthly', start: thisMonthStart, end: today },
		{ Student: 'Liam Chen', type: 'Weekly', start: today, end: today },
	];
	for (const e of entries) {
		const sId = studentIds[e.Student];
		const [exists] = await pool.query('SELECT 1 FROM attendancereport WHERE StudentID = ? AND DateRangeStart = ? AND DateRangeEnd = ? LIMIT 1', [sId, e.start, e.end]);
		if (exists.length === 0) {
			await pool.query(
				'INSERT INTO attendancereport (GeneratedBy, StudentID, ScheduleID, DateRangeStart, DateRangeEnd, ReportType, ReportFile) VALUES (?, ?, ?, ?, ?, ?, ?)',
				[generatorUserId, sId, null, e.start, e.end, e.type, payload]
			);
		}
	}
};

const insertAuditTrail = async (pool, userIds) => {
	const adminId = userIds['admin@foothills.edu'];
	const entries = [
		{ Action: 'Seed: Initialize database', TableAffected: null, RecordID: null },
		{ Action: 'Seed: Create demo users', TableAffected: 'useraccount', RecordID: null },
		{ Action: 'Seed: Create demo students', TableAffected: 'studentrecord', RecordID: null },
	];
	for (const a of entries) {
		await pool.query('INSERT INTO audittrail (UserID, Action, TableAffected, RecordID) VALUES (?, ?, ?, ?)', [adminId, a.Action, a.TableAffected, a.RecordID]);
	}
};

const seed = async () => {
	const pool = await getPool();
	try {
		console.log('🌱 Seeding database...');
		await ensureDatabase(pool);

		const usersCount = await countRows(pool, 'useraccount');
		const subjectsCount = await countRows(pool, 'subject').catch(() => 0);

		const userIds = await insertUsers(pool);
		const parentIds = await insertParents(pool, userIds);
		const adminId = userIds['admin@foothills.edu'];
		const studentIds = await insertStudents(pool, adminId, parentIds);

		// Backfill ParentID for any existing rows that matched but were NULL previously
		const hasParentIdCol = await hasColumn(pool, 'studentrecord', 'ParentID');
		if (hasParentIdCol) {
			const mappings = [
				{ FullName: 'Ava Johnson', GradeLevel: '1', Section: 'A', ParentKey: 'parent.ava@example.com' },
				{ FullName: 'Liam Chen', GradeLevel: '2', Section: 'B', ParentKey: 'parent.liam@example.com' },
				{ FullName: 'Noah Davis', GradeLevel: '3', Section: 'A', ParentKey: 'parent.noah@example.com' },
				{ FullName: 'Sophia Brown', GradeLevel: '4', Section: 'C', ParentKey: 'parent.sophia@example.com' },
			];
			for (const m of mappings) {
				if (parentIds[m.ParentKey]) {
					await pool.query('UPDATE studentrecord SET ParentID = ? WHERE FullName = ? AND GradeLevel = ? AND Section = ? AND (ParentID IS NULL OR ParentID = 0)', [parentIds[m.ParentKey], m.FullName, m.GradeLevel, m.Section]);
				}
			}
		}

		if (subjectsCount === 0) {
			await insertSubjects(pool);
		}
		const subjectIds = {};
		const [subjectRows] = await pool.query('SELECT SubjectID, SubjectName FROM subject');
		subjectRows.forEach(r => subjectIds[r.SubjectName] = r.SubjectID);

		await insertTeacherSchedules(pool, userIds, subjectIds);
		await insertStudentSubjects(pool, studentIds, userIds, subjectIds);
		await insertAttendanceLogs(pool, studentIds, adminId);
		await insertExcuseLetters(pool, studentIds, adminId, parentIds);
		await insertNotifications(pool, userIds);
		await insertRegistrationRequests(pool, adminId);
		await insertReports(pool, adminId, studentIds);
		await insertAuditTrail(pool, userIds);

		console.log('🎉 Seeding complete');
	} catch (e) {
		console.error('❌ Seeding failed:', e.message);
		process.exitCode = 1;
	} finally {
		await pool.end();
	}
};

seed(); 