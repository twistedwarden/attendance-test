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
		{ FullName: 'Alice Johnson', ContactInfo: '+1 (555) 123-4567', Relationship: 'Mother', userKey: 'parent.ava@example.com' },
		{ FullName: 'Bob Chen', ContactInfo: '+1 (555) 234-5678', Relationship: 'Father', userKey: 'parent.liam@example.com' },
		{ FullName: 'Nora Davis', ContactInfo: '+1 (555) 345-6789', Relationship: 'Mother', userKey: 'parent.noah@example.com' },
		{ FullName: 'Susan Brown', ContactInfo: '+1 (555) 456-7890', Relationship: 'Guardian', userKey: 'parent.sophia@example.com' },
	];
	const parentIds = {};
	const hasRelationship = await hasColumn(pool, 'parent', 'Relationship');
	for (const p of parents) {
		const userId = userIds[p.userKey];
		const [existing] = await pool.query('SELECT ParentID FROM parent WHERE UserID = ?', [userId]);
		if (existing.length > 0) {
			parentIds[p.userKey] = existing[0].ParentID;
			continue;
		}
		const cols = ['FullName', 'ContactInfo', 'UserID'];
		const vals = [p.FullName, p.ContactInfo, userId];
		if (hasRelationship) { cols.push('Relationship'); vals.push(p.Relationship); }
		const placeholders = cols.map(() => '?').join(', ');
		const query = `INSERT INTO parent (${cols.join(', ')}) VALUES (${placeholders})`;
		const [res] = await pool.query(query, vals);
		parentIds[p.userKey] = res.insertId;
	}
	return parentIds;
};

const insertSections = async (pool) => {
	const sections = [
		// Grade 1 - 10 sections
		{ SectionName: 'A', GradeLevel: '1', Description: 'Grade 1 Section A', Capacity: 30 },
		{ SectionName: 'B', GradeLevel: '1', Description: 'Grade 1 Section B', Capacity: 30 },
		{ SectionName: 'C', GradeLevel: '1', Description: 'Grade 1 Section C', Capacity: 30 },
		{ SectionName: 'D', GradeLevel: '1', Description: 'Grade 1 Section D', Capacity: 30 },
		{ SectionName: 'E', GradeLevel: '1', Description: 'Grade 1 Section E', Capacity: 30 },
		{ SectionName: 'F', GradeLevel: '1', Description: 'Grade 1 Section F', Capacity: 30 },
		{ SectionName: 'G', GradeLevel: '1', Description: 'Grade 1 Section G', Capacity: 30 },
		{ SectionName: 'H', GradeLevel: '1', Description: 'Grade 1 Section H', Capacity: 30 },
		{ SectionName: 'I', GradeLevel: '1', Description: 'Grade 1 Section I', Capacity: 30 },
		{ SectionName: 'J', GradeLevel: '1', Description: 'Grade 1 Section J', Capacity: 30 },
		// Other grades
		{ SectionName: 'B', GradeLevel: '2', Description: 'Grade 2 Section B', Capacity: 30 },
		{ SectionName: 'A', GradeLevel: '3', Description: 'Grade 3 Section A', Capacity: 30 },
		{ SectionName: 'C', GradeLevel: '4', Description: 'Grade 4 Section C', Capacity: 30 },
	];
	const sectionIds = {};
	const hasSectionTable = await tableExists(pool, 'section');
	if (!hasSectionTable) return sectionIds;
	
	for (const s of sections) {
		const [existing] = await pool.query('SELECT SectionID FROM section WHERE SectionName = ? AND GradeLevel = ?', [s.SectionName, s.GradeLevel]);
		if (existing.length > 0) {
			sectionIds[`${s.GradeLevel}-${s.SectionName}`] = existing[0].SectionID;
			continue;
		}
		const [res] = await pool.query('INSERT INTO section (SectionName, GradeLevel, Description, Capacity, IsActive) VALUES (?, ?, ?, ?, ?)', 
			[s.SectionName, s.GradeLevel, s.Description, s.Capacity, true]);
		sectionIds[`${s.GradeLevel}-${s.SectionName}`] = res.insertId;
	}
	return sectionIds;
};

const insertStudents = async (pool, createdByUserId, parentIds, sectionIds) => {
	const students = [
		{ FullName: 'Ava Johnson', DateOfBirth: '2018-03-15', Gender: 'Female', PlaceOfBirth: 'Manila, Philippines', Nationality: 'Filipino', Address: '123 Main St, Quezon City, Metro Manila', GradeLevel: '1', Section: 'A', SectionKey: '1-A', ParentKey: 'parent.ava@example.com' },
		{ FullName: 'Liam Chen', DateOfBirth: '2017-07-22', Gender: 'Male', PlaceOfBirth: 'Cebu City, Philippines', Nationality: 'Filipino', Address: '456 Oak Ave, Cebu City, Cebu', GradeLevel: '2', Section: 'B', SectionKey: '2-B', ParentKey: 'parent.liam@example.com' },
		{ FullName: 'Noah Davis', DateOfBirth: '2016-11-08', Gender: 'Male', PlaceOfBirth: 'Davao City, Philippines', Nationality: 'Filipino', Address: '789 Pine Rd, Davao City, Davao del Sur', GradeLevel: '3', Section: 'A', SectionKey: '3-A', ParentKey: 'parent.noah@example.com' },
		{ FullName: 'Sophia Brown', DateOfBirth: '2015-05-12', Gender: 'Female', PlaceOfBirth: 'Makati City, Philippines', Nationality: 'Filipino', Address: '321 Elm St, Makati City, Metro Manila', GradeLevel: '4', Section: 'C', SectionKey: '4-C', ParentKey: 'parent.sophia@example.com' },
	];
	const studentIds = {};
	const hasCreatedBy = await hasColumn(pool, 'studentrecord', 'CreatedBy');
	const hasFingerprint = await hasColumn(pool, 'studentrecord', 'FingerprintTemplate');
	const hasParentIdCol = await hasColumn(pool, 'studentrecord', 'ParentID');
	const hasParentContactCol = await hasColumn(pool, 'studentrecord', 'ParentContact');
	const hasDateOfBirth = await hasColumn(pool, 'studentrecord', 'DateOfBirth');
	const hasGender = await hasColumn(pool, 'studentrecord', 'Gender');
	const hasPlaceOfBirth = await hasColumn(pool, 'studentrecord', 'PlaceOfBirth');
	const hasNationality = await hasColumn(pool, 'studentrecord', 'Nationality');
	const hasAddress = await hasColumn(pool, 'studentrecord', 'Address');
	const hasSectionCol = await hasColumn(pool, 'studentrecord', 'Section');
	const hasSectionIdCol = await hasColumn(pool, 'studentrecord', 'SectionID');
	const dummyTemplate = Buffer.from('');
	for (const s of students) {
		const [existing] = await pool.query('SELECT StudentID FROM studentrecord WHERE FullName = ? AND GradeLevel = ? AND Section = ?', [s.FullName, s.GradeLevel, s.Section]);
		if (existing.length > 0) {
			studentIds[s.FullName] = existing[0].StudentID;
			// Also try to backfill ParentID and SectionID if columns exist and currently NULL
			if (hasParentIdCol && parentIds[s.ParentKey]) {
				await pool.query('UPDATE studentrecord SET ParentID = ? WHERE FullName = ? AND GradeLevel = ? AND Section = ? AND (ParentID IS NULL OR ParentID = 0)', [parentIds[s.ParentKey], s.FullName, s.GradeLevel, s.Section]);
			}
			if (hasSectionIdCol && sectionIds[s.SectionKey]) {
				await pool.query('UPDATE studentrecord SET SectionID = ? WHERE FullName = ? AND GradeLevel = ? AND Section = ? AND (SectionID IS NULL OR SectionID = 0)', [sectionIds[s.SectionKey], s.FullName, s.GradeLevel, s.Section]);
			}
			continue;
		}
		const parentId = s.ParentKey ? parentIds[s.ParentKey] || null : null;
		const sectionId = s.SectionKey ? sectionIds[s.SectionKey] || null : null;
		const cols = ['FullName', 'GradeLevel'];
		const vals = [s.FullName, s.GradeLevel];
		if (hasSectionCol) { cols.push('Section'); vals.push(s.Section); }
		if (hasDateOfBirth) { cols.push('DateOfBirth'); vals.push(s.DateOfBirth); }
		if (hasGender) { cols.push('Gender'); vals.push(s.Gender); }
		if (hasPlaceOfBirth) { cols.push('PlaceOfBirth'); vals.push(s.PlaceOfBirth); }
		if (hasNationality) { cols.push('Nationality'); vals.push(s.Nationality); }
		if (hasAddress) { cols.push('Address'); vals.push(s.Address); }
		if (hasFingerprint) { cols.push('FingerprintTemplate'); vals.push(dummyTemplate); }
		if (hasParentIdCol) { cols.push('ParentID'); vals.push(parentId); }
		if (hasSectionIdCol) { cols.push('SectionID'); vals.push(sectionId); }
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

const insertTeacherSchedules = async (pool, userIds, subjectIds, sectionIds) => {
	const teacherMap = {
		'sarah.johnson@foothills.edu': { SectionKey: '1-A', Subject: 'Mathematics', TimeIn: '08:00:00', TimeOut: '09:00:00', DayOfWeek: 'Mon', GracePeriod: 15 },
		'michael.chen@foothills.edu': { SectionKey: '2-B', Subject: 'Science', TimeIn: '09:00:00', TimeOut: '10:00:00', DayOfWeek: 'Tue', GracePeriod: 10 },
		'emily.davis@foothills.edu': { SectionKey: '3-A', Subject: 'English', TimeIn: '10:00:00', TimeOut: '11:00:00', DayOfWeek: 'Wed', GracePeriod: 20 },
	};
	const scheduleIds = {};
	const hasGracePeriod = await hasColumn(pool, 'teacherschedule', 'GracePeriod');
	const hasSectionCol = await hasColumn(pool, 'teacherschedule', 'Section');
	const hasSectionIdCol = await hasColumn(pool, 'teacherschedule', 'SectionID');
	for (const [email, sched] of Object.entries(teacherMap)) {
		const teacherId = userIds[email];
		const subjectId = subjectIds[sched.Subject];
		const sectionId = sectionIds[sched.SectionKey];
		const [existing] = await pool.query('SELECT ScheduleID FROM teacherschedule WHERE TeacherID = ? AND SubjectID = ? AND DayOfWeek = ?', [teacherId, subjectId, sched.DayOfWeek]);
		if (existing.length > 0) {
			scheduleIds[email] = existing[0].ScheduleID;
			continue;
		}
		
		const cols = ['TeacherID', 'SubjectID', 'TimeIn', 'TimeOut', 'DayOfWeek'];
		const vals = [teacherId, subjectId, sched.TimeIn, sched.TimeOut, sched.DayOfWeek];
		
		// Include Section column if it exists (for backward compatibility)
		if (hasSectionCol) {
			cols.push('Section');
			vals.push(sched.SectionKey.split('-')[1]); // Extract section name from SectionKey
		}
		
		// Include SectionID column if it exists
		if (hasSectionIdCol && sectionId) {
			cols.push('SectionID');
			vals.push(sectionId);
		}
		
		if (hasGracePeriod) {
			cols.push('GracePeriod');
			vals.push(sched.GracePeriod);
		}
		
		const placeholders = cols.map(() => '?').join(', ');
		const [res] = await pool.query(
			`INSERT INTO teacherschedule (${cols.join(', ')}) VALUES (${placeholders})`,
			vals
		);
		scheduleIds[email] = res.insertId;
	}
	return scheduleIds;
};

const insertSectionSchedules = async (pool, sectionIds, subjectIds) => {
	const hasSectionScheduleTable = await tableExists(pool, 'sectionschedule');
	if (!hasSectionScheduleTable) return;
	
	const sectionSchedules = [
		{ SectionKey: '1-A', Subject: 'Mathematics', TimeIn: '08:00:00', TimeOut: '09:00:00', DayOfWeek: 'Mon', GracePeriod: 15 },
		{ SectionKey: '2-B', Subject: 'Science', TimeIn: '09:00:00', TimeOut: '10:00:00', DayOfWeek: 'Tue', GracePeriod: 10 },
		{ SectionKey: '3-A', Subject: 'English', TimeIn: '10:00:00', TimeOut: '11:00:00', DayOfWeek: 'Wed', GracePeriod: 20 },
		{ SectionKey: '4-C', Subject: 'Mathematics', TimeIn: '11:00:00', TimeOut: '12:00:00', DayOfWeek: 'Thu', GracePeriod: 15 },
	];
	
	for (const sched of sectionSchedules) {
		const sectionId = sectionIds[sched.SectionKey];
		const subjectId = subjectIds[sched.Subject];
		if (!sectionId || !subjectId) continue;
		
		const [existing] = await pool.query('SELECT SectionScheduleID FROM sectionschedule WHERE SectionID = ? AND SubjectID = ? AND DayOfWeek = ?', [sectionId, subjectId, sched.DayOfWeek]);
		if (existing.length > 0) continue;
		
		await pool.query('INSERT INTO sectionschedule (SectionID, SubjectID, TimeIn, TimeOut, DayOfWeek, GracePeriod, IsActive) VALUES (?, ?, ?, ?, ?, ?, ?)', 
			[sectionId, subjectId, sched.TimeIn, sched.TimeOut, sched.DayOfWeek, sched.GracePeriod, true]);
	}
};

const insertTeacherRecords = async (pool, userIds) => {
	const teachers = [
		{ userKey: 'sarah.johnson@foothills.edu', FullName: 'Sarah Johnson', ContactInfo: '+1 (555) 200-1001' },
		{ userKey: 'michael.chen@foothills.edu', FullName: 'Michael Chen', ContactInfo: '+1 (555) 200-1002' },
		{ userKey: 'emily.davis@foothills.edu', FullName: 'Emily Davis', ContactInfo: '+1 (555) 200-1003' },
	];
	const hasTeacherTable = await tableExists(pool, 'teacherrecord');
	if (!hasTeacherTable) return;
	const hasHireDate = await hasColumn(pool, 'teacherrecord', 'HireDate');
	const hasStatus = await hasColumn(pool, 'teacherrecord', 'Status');
	for (const t of teachers) {
		const uid = userIds[t.userKey];
		if (!uid) continue;
		const [exists] = await pool.query('SELECT TeacherID FROM teacherrecord WHERE UserID = ? LIMIT 1', [uid]);
		if (exists.length > 0) continue;
		const cols = ['FullName', 'ContactInfo', 'UserID'];
		const vals = [t.FullName, t.ContactInfo, uid];
		if (hasHireDate) { cols.push('HireDate'); vals.push(new Date().toISOString().slice(0,10)); }
		if (hasStatus) { cols.push('Status'); vals.push('Active'); }
		const placeholders = cols.map(() => '?').join(', ');
		await pool.query(`INSERT INTO teacherrecord (${cols.join(', ')}) VALUES (${placeholders})`, vals);
	}
};

const insertAdminRecords = async (pool, userIds) => {
    const hasAdminTable = await tableExists(pool, 'adminrecord');
    if (!hasAdminTable) return;
    const hasHireDate = await hasColumn(pool, 'adminrecord', 'HireDate');
    const hasStatus = await hasColumn(pool, 'adminrecord', 'Status');
    const adminUsers = [
        { userKey: 'admin@foothills.edu', FullName: 'System Administrator', ContactInfo: '+1 (555) 000-0000' },
    ];
    for (const a of adminUsers) {
        const uid = userIds[a.userKey];
        if (!uid) continue;
        const [exists] = await pool.query('SELECT AdminID FROM adminrecord WHERE UserID = ? LIMIT 1', [uid]);
        if (exists.length > 0) continue;
        const cols = ['FullName', 'ContactInfo', 'UserID'];
        const vals = [a.FullName, a.ContactInfo, uid];
        if (hasHireDate) { cols.push('HireDate'); vals.push(new Date().toISOString().slice(0,10)); }
        if (hasStatus) { cols.push('Status'); vals.push('Active'); }
        const placeholders = cols.map(() => '?').join(', ');
        await pool.query(`INSERT INTO adminrecord (${cols.join(', ')}) VALUES (${placeholders})`, vals);
    }
};

const insertRegistrarRecords = async (pool, userIds) => {
    const hasRegistrarTable = await tableExists(pool, 'registrarrecord');
    if (!hasRegistrarTable) return;
    const hasHireDate = await hasColumn(pool, 'registrarrecord', 'HireDate');
    const hasStatus = await hasColumn(pool, 'registrarrecord', 'Status');
    const registrarUsers = [
        { userKey: 'registrar@foothills.edu', FullName: 'School Registrar', ContactInfo: '+1 (555) 100-1000' },
    ];
    for (const r of registrarUsers) {
        const uid = userIds[r.userKey];
        if (!uid) continue;
        const [exists] = await pool.query('SELECT RegistrarID FROM registrarrecord WHERE UserID = ? LIMIT 1', [uid]);
        if (exists.length > 0) continue;
        const cols = ['FullName', 'ContactInfo', 'UserID'];
        const vals = [r.FullName, r.ContactInfo, uid];
        if (hasHireDate) { cols.push('HireDate'); vals.push(new Date().toISOString().slice(0,10)); }
        if (hasStatus) { cols.push('Status'); vals.push('Active'); }
        const placeholders = cols.map(() => '?').join(', ');
        await pool.query(`INSERT INTO registrarrecord (${cols.join(', ')}) VALUES (${placeholders})`, vals);
    }
};

const insertStudentSchedules = async (pool, studentIds, userIds, subjectIds, sectionIds) => {
	const mappings = [
		{ student: 'Ava Johnson', subject: 'Mathematics', teacher: 'sarah.johnson@foothills.edu', sectionKey: '1-A' },
		{ student: 'Liam Chen', subject: 'Science', teacher: 'michael.chen@foothills.edu', sectionKey: '2-B' },
		{ student: 'Noah Davis', subject: 'English', teacher: 'emily.davis@foothills.edu', sectionKey: '3-A' },
	];
	
	const hasStudentScheduleTable = await tableExists(pool, 'studentschedule');
	if (!hasStudentScheduleTable) return;
	
	for (const m of mappings) {
		const studentId = studentIds[m.student];
		const subjectId = subjectIds[m.subject];
		const teacherId = userIds[m.teacher];
		const sectionId = sectionIds[m.sectionKey];
		
		if (!studentId || !subjectId || !teacherId || !sectionId) continue;
		
		// Find the schedule for this teacher, subject, and section
		const [schedules] = await pool.query(
			'SELECT ScheduleID FROM teacherschedule WHERE TeacherID = ? AND SubjectID = ? AND SectionID = ? LIMIT 1', 
			[teacherId, subjectId, sectionId]
		);
		
		if (schedules.length > 0) {
			const scheduleId = schedules[0].ScheduleID;
			
			// Check if student is already assigned to this schedule
			const [exists] = await pool.query(
				'SELECT 1 FROM studentschedule WHERE StudentID = ? AND ScheduleID = ? LIMIT 1', 
				[studentId, scheduleId]
			);
			
			if (exists.length === 0) {
				await pool.query(
					'INSERT INTO studentschedule (StudentID, ScheduleID, CreatedBy) VALUES (?, ?, ?)', 
					[studentId, scheduleId, teacherId]
				);
			}
		}
	}
};

const insertAttendanceLogs = async (pool, studentIds, validatorUserId) => {
	const today = new Date();
	const fmt = (d) => d.toISOString().slice(0, 10);
	const logs = [
		{ student: 'Ava Johnson', Date: fmt(today), TimeIn: '08:05:00', TimeOut: '15:00:00' },
		{ student: 'Liam Chen', Date: fmt(today), TimeIn: null, TimeOut: null },
		{ student: 'Noah Davis', Date: fmt(today), TimeIn: '08:25:00', TimeOut: '15:00:00' },
	];
	for (const l of logs) {
		const id = studentIds[l.student];
		const [exists] = await pool.query('SELECT 1 FROM attendancelog WHERE StudentID = ? AND Date = ? LIMIT 1', [id, l.Date]);
		if (exists.length === 0) {
			await pool.query(
				'INSERT INTO attendancelog (StudentID, Date, TimeIn, TimeOut, ValidatedBy) VALUES (?, ?, ?, ?, ?)',
				[id, l.Date, l.TimeIn, l.TimeOut, validatorUserId]
			);
		}
	}
};

const insertSubjectAttendance = async (pool, studentIds, subjectIds, validatorUserId) => {
	const today = new Date();
	const fmt = (d) => d.toISOString().slice(0, 10);
	const todayStr = fmt(today);
	
	// Create subject attendance records for each student and subject combination
	const students = ['Ava Johnson', 'Liam Chen', 'Noah Davis', 'Sophia Brown'];
	const subjects = ['Mathematics', 'Science', 'English'];
	
	for (const studentName of students) {
		const studentId = studentIds[studentName];
		if (!studentId) continue;
		
		for (const subjectName of subjects) {
			const subjectId = subjectIds[subjectName];
			if (!subjectId) continue;
			
			// Check if record already exists
			const [exists] = await pool.query(
				'SELECT 1 FROM subjectattendance WHERE StudentID = ? AND SubjectID = ? AND Date = ? LIMIT 1',
				[studentId, subjectId, todayStr]
			);
			
			if (exists.length === 0) {
				// Randomly assign status for demo purposes
				const statuses = ['Present', 'Late', 'Excused'];
				const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
				
				await pool.query(
					'INSERT INTO subjectattendance (StudentID, SubjectID, Date, Status, ValidatedBy) VALUES (?, ?, ?, ?, ?)',
					[studentId, subjectId, todayStr, randomStatus, validatorUserId]
				);
			}
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
		const sectionIds = await insertSections(pool);
		const studentIds = await insertStudents(pool, adminId, parentIds, sectionIds);

		// Backfill ParentID, Section, and SectionID for any existing rows that matched but were NULL previously
		const hasParentIdCol = await hasColumn(pool, 'studentrecord', 'ParentID');
		const hasSectionCol = await hasColumn(pool, 'studentrecord', 'Section');
		const hasSectionIdCol = await hasColumn(pool, 'studentrecord', 'SectionID');
		if (hasParentIdCol || hasSectionCol || hasSectionIdCol) {
			const mappings = [
				{ FullName: 'Ava Johnson', GradeLevel: '1', Section: 'A', SectionKey: '1-A', ParentKey: 'parent.ava@example.com' },
				{ FullName: 'Liam Chen', GradeLevel: '2', Section: 'B', SectionKey: '2-B', ParentKey: 'parent.liam@example.com' },
				{ FullName: 'Noah Davis', GradeLevel: '3', Section: 'A', SectionKey: '3-A', ParentKey: 'parent.noah@example.com' },
				{ FullName: 'Sophia Brown', GradeLevel: '4', Section: 'C', SectionKey: '4-C', ParentKey: 'parent.sophia@example.com' },
			];
			for (const m of mappings) {
				if (hasParentIdCol && parentIds[m.ParentKey]) {
					await pool.query('UPDATE studentrecord SET ParentID = ? WHERE FullName = ? AND GradeLevel = ? AND (ParentID IS NULL OR ParentID = 0)', [parentIds[m.ParentKey], m.FullName, m.GradeLevel]);
				}
				if (hasSectionCol) {
					await pool.query('UPDATE studentrecord SET Section = ? WHERE FullName = ? AND GradeLevel = ? AND (Section IS NULL OR Section = "")', [m.Section, m.FullName, m.GradeLevel]);
				}
				if (hasSectionIdCol && sectionIds[m.SectionKey]) {
					await pool.query('UPDATE studentrecord SET SectionID = ? WHERE FullName = ? AND GradeLevel = ? AND (SectionID IS NULL OR SectionID = 0)', [sectionIds[m.SectionKey], m.FullName, m.GradeLevel]);
				}
			}
		}

		if (subjectsCount === 0) {
			await insertSubjects(pool);
		}
		const subjectIds = {};
		const [subjectRows] = await pool.query('SELECT SubjectID, SubjectName FROM subject');
		subjectRows.forEach(r => subjectIds[r.SubjectName] = r.SubjectID);

		await insertTeacherSchedules(pool, userIds, subjectIds, sectionIds);
		await insertSectionSchedules(pool, sectionIds, subjectIds);
		await insertTeacherRecords(pool, userIds);
		await insertAdminRecords(pool, userIds);
		await insertRegistrarRecords(pool, userIds);
		await insertStudentSchedules(pool, studentIds, userIds, subjectIds, sectionIds);
	await insertAttendanceLogs(pool, studentIds, adminId);
	await insertSubjectAttendance(pool, studentIds, subjectIds, adminId);
	await insertExcuseLetters(pool, studentIds, adminId, parentIds);
	await insertNotifications(pool, userIds);
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