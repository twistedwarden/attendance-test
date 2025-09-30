import express from 'express';
import {
	getAllUsers,
	findUserById,
	updateUser,
	deleteUser,
	updateUserStatus,
	getAuditTrail,
	createAuditTrail,
	getAttendanceReports,
	createAttendanceReport,
	getStudents,
	createStudent,
	updateStudent,
	deleteStudent,
	setStudentStatus,
	updateParentContactByStudentId,
	searchParents,
	createParentProfile,
	getSubjectAttendance,
	createParentUserAndProfile,
	createTeacherRecord,
	createAdminRecord,
	createRegistrarRecord,
	findUserByEmail,
	createUser as dbCreateUser,
	pool,
	getAttendanceLog,
	createManualAttendance,
	linkStudentToParent,
	recalculateAttendanceStatus,
	getSections,
	createSection,
	updateSection,
	deleteSection,
	getSectionById,
	getSystemSetting,
	setSystemSetting,
} from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateUserCreation } from '../middleware/validation.js';
import { validateScheduleData, logScheduleConflict } from '../middleware/scheduleValidation.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Ensure admin for all routes in this file
router.use(authenticateToken, requireAdmin);

// --- Simple in-memory schedules store (demo / placeholder) ---
// This avoids DB requirements until a proper table is wired.
const schedulesStore = [
    { id: 1, subject: 'Mathematics', teacher: 'Mr. Santos', section: '7-A', days: ['Mon','Wed','Fri'], startTime: '08:00', endTime: '09:00', room: 'Room 101' },
    { id: 2, subject: 'Science', teacher: 'Ms. Cruz', section: '7-A', days: ['Tue','Thu'], startTime: '09:15', endTime: '10:15', room: 'Room 102' },
];
let nextScheduleId = 3;

// ===== System Settings Routes =====
// Get enrollment enabled flag
router.get('/settings/enrollment', async (req, res) => {
    try {
        const val = await getSystemSetting('enrollment_enabled', 'true');
        return res.json({ success: true, data: { enabled: String(val).toLowerCase() === 'true' } });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to fetch enrollment setting' });
    }
});

// Update enrollment enabled flag
router.put('/settings/enrollment', async (req, res) => {
    try {
        const { enabled } = req.body;
        const value = enabled ? 'true' : 'false';
        await setSystemSetting('enrollment_enabled', value, req.user.userId);
        await createAuditTrail({ userId: req.user.userId, action: `Set enrollment_enabled=${value}`, tableAffected: 'system_settings', recordId: null }).catch(() => {});
        return res.json({ success: true, data: { enabled: enabled ? true : false } });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to update enrollment setting' });
    }
});

// Users - list with status and name (parent/admin/registrar/teacher display names)
router.get('/users', async (req, res) => {
	try {
		try {
			const [rows] = await pool.execute(
				`SELECT ua.UserID, ua.Username, ua.Role, ua.Status,
				        p.FullName AS ParentName, p.ContactInfo AS ParentContact,
				        tr.FullName AS TeacherName, tr.ContactInfo AS TeacherContact,
				        ar.FullName AS AdminName, ar.ContactInfo AS AdminContact,
				        rr.FullName AS RegistrarName, rr.ContactInfo AS RegistrarContact
				 FROM useraccount ua
				 LEFT JOIN parent p ON p.UserID = ua.UserID
				 LEFT JOIN teacherrecord tr ON tr.UserID = ua.UserID
				 LEFT JOIN adminrecord ar ON ar.UserID = ua.UserID
				 LEFT JOIN registrarrecord rr ON rr.UserID = ua.UserID
				 ORDER BY ua.UserID`
			);
			const formatted = rows.map((u) => {
				const role = (u.Role || '').toLowerCase();
				const status = (u.Status || '').toLowerCase();
				let name = '';
				let contactInfo = '';
				if (role === 'parent') {
					name = u.ParentName || (u.Username || '').split('@')[0];
					contactInfo = u.ParentContact || '';
				} else if (role === 'teacher') {
					name = u.TeacherName || (u.Username || '').split('@')[0];
					contactInfo = u.TeacherContact || '';
				} else if (role === 'admin') {
					name = u.AdminName || (u.Username || '').split('@')[0];
					contactInfo = u.AdminContact || '';
				} else if (role === 'registrar') {
					name = u.RegistrarName || (u.Username || '').split('@')[0];
					contactInfo = u.RegistrarContact || '';
				}

				// Parse name into parts
				const nameParts = name.split(' ');
				const firstName = nameParts[0] || '';
				const lastName = nameParts[nameParts.length - 1] || '';
				const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

				return { 
					id: u.UserID, 
					email: u.Username, 
					role, 
					status, 
					name,
					firstName,
					middleName,
					lastName,
					contactInfo
				};
			});
			return res.json({ success: true, data: formatted });
		} catch (e) {
			// Fallback if join fails (e.g., parent table missing)
			const users = await getAllUsers();
			const formatted = users.map(u => {
				const role = (u.Role || '').toLowerCase();
				const status = (u.Status || '').toLowerCase();
				let name = '';
				if (['teacher','parent','admin','registrar'].includes(role)) name = (u.Username || '').split('@')[0];
				return { id: u.UserID, email: u.Username, role, status, name };
			});
			return res.json({ success: true, data: formatted });
		}
	} catch (error) {
		console.error('List users (admin) error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Users - create
router.post('/users', validateUserCreation, async (req, res) => {
	try {
		const { email, password, role, status = 'Active', firstName, middleName, lastName, contactInfo } = req.body;
		if (!email || !password || !role || !firstName || !lastName) {
			return res.status(400).json({ success: false, message: 'email, password, role, firstName, and lastName are required' });
		}

		// Check duplicate email
		const existing = await findUserByEmail(email);
		if (existing) {
			return res.status(409).json({ success: false, message: 'Email already exists' });
		}

		const passwordHash = await bcrypt.hash(password, 10);
		const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
		const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

		// Create full name from parts
		const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

		// db create (without Status column in helper) → set status afterward if needed
		const created = await dbCreateUser({ username: email, passwordHash, role: normalizedRole });
		if (!created) {
			return res.status(500).json({ success: false, message: 'Failed to create user' });
		}

		if (normalizedStatus) {
			await updateUserStatus(created.UserID, normalizedStatus).catch(() => {});
		}

		// Create role-specific record
		let roleRecord = null;
		const hireDate = new Date().toISOString().split('T')[0]; // Today's date

		switch (normalizedRole.toLowerCase()) {
			case 'teacher':
				roleRecord = await createTeacherRecord({ fullName, contactInfo, userId: created.UserID, hireDate });
				break;
			case 'admin':
				roleRecord = await createAdminRecord({ fullName, contactInfo, userId: created.UserID, hireDate });
				break;
			case 'registrar':
				roleRecord = await createRegistrarRecord({ fullName, contactInfo, userId: created.UserID, hireDate });
				break;
			case 'parent':
				// For parent, we'll create a parent record
				roleRecord = await createParentProfile({ fullName, contactInfo, userId: created.UserID });
				break;
			// SuperAdmin doesn't need a specific record
		}

		await createAuditTrail({ userId: req.user.userId, action: 'Create user', tableAffected: 'useraccount', recordId: created.UserID }).catch(() => {});

		return res.status(201).json({
			success: true,
			data: { 
				id: created.UserID, 
				email: created.Username, 
				role: normalizedRole.toLowerCase(), 
				status: normalizedStatus.toLowerCase(), 
				name: fullName,
				firstName,
				middleName,
				lastName,
				contactInfo
			}
		});
	} catch (error) {
		console.error('Create user error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Users - get by id (include name from associated record)
router.get('/users/:id', async (req, res) => {
	try {
		const { id } = req.params;
		try {
			const [rows] = await pool.execute(
				`SELECT ua.UserID, ua.Username, ua.Role, ua.Status,
				        p.FullName AS ParentName, p.ContactInfo AS ParentContact,
				        tr.FullName AS TeacherName, tr.ContactInfo AS TeacherContact,
				        ar.FullName AS AdminName, ar.ContactInfo AS AdminContact,
				        rr.FullName AS RegistrarName, rr.ContactInfo AS RegistrarContact
				 FROM useraccount ua
				 LEFT JOIN parent p ON p.UserID = ua.UserID
				 LEFT JOIN teacherrecord tr ON tr.UserID = ua.UserID
				 LEFT JOIN adminrecord ar ON ar.UserID = ua.UserID
				 LEFT JOIN registrarrecord rr ON rr.UserID = ua.UserID
				 WHERE ua.UserID = ? LIMIT 1`,
				[id]
			);
			const u = rows[0];
			if (!u) return res.status(404).json({ success: false, message: 'User not found' });
			const role = (u.Role || '').toLowerCase();
			const status = (u.Status || '').toLowerCase();
			let name = '';
			let contactInfo = '';
			if (role === 'parent') {
				name = u.ParentName || (u.Username || '').split('@')[0];
				contactInfo = u.ParentContact || '';
			} else if (role === 'teacher') {
				name = u.TeacherName || (u.Username || '').split('@')[0];
				contactInfo = u.TeacherContact || '';
			} else if (role === 'admin') {
				name = u.AdminName || (u.Username || '').split('@')[0];
				contactInfo = u.AdminContact || '';
			} else if (role === 'registrar') {
				name = u.RegistrarName || (u.Username || '').split('@')[0];
				contactInfo = u.RegistrarContact || '';
			}

			// Parse name into parts
			const nameParts = name.split(' ');
			const firstName = nameParts[0] || '';
			const lastName = nameParts[nameParts.length - 1] || '';
			const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

			return res.json({ 
				success: true, 
				data: { 
					id: u.UserID, 
					email: u.Username, 
					role, 
					status, 
					name,
					firstName,
					middleName,
					lastName,
					contactInfo
				} 
			});
		} catch (e) {
			const user = await findUserById(id);
			if (!user) return res.status(404).json({ success: false, message: 'User not found' });
			const role = (user.Role || '').toLowerCase();
			const status = (user.Status || '').toLowerCase();
			const name = ['teacher','parent','admin','registrar'].includes(role) ? (user.Username || '').split('@')[0] : '';
			return res.json({ success: true, data: { id: user.UserID, email: user.Username, role, status, name } });
		}
	} catch (error) {
		console.error('Get user by id error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Users - update (email, role, password, status)
router.put('/users/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { email, role, password, status, firstName, middleName, lastName, contactInfo } = req.body;

		const user = await findUserById(id);
		if (!user) return res.status(404).json({ success: false, message: 'User not found' });

		const updates = {};
		if (email && email !== user.Username) {
			// ensure unique email
			const dupe = await findUserByEmail(email);
			if (dupe && dupe.UserID !== Number(id)) {
				return res.status(409).json({ success: false, message: 'Email already in use' });
			}
			updates.username = email;
		}
		if (role) {
			updates.role = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
		}
		if (password) {
			updates.passwordHash = await bcrypt.hash(password, 10);
		}

		const updated = await updateUser(id, updates);
		if (!updated) {
			return res.status(500).json({ success: false, message: 'Failed to update user' });
		}

		if (status) {
			const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
			await updateUserStatus(id, normalizedStatus).catch(() => {});
		}

		// Update role-specific records if name fields are provided
		if (firstName || middleName || lastName || contactInfo) {
			const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
			const normalizedRole = (role || user.Role).toLowerCase();

			switch (normalizedRole) {
				case 'teacher':
					if (fullName || contactInfo) {
						await pool.execute(
							'UPDATE teacherrecord SET FullName = COALESCE(?, FullName), ContactInfo = COALESCE(?, ContactInfo) WHERE UserID = ?',
							[fullName || null, contactInfo || null, id]
						);
					}
					break;
				case 'admin':
					if (fullName || contactInfo) {
						await pool.execute(
							'UPDATE adminrecord SET FullName = COALESCE(?, FullName), ContactInfo = COALESCE(?, ContactInfo) WHERE UserID = ?',
							[fullName || null, contactInfo || null, id]
						);
					}
					break;
				case 'registrar':
					if (fullName || contactInfo) {
						await pool.execute(
							'UPDATE registrarrecord SET FullName = COALESCE(?, FullName), ContactInfo = COALESCE(?, ContactInfo) WHERE UserID = ?',
							[fullName || null, contactInfo || null, id]
						);
					}
					break;
				case 'parent':
					if (fullName || contactInfo) {
						await pool.execute(
							'UPDATE parent SET FullName = COALESCE(?, FullName), ContactInfo = COALESCE(?, ContactInfo) WHERE UserID = ?',
							[fullName || null, contactInfo || null, id]
						);
					}
					break;
			}
		}

		await createAuditTrail({ userId: req.user.userId, action: 'Update user', tableAffected: 'useraccount', recordId: Number(id) }).catch(() => {});

		const [rows] = await pool.execute(
			`SELECT ua.UserID, ua.Username, ua.Role, ua.Status,
			        p.FullName AS ParentName, p.ContactInfo AS ParentContact,
			        tr.FullName AS TeacherName, tr.ContactInfo AS TeacherContact,
			        ar.FullName AS AdminName, ar.ContactInfo AS AdminContact,
			        rr.FullName AS RegistrarName, rr.ContactInfo AS RegistrarContact
			 FROM useraccount ua
			 LEFT JOIN parent p ON p.UserID = ua.UserID
			 LEFT JOIN teacherrecord tr ON tr.UserID = ua.UserID
			 LEFT JOIN adminrecord ar ON ar.UserID = ua.UserID
			 LEFT JOIN registrarrecord rr ON rr.UserID = ua.UserID
			 WHERE ua.UserID = ? LIMIT 1`,
			[id]
		);
		const u = rows[0];
		const roleLower = (u.Role || '').toLowerCase();
		const statusLower = (u.Status || '').toLowerCase();
		let name = '';
		let contactInfoFromDb = '';
		if (roleLower === 'parent') {
			name = u.ParentName || (u.Username || '').split('@')[0];
			contactInfoFromDb = u.ParentContact || '';
		} else if (roleLower === 'teacher') {
			name = u.TeacherName || (u.Username || '').split('@')[0];
			contactInfoFromDb = u.TeacherContact || '';
		} else if (roleLower === 'admin') {
			name = u.AdminName || (u.Username || '').split('@')[0];
			contactInfoFromDb = u.AdminContact || '';
		} else if (roleLower === 'registrar') {
			name = u.RegistrarName || (u.Username || '').split('@')[0];
			contactInfoFromDb = u.RegistrarContact || '';
		}

		// Parse name into parts
		const nameParts = name.split(' ');
		const firstNameFromDb = nameParts[0] || '';
		const lastNameFromDb = nameParts[nameParts.length - 1] || '';
		const middleNameFromDb = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

		return res.json({ 
			success: true, 
			data: { 
				id: u.UserID, 
				email: u.Username, 
				role: roleLower, 
				status: statusLower, 
				name,
				firstName: firstNameFromDb,
				middleName: middleNameFromDb,
				lastName: lastNameFromDb,
				contactInfo: contactInfoFromDb
			} 
		});
	} catch (error) {
		console.error('Update user (admin) error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Users - delete
router.delete('/users/:id', async (req, res) => {
	try {
		const { id } = req.params;
		if (req.user.userId === Number(id)) {
			return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
		}
		const user = await findUserById(id);
		if (!user) return res.status(404).json({ success: false, message: 'User not found' });

		const ok = await deleteUser(id);
		if (!ok) return res.status(500).json({ success: false, message: 'Failed to delete user' });

		await createAuditTrail({ userId: req.user.userId, action: 'Delete user', tableAffected: 'useraccount', recordId: Number(id) }).catch(() => {});
		return res.json({ success: true, message: 'User deleted' });
	} catch (error) {
		console.error('Delete user (admin) error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// User status management
router.put('/users/:id/status', async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body; // 'Active' | 'Pending' | 'Archived'
		const validStatuses = ['Active', 'Pending', 'Archived'];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({ success: false, message: 'Invalid status' });
		}

		const user = await findUserById(id);
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		const updated = await updateUserStatus(id, status);
		await createAuditTrail({ userId: req.user.userId, action: `Update user status to ${status}`, tableAffected: 'useraccount', recordId: Number(id) }).catch(() => {});

		return res.json({ success: true, message: 'Status updated', data: { id: updated.UserID, email: updated.Username, role: updated.Role, status: updated.Status } });
	} catch (error) {
		console.error('Update user status error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Audit trail - list
router.get('/audittrail', async (req, res) => {
	try {
		const { limit = 50, offset = 0 } = req.query;
		const logs = await getAuditTrail({ limit, offset });
		return res.json({ success: true, data: logs });
	} catch (error) {
		console.error('Get audit trail error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Audit trail - purge old
router.post('/audittrail/purge', async (req, res) => {
    try {
        const { beforeDays = 90 } = req.body || {};
        const { purgeOldAuditTrail, createAuditTrail } = req.app.get('dbFns') || {};
        // Fallback import if not attached on app
        let execPurge = purgeOldAuditTrail;
        if (!execPurge) {
            try {
                const mod = await import('../config/database.js');
                execPurge = mod.purgeOldAuditTrail;
            } catch (e) {}
        }
        if (!execPurge) return res.status(500).json({ success: false, message: 'Purge function not available' });

        const result = await execPurge({ beforeDays });

        // Try to log the purge in audit trail but don't fail the request if it errors
        try {
            const userId = req.user?.userId ?? null;
            const action = `Purge audit logs older than ${Number(beforeDays)} days`;
            if (createAuditTrail) {
                await createAuditTrail({ userId, action, tableAffected: 'audittrail', recordId: null });
            } else {
                const mod = await import('../config/database.js');
                if (mod.createAuditTrail) await mod.createAuditTrail({ userId, action, tableAffected: 'audittrail', recordId: null });
            }
        } catch (e) {}

        return res.json({ success: true, data: { affected: result.affectedRows } });
    } catch (error) {
        console.error('Purge audit trail error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


// Attendance reports - list
router.get('/reports', async (req, res) => {
	try {
		const { limit = 50, offset = 0 } = req.query;
		const rows = await getAttendanceReports({ limit, offset });
		return res.json({ success: true, data: rows });
	} catch (error) {
		console.error('Get reports error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Attendance reports - generate simple placeholder
router.post('/reports', async (req, res) => {
	try {
		const { studentId = null, scheduleId = null, dateRangeStart, dateRangeEnd, reportType } = req.body;
		const validTypes = ['Daily','Weekly','Monthly','Per Subject','Per Section'];
		if (!validTypes.includes(reportType)) {
			return res.status(400).json({ success: false, message: 'Invalid report type' });
		}
		if (!dateRangeStart || !dateRangeEnd) {
			return res.status(400).json({ success: false, message: 'Date range required' });
		}
		const placeholderReport = { summary: 'Report generated', filters: { studentId, scheduleId, dateRangeStart, dateRangeEnd, reportType } };
		const created = await createAttendanceReport({ generatedBy: req.user.userId, studentId, scheduleId, dateRangeStart, dateRangeEnd, reportType, reportFile: JSON.stringify(placeholderReport) });
		await createAuditTrail({ userId: req.user.userId, action: `Generate report (${reportType})`, tableAffected: 'attendancereport', recordId: created?.ReportID ?? null }).catch(() => {});
		return res.status(201).json({ success: true, message: 'Report created', data: created });
	} catch (error) {
		console.error('Create report error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Attendance reports - export CSV (admin scope)
router.get('/reports/export', async (req, res) => {
    try {
        const { type = 'attendance', dateFrom, dateTo, studentId, scheduleId } = req.query;

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

        // Build date window
        const now = new Date();
        const to = dateTo ? String(dateTo) : `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        const fromDate = dateFrom ? new Date(String(dateFrom)) : new Date(now.getTime() - 7*24*60*60*1000);
        const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth()+1).padStart(2,'0')}-${String(fromDate.getDate()).padStart(2,'0')}`;
        // Inclusive end-date handling: treat end as < next day to avoid TZ off-by-one
        const toDateObj = new Date(to + 'T00:00:00');
        const toPlus1 = new Date(toDateObj.getTime() + 24*60*60*1000);
        const toExclusive = `${toPlus1.getFullYear()}-${String(toPlus1.getMonth()+1).padStart(2,'0')}-${String(toPlus1.getDate()).padStart(2,'0')}`;

        // Helper to optionally scope by schedule -> subjectId
        let subjectId = null;
        if (scheduleId) {
            const [schedRows] = await pool.execute(
                `SELECT SubjectID FROM teacherschedule WHERE ScheduleID = ? LIMIT 1`,
                [Number(scheduleId)]
            );
            if (Array.isArray(schedRows) && schedRows.length > 0) subjectId = schedRows[0].SubjectID;
        }

        if (String(type) === 'students') {
            const params = [];
            let where = '1=1';
            if (studentId) {
                where += ' AND sr.StudentID = ?';
                params.push(Number(studentId));
            }
            const [rows] = await pool.execute(
                `SELECT 
                    sr.StudentID as studentId,
                    sr.FullName as studentName,
                    sec.SectionName as sectionName,
                    sr.GradeLevel as gradeLevel,
                    p.FullName as parentName,
                    p.ContactInfo as parentContact
                 FROM studentrecord sr
                 LEFT JOIN section sec ON sec.SectionID = sr.SectionID
                 LEFT JOIN parent p ON p.ParentID = sr.ParentID
                 WHERE ${where}
                 ORDER BY sr.FullName
                 LIMIT 5000`,
                params
            );
            const header = ['studentId','studentName','sectionName','gradeLevel','parentName','parentContact'];
            const csv = toCsv(rows, header);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="admin-students-${Date.now()}.csv"`);
            return res.status(200).send(csv);
        }

        if (String(type) === 'subject-attendance' || String(type) === 'tardiness' || String(type) === 'absences' || String(type) === 'attendance') {
            // subjectattendance preferred for tardiness/absences; attendancelog for raw attendance
            if (String(type) === 'attendance') {
                const params = [from, toExclusive];
                let where = 'al.Date >= ? AND al.Date < ?';
                if (studentId) { where += ' AND al.StudentID = ?'; params.push(Number(studentId)); }
                const [rows] = await pool.execute(
                    `SELECT 
                        sr.FullName as studentName,
                        sr.StudentID as studentId,
                        sec.SectionName as sectionName,
                        sr.GradeLevel as gradeLevel,
                        al.Date as date,
                        al.TimeIn as timeIn,
                        al.TimeOut as timeOut
                     FROM attendancelog al
                     JOIN studentrecord sr ON sr.StudentID = al.StudentID
                     LEFT JOIN section sec ON sec.SectionID = sr.SectionID
                     WHERE ${where}
                     ORDER BY al.Date DESC, sr.FullName ASC
                     LIMIT 10000`,
                    params
                );
                const header = ['studentId','studentName','sectionName','gradeLevel','date','timeIn','timeOut'];
                const mapped = rows.map(r => ({
                    studentId: r.studentId,
                    studentName: r.studentName,
                    sectionName: r.sectionName || '',
                    gradeLevel: r.gradeLevel || '',
                    date: r.date,
                    timeIn: r.timeIn,
                    timeOut: r.timeOut
                }));
                const csv = toCsv(mapped, header);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="admin-attendance-${Date.now()}.csv"`);
                return res.status(200).send(csv);
            }

            // subjectattendance-based export
            const params = [from, toExclusive];
            let where = 'sa.Date >= ? AND sa.Date < ?';
            if (studentId) { where += ' AND sa.StudentID = ?'; params.push(Number(studentId)); }
            if (subjectId) { where += ' AND sa.SubjectID = ?'; params.push(Number(subjectId)); }
            if (String(type) === 'tardiness') { where += " AND sa.Status = 'Late'"; }
            if (String(type) === 'absences') { where += " AND sa.Status = 'Absent'"; }

            const [rows] = await pool.execute(
                `SELECT 
                    sr.FullName as studentName,
                    sr.StudentID as studentId,
                    sec.SectionName as sectionName,
                    sr.GradeLevel as gradeLevel,
                    sa.Date as date,
                    sa.Status as status,
                    s.SubjectName as subjectName
                 FROM subjectattendance sa
                 JOIN studentrecord sr ON sr.StudentID = sa.StudentID
                 LEFT JOIN section sec ON sec.SectionID = sr.SectionID
                 LEFT JOIN subject s ON s.SubjectID = sa.SubjectID
                 WHERE ${where}
                 ORDER BY sa.Date DESC, sr.FullName ASC
                 LIMIT 10000`,
                params
            );
            const header = ['studentId','studentName','sectionName','gradeLevel','subjectName','date','status'];
            const mapped = rows.map(r => ({
                studentId: r.studentId,
                studentName: r.studentName,
                sectionName: r.sectionName || '',
                gradeLevel: r.gradeLevel || '',
                subjectName: r.subjectName || '',
                date: r.date,
                status: r.status
            }));
            const csv = toCsv(mapped, header);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="admin-${type}-${Date.now()}.csv"`);
            return res.status(200).send(csv);
        }

        return res.status(400).json({ success: false, message: 'Unsupported report type' });
    } catch (error) {
        console.error('Admin export reports error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Attendance log - list
router.get('/attendancelog', async (req, res) => {
	try {
		const { limit = 50, offset = 0, date = null } = req.query;
		const rows = await getAttendanceLog({ limit, offset, date });
		return res.json({ success: true, data: rows });
	} catch (error) {
		console.error('Get attendance log error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Attendance log - manual create
router.post('/attendancelog', async (req, res) => {
    try {
        const { studentId, date = null, timeIn = null, timeOut = null, status = 'Present' } = req.body;
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'studentId is required' });
        }
        const row = await createManualAttendance({
            studentId: Number(studentId),
            date,
            timeIn,
            timeOut,
            status,
            validatedBy: req.user.userId
        });
        await createAuditTrail({ userId: req.user.userId, action: 'Manual attendance entry', tableAffected: 'attendancelog', recordId: row?.AttendanceID ?? null }).catch(() => {});
        return res.status(201).json({ success: true, data: row });
    } catch (error) {
        console.error('Create manual attendance error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Subject attendance - list all with optional filters
router.get('/subjectattendance', async (req, res) => {
    try {
        const { limit = 50, offset = 0, subjectId, date, studentId } = req.query;
        const limitNum = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 50;
        const offsetNum = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;
        
        let sql = `
            SELECT 
                sa.SubjectAttendanceID,
                sa.StudentID,
                sa.SubjectID,
                sa.Date,
                sa.Status,
                sa.ValidatedBy,
                sa.CreatedAt,
                sr.FullName,
                sr.GradeLevel,
                sec.SectionName as Section,
                s.SubjectName
            FROM subjectattendance sa
            LEFT JOIN studentrecord sr ON sr.StudentID = sa.StudentID
            LEFT JOIN section sec ON sec.SectionID = sr.SectionID
            LEFT JOIN subject s ON s.SubjectID = sa.SubjectID
            WHERE 1=1
        `;
        
        const params = [];
        if (subjectId) {
            sql += ' AND sa.SubjectID = ?';
            params.push(Number(subjectId));
        }
        if (date) {
            sql += ' AND sa.Date = ?';
            params.push(date);
        }
        if (studentId) {
            sql += ' AND sa.StudentID = ?';
            params.push(Number(studentId));
        }
        
        sql += ' ORDER BY sa.Date DESC, sa.CreatedAt DESC';
        // Inline sanitized numeric LIMIT/OFFSET to avoid MySQL parameter issues
        sql += ` LIMIT ${limitNum} OFFSET ${offsetNum}`;
        
        const [rows] = await pool.execute(sql, params);
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('List subject attendance error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Subject attendance - get for student
router.get('/subjectattendance/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { date } = req.query;
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'studentId is required' });
        }
        const rows = await getSubjectAttendance(Number(studentId), date);
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Get subject attendance error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Subject attendance - update status
router.put('/subjectattendance/:subjectAttendanceId', async (req, res) => {
    try {
        const { subjectAttendanceId } = req.params;
        const { status } = req.body;
        if (!subjectAttendanceId || !status) {
            return res.status(400).json({ success: false, message: 'subjectAttendanceId and status are required' });
        }
        if (!['Present','Late','Excused'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }
        
        await pool.execute(
            'UPDATE subjectattendance SET Status = ?, ValidatedBy = ? WHERE SubjectAttendanceID = ?',
            [status, req.user.userId, subjectAttendanceId]
        );
        
        await createAuditTrail({ 
            userId: req.user.userId, 
            action: `Updated subject attendance status to ${status}`, 
            tableAffected: 'subjectattendance', 
            recordId: subjectAttendanceId 
        }).catch(() => {});
        
        return res.json({ success: true, message: 'Subject attendance updated successfully' });
    } catch (error) {
        console.error('Update subject attendance error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Recalculate attendance status for existing records
router.post('/recalculate-attendance', async (req, res) => {
    try {
        const { studentId, date } = req.body;
        if (!studentId || !date) {
            return res.status(400).json({ success: false, message: 'studentId and date are required' });
        }
        
        const result = await recalculateAttendanceStatus(Number(studentId), date);
        
        await createAuditTrail({ 
            userId: req.user.userId, 
            action: `Recalculated attendance status for student ${studentId} on ${date}`, 
            tableAffected: 'subjectattendance', 
            recordId: studentId 
        }).catch(() => {});
        
        return res.json(result);
    } catch (error) {
        console.error('Recalculate attendance error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// --- Schedules ---
router.get('/schedules', async (req, res) => {
    try {
        // Fetch from DB instead of in-memory store
        // Attempt to join with subject and useraccount to get readable names
        const sql = `
            SELECT 
                ts.ScheduleID AS id,
                COALESCE(sub.SubjectName, CAST(ts.SubjectID AS CHAR)) AS subject,
                COALESCE(tr.FullName, ua.Username, CAST(ts.TeacherID AS CHAR)) AS teacher,
                ts.TeacherID AS teacherId,
                ts.SectionID AS sectionId,
                sec.SectionName AS sectionName,
                sec.Description AS sectionDescription,
                sec.Capacity AS sectionCapacity,
                sec.GradeLevel AS gradeLevel,
                ts.DayOfWeek AS dayOfWeek,
                ts.TimeIn AS startTime,
                ts.TimeOut AS endTime,
                ts.GracePeriod AS gracePeriod
            FROM teacherschedule ts
            LEFT JOIN subject sub ON sub.SubjectID = ts.SubjectID
            LEFT JOIN teacherrecord tr ON tr.UserID = ts.TeacherID
            LEFT JOIN useraccount ua ON ua.UserID = ts.TeacherID
            LEFT JOIN section sec ON sec.SectionID = ts.SectionID
            ORDER BY ts.ScheduleID`;
        const [rows] = await pool.execute(sql);

        // Map DB shape to frontend expected shape
        const data = rows.map((r) => ({
            id: r.id,
            subject: r.subject || 'Subject',
            teacher: r.teacher || '—',
            teacherId: r.teacherId || 0,
            sectionId: r.sectionId || null,
            sectionName: r.sectionName || null,
            sectionDescription: r.sectionDescription || null,
            sectionCapacity: r.sectionCapacity || null,
            gradeLevel: r.gradeLevel || null,
            section: r.sectionName || null, // Use sectionName instead of removed section field
            days: r.dayOfWeek ? [r.dayOfWeek] : [],
            startTime: (r.startTime || '').toString().slice(0,5),
            endTime: (r.endTime || '').toString().slice(0,5),
            gracePeriod: r.gracePeriod || 15
        }));

        return res.json({ success: true, data });
    } catch (error) {
        console.error('List schedules error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/schedules', async (req, res) => {
    try {
        // console.log('POST /schedules - Request body:', req.body);
        const { subject, teacher, sectionId = null, gradeLevel = null, days = [], startTime, endTime } = req.body;
        if (!subject || !teacher || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'subject, teacher, startTime, endTime are required' });
        }

        // Resolve subject and teacher IDs if possible
        let teacherId = null;
        let subjectId = null;
        try {
            // Try to parse as ID first, then as username
            const teacherIdNum = parseInt(teacher);
            if (!isNaN(teacherIdNum)) {
                // It's a number, treat as UserID
                const [rows] = await pool.execute('SELECT UserID FROM useraccount WHERE UserID = ? LIMIT 1', [teacherIdNum]);
                teacherId = Array.isArray(rows) && rows.length > 0 ? rows[0].UserID : null;
            } else {
                // It's a string, try username first, then full name
                const [rows] = await pool.execute('SELECT UserID FROM useraccount WHERE Username = ? LIMIT 1', [teacher]);
                
                if (Array.isArray(rows) && rows.length > 0) {
                    teacherId = rows[0].UserID;
                } else {
                    // Try looking up by full name in teacherrecord
                    const [nameRows] = await pool.execute(`
                        SELECT tr.UserID 
                        FROM teacherrecord tr 
                        WHERE tr.FullName = ? 
                        LIMIT 1
                    `, [teacher]);
                    teacherId = Array.isArray(nameRows) && nameRows.length > 0 ? nameRows[0].UserID : null;
                }
            }
        } catch (err) {
            console.error('Teacher lookup error:', err);
        }
        try {
            // Try to parse as ID first, then as name
            const subjectIdNum = parseInt(subject);
            if (!isNaN(subjectIdNum)) {
                // It's a number, treat as SubjectID
                const [rows] = await pool.execute('SELECT SubjectID FROM subject WHERE SubjectID = ? LIMIT 1', [subjectIdNum]);
                subjectId = Array.isArray(rows) && rows.length > 0 ? rows[0].SubjectID : null;
            } else {
                // It's a string, treat as SubjectName
                const [rows] = await pool.execute('SELECT SubjectID FROM subject WHERE SubjectName = ? LIMIT 1', [subject]);
                subjectId = Array.isArray(rows) && rows.length > 0 ? rows[0].SubjectID : null;
            }
        } catch (err) {
            console.error('Subject lookup error:', err);
        }

        // Validate teacher and subject IDs were found
        if (!teacherId) {
            return res.status(400).json({ success: false, message: 'Teacher not found' });
        }
        if (!subjectId) {
            return res.status(400).json({ success: false, message: 'Subject not found' });
        }

        // Validate each day for overlaps before creating any schedules
        const validationErrors = [];
        const conflictData = [];

        for (const dayOfWeek of days) {
            const scheduleData = {
                teacherId,
                sectionId,
                dayOfWeek,
                startTime,
                endTime
            };

            const validation = await validateScheduleData(scheduleData);
            
            if (!validation.isValid) {
                validationErrors.push(...validation.errors.map(error => `${dayOfWeek}: ${error}`));
                
                if (validation.overlapCheck && validation.overlapCheck.hasOverlap) {
                    conflictData.push({
                        day: dayOfWeek,
                        conflicts: validation.overlapCheck.conflicts
                    });
                }
            }
        }

        // If there are validation errors, return them
        if (validationErrors.length > 0) {
            // Log the conflict attempt
            if (conflictData.length > 0) {
                logScheduleConflict({
                    teacherId,
                    sectionId,
                    days,
                    startTime,
                    endTime,
                    conflicts: conflictData
                }, 'create', req.user?.userId);
            }

            return res.status(409).json({ 
                success: false, 
                message: 'Schedule conflicts detected',
                errors: validationErrors,
                conflicts: conflictData
            });
        }

        // Insert into teacherschedule (create separate records for each day)
        const insertedIds = [];
        for (const dayOfWeek of days) {
            const [ins] = await pool.execute(
                'INSERT INTO teacherschedule (TeacherID, SubjectID, SectionID, TimeIn, TimeOut, DayOfWeek) VALUES (?, ?, ?, ?, ?, ?)',
                [teacherId, subjectId, sectionId, startTime, endTime, dayOfWeek]
            );
            insertedIds.push(ins.insertId);
            
            await createAuditTrail({ userId: req.user?.userId, action: 'Create schedule', tableAffected: 'teacherschedule', recordId: ins.insertId }).catch(() => {});
        }

        // Return the created rows in API shape
        return res.status(201).json({ success: true, data: {
            ids: insertedIds,
            subject,
            teacher,
            sectionId,
            days: days,
            startTime: String(startTime).slice(0,5),
            endTime: String(endTime).slice(0,5)
        }});
    } catch (error) {
        console.error('Create schedule error:', error);
        
        // Handle database constraint violations
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                success: false, 
                message: 'Schedule conflict: A schedule already exists for this teacher/section at this time',
                errorCode: 'DUPLICATE_SCHEDULE'
            });
        }
        
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.put('/schedules/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, teacher, sectionId, gradeLevel, startTime, endTime, days, gracePeriod } = req.body;

        // Get current schedule data first
        const [currentRows] = await pool.execute('SELECT * FROM teacherschedule WHERE ScheduleID = ? LIMIT 1', [id]);
        if (!currentRows || currentRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }
        const currentRecord = currentRows[0];

        // Resolve subject and teacher IDs if provided, otherwise use current values
        let teacherId = currentRecord.TeacherID;
        let subjectId = currentRecord.SubjectID;

        if (subject) {
            try {
                const subjectIdNum = parseInt(subject);
                if (!isNaN(subjectIdNum)) {
                    const [rows] = await pool.execute('SELECT SubjectID FROM subject WHERE SubjectID = ? LIMIT 1', [subjectIdNum]);
                    subjectId = Array.isArray(rows) && rows.length > 0 ? rows[0].SubjectID : null;
                } else {
                    const [rows] = await pool.execute('SELECT SubjectID FROM subject WHERE SubjectName = ? LIMIT 1', [subject]);
                    subjectId = Array.isArray(rows) && rows.length > 0 ? rows[0].SubjectID : null;
                }
            } catch {}
        }

        if (teacher) {
            try {
                const teacherIdNum = parseInt(teacher);
                if (!isNaN(teacherIdNum)) {
                    const [rows] = await pool.execute('SELECT UserID FROM useraccount WHERE UserID = ? LIMIT 1', [teacherIdNum]);
                    teacherId = Array.isArray(rows) && rows.length > 0 ? rows[0].UserID : null;
                } else {
                    // Try username first, then full name
                    const [rows] = await pool.execute('SELECT UserID FROM useraccount WHERE Username = ? LIMIT 1', [teacher]);
                    
                    if (Array.isArray(rows) && rows.length > 0) {
                        teacherId = rows[0].UserID;
                    } else {
                        // Try looking up by full name in teacherrecord
                        const [nameRows] = await pool.execute(`
                            SELECT tr.UserID 
                            FROM teacherrecord tr 
                            WHERE tr.FullName = ? 
                            LIMIT 1
                        `, [teacher]);
                        teacherId = Array.isArray(nameRows) && nameRows.length > 0 ? nameRows[0].UserID : null;
                    }
                }
            } catch {}
        }

        // Use current values for fields not being updated
        const finalTeacherId = teacherId || currentRecord.TeacherID;
        const finalSubjectId = subjectId || currentRecord.SubjectID;
        const finalSectionId = sectionId !== undefined ? sectionId : currentRecord.SectionID;
        const finalStartTime = startTime !== undefined ? startTime : currentRecord.TimeIn;
        const finalEndTime = endTime !== undefined ? endTime : currentRecord.TimeOut;

        // Validate teacher and subject IDs were found
        if (!finalTeacherId) {
            return res.status(400).json({ success: false, message: 'Teacher not found' });
        }
        if (!finalSubjectId) {
            return res.status(400).json({ success: false, message: 'Subject not found' });
        }

        // Validate for overlaps if time or day is being changed
        if (startTime !== undefined || endTime !== undefined || days !== undefined) {
            const validationErrors = [];
            const conflictData = [];
            const daysToCheck = days !== undefined ? days : [currentRecord.DayOfWeek];

            for (const dayOfWeek of daysToCheck) {
                const scheduleData = {
                    teacherId: finalTeacherId,
                    sectionId: finalSectionId,
                    dayOfWeek,
                    startTime: finalStartTime,
                    endTime: finalEndTime
                };

                const validation = await validateScheduleData(scheduleData, id);
                
                if (!validation.isValid) {
                    validationErrors.push(...validation.errors.map(error => `${dayOfWeek}: ${error}`));
                    
                    if (validation.overlapCheck && validation.overlapCheck.hasOverlap) {
                        conflictData.push({
                            day: dayOfWeek,
                            conflicts: validation.overlapCheck.conflicts
                        });
                    }
                }
            }

            // If there are validation errors, return them
            if (validationErrors.length > 0) {
                // Log the conflict attempt
                if (conflictData.length > 0) {
                    logScheduleConflict({
                        teacherId: finalTeacherId,
                        sectionId: finalSectionId,
                        days: daysToCheck,
                        startTime: finalStartTime,
                        endTime: finalEndTime,
                        conflicts: conflictData
                    }, 'update', req.user?.userId);
                }

                return res.status(409).json({ 
                    success: false, 
                    message: 'Schedule conflicts detected',
                    errors: validationErrors,
                    conflicts: conflictData
                });
            }
        }

        // Build dynamic update for teacherschedule
        const sets = [];
        const vals = [];
        
        if (finalSubjectId !== currentRecord.SubjectID) { sets.push('SubjectID = ?'); vals.push(finalSubjectId); }
        if (finalTeacherId !== currentRecord.TeacherID) { sets.push('TeacherID = ?'); vals.push(finalTeacherId); }
        if (finalStartTime !== currentRecord.TimeIn) { sets.push('TimeIn = ?'); vals.push(finalStartTime); }
        if (finalEndTime !== currentRecord.TimeOut) { sets.push('TimeOut = ?'); vals.push(finalEndTime); }
        if (finalSectionId !== currentRecord.SectionID) { sets.push('SectionID = ?'); vals.push(finalSectionId); }
        // GradeLevel is now obtained through SectionID relationship, no direct update needed
        if (gracePeriod !== undefined) { sets.push('GracePeriod = ?'); vals.push(gracePeriod); }
        // Note: days handling is done separately below to support multiple days

        if (sets.length === 0) {
            // nothing to update, return current
            return res.json({ success: true, data: {
                id: currentRecord.ScheduleID,
                subject: String(currentRecord.SubjectID),
                teacher: String(currentRecord.TeacherID),
                section: currentRecord.SectionID ? `Section ${currentRecord.SectionID}` : 'No Section',
                days: currentRecord.DayOfWeek ? [currentRecord.DayOfWeek] : [],
                startTime: String(currentRecord.TimeIn).slice(0,5),
                endTime: String(currentRecord.TimeOut).slice(0,5)
            }});
        }

        vals.push(id);
        const [result] = await pool.execute(`UPDATE teacherschedule SET ${sets.join(', ')} WHERE ScheduleID = ?`, vals);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Schedule not found' });

        await createAuditTrail({ userId: req.user.userId, action: 'Update schedule', tableAffected: 'teacherschedule', recordId: Number(id) }).catch(() => {});

        // Handle multiple days: if days are provided, delete current record and create new ones for each day
        if (days !== undefined && Array.isArray(days) && days.length > 0) {
            // Get the current record data to preserve other fields
            const [currentRows] = await pool.execute('SELECT * FROM teacherschedule WHERE ScheduleID = ? LIMIT 1', [id]);
            if (currentRows && currentRows.length > 0) {
                const currentRecord = currentRows[0];
                
                // Delete the current record
                await pool.execute('DELETE FROM teacherschedule WHERE ScheduleID = ?', [id]);
                
                // Create new records for each day
                const insertedIds = [];
                for (const dayOfWeek of days) {
                    const [ins] = await pool.execute(
                        'INSERT INTO teacherschedule (TeacherID, SubjectID, SectionID, TimeIn, TimeOut, DayOfWeek) VALUES (?, ?, ?, ?, ?, ?)',
                        [currentRecord.TeacherID, currentRecord.SubjectID, currentRecord.SectionID, currentRecord.TimeIn, currentRecord.TimeOut, dayOfWeek]
                    );
                    insertedIds.push(ins.insertId);
                    
                    await createAuditTrail({ userId: req.user.userId, action: 'Create schedule (from update)', tableAffected: 'teacherschedule', recordId: ins.insertId }).catch(() => {});
                }
                
                // Return the first created record for API compatibility
                const [newRows] = await pool.execute(
                    `SELECT ts.ScheduleID AS id,
                            COALESCE(sub.SubjectName, CAST(ts.SubjectID AS CHAR)) AS subject,
                            COALESCE(tr.FullName, ua.Username, CAST(ts.TeacherID AS CHAR)) AS teacher,
                            COALESCE(sec.SectionName, CAST(ts.SectionID AS CHAR)) AS section,
                            ts.DayOfWeek AS dayOfWeek,
                            ts.TimeIn AS startTime,
                            ts.TimeOut AS endTime
                     FROM teacherschedule ts
                     LEFT JOIN subject sub ON sub.SubjectID = ts.SubjectID
                     LEFT JOIN teacherrecord tr ON tr.UserID = ts.TeacherID
                     LEFT JOIN useraccount ua ON ua.UserID = ts.TeacherID
                     LEFT JOIN section sec ON sec.SectionID = ts.SectionID
                     WHERE ts.ScheduleID = ? LIMIT 1`,
                    [insertedIds[0]]
                );
                
                if (newRows && newRows.length > 0) {
                    const r = newRows[0];
                    return res.json({ success: true, data: {
                        id: r.id,
                        subject: r.subject || 'Subject',
                        teacher: r.teacher || '—',
                        section: r.section || null,
                        days: days,
                        startTime: (r.startTime || '').toString().slice(0,5),
                        endTime: (r.endTime || '').toString().slice(0,5)
                    }});
                }
            }
        }

        // Return updated row
        const [rows] = await pool.execute(
            `SELECT ts.ScheduleID AS id,
                    COALESCE(sub.SubjectName, CAST(ts.SubjectID AS CHAR)) AS subject,
                    COALESCE(tr.FullName, ua.Username, CAST(ts.TeacherID AS CHAR)) AS teacher,
                    ts.TeacherID AS teacherId,
                    ts.SectionID AS sectionId,
                    sec.SectionName AS sectionName,
                    sec.GradeLevel AS gradeLevel,
                    COALESCE(sec.SectionName, CAST(ts.SectionID AS CHAR)) AS section,
                    ts.DayOfWeek AS dayOfWeek,
                    ts.TimeIn AS startTime,
                    ts.TimeOut AS endTime,
                    ts.GracePeriod AS gracePeriod
             FROM teacherschedule ts
             LEFT JOIN subject sub ON sub.SubjectID = ts.SubjectID
             LEFT JOIN teacherrecord tr ON tr.UserID = ts.TeacherID
             LEFT JOIN useraccount ua ON ua.UserID = ts.TeacherID
             LEFT JOIN section sec ON sec.SectionID = ts.SectionID
             WHERE ts.ScheduleID = ? LIMIT 1`, [id]
        );
        const r = rows[0];
        return res.json({ success: true, data: {
            id: r.id,
            subject: r.subject || 'Subject',
            teacher: r.teacher || '—',
            teacherId: r.teacherId || 0,
            sectionId: r.sectionId || null,
            sectionName: r.sectionName || null,
            gradeLevel: r.gradeLevel || null,
            section: r.section || null,
            days: r.dayOfWeek ? [r.dayOfWeek] : [],
            startTime: (r.startTime || '').toString().slice(0,5),
            endTime: (r.endTime || '').toString().slice(0,5),
            gracePeriod: r.gracePeriod || 15
        }});
    } catch (error) {
        console.error('Update schedule error:', error);
        
        // Handle database constraint violations
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                success: false, 
                message: 'Schedule conflict: A schedule already exists for this teacher/section at this time',
                errorCode: 'DUPLICATE_SCHEDULE'
            });
        }
        
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.delete('/schedules/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute('DELETE FROM teacherschedule WHERE ScheduleID = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Schedule not found' });
        await createAuditTrail({ userId: req.user.userId, action: 'Delete schedule', tableAffected: 'teacherschedule', recordId: Number(id) }).catch(() => {});
        return res.json({ success: true, data: { id: Number(id) } });
    } catch (error) {
        console.error('Delete schedule error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// --- Sections ---
router.get('/sections', async (req, res) => {
    try {
        const { gradeLevel, isActive } = req.query;
        const sections = await getSections(gradeLevel, isActive === undefined ? true : isActive === 'true');
        
        const data = sections.map(section => ({
            id: section.SectionID,
            sectionName: section.SectionName,
            gradeLevel: section.GradeLevel,
            description: section.Description,
            capacity: section.Capacity,
            isActive: section.IsActive,
            createdAt: section.CreatedAt,
            updatedAt: section.UpdatedAt
        }));
        
        return res.json({ success: true, data });
    } catch (error) {
        console.error('List sections error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/sections', async (req, res) => {
    try {
        const { sectionName, gradeLevel, description, capacity, isActive = true } = req.body;
        
        if (!sectionName || !gradeLevel) {
            return res.status(400).json({ success: false, message: 'Section name and grade level are required' });
        }
        
        const sectionId = await createSection({
            sectionName,
            gradeLevel,
            description,
            capacity: capacity ? Number(capacity) : null,
            isActive
        });
        
        await createAuditTrail({ 
            userId: req.user.userId, 
            action: 'Create section', 
            tableAffected: 'section', 
            recordId: sectionId 
        }).catch(() => {});
        
        return res.status(201).json({ success: true, data: { id: sectionId } });
    } catch (error) {
        console.error('Create section error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.put('/sections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { sectionName, gradeLevel, description, capacity, isActive } = req.body;
        
        if (!sectionName || !gradeLevel) {
            return res.status(400).json({ success: false, message: 'Section name and grade level are required' });
        }
        
        const success = await updateSection(Number(id), {
            sectionName,
            gradeLevel,
            description,
            capacity: capacity ? Number(capacity) : null,
            isActive
        });
        
        if (!success) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }
        
        await createAuditTrail({ 
            userId: req.user.userId, 
            action: 'Update section', 
            tableAffected: 'section', 
            recordId: Number(id) 
        }).catch(() => {});
        
        return res.json({ success: true, message: 'Section updated successfully' });
    } catch (error) {
        console.error('Update section error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.delete('/sections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await deleteSection(Number(id));
        
        if (!success) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }
        
        await createAuditTrail({ 
            userId: req.user.userId, 
            action: 'Delete section', 
            tableAffected: 'section', 
            recordId: Number(id) 
        }).catch(() => {});
        
        return res.json({ success: true, message: 'Section deleted successfully' });
    } catch (error) {
        console.error('Delete section error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Note: Section schedules have been removed. All scheduling now uses the teacherschedule table.

// Students - list
router.get('/students', async (req, res) => {
	try {
		const rows = await getStudents();
		const data = rows.map(r => ({
			id: r.StudentID,
			name: r.FullName,
			gradeLevel: r.GradeLevel,
			section: r.section,
			sectionId: r.SectionID,
			sectionName: r.SectionName,
			sectionDescription: r.SectionDescription,
			sectionCapacity: r.SectionCapacity,
			parentContact: r.ParentContact || '',
			parentName: r.ParentName || '',
			hasFingerprint: !!r.HasFingerprint,
			status: r.Status || 'Active'
		}));
		return res.json({ success: true, data });
	} catch (error) {
		console.error('List students error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Students - create
router.post('/students', async (req, res) => {
	try {
		const { 
			name, 
			gradeLevel = null, 
			sectionId = null, 
			parentId = null, 
			parentContact = null,
			dateOfBirth = null,
			gender = null,
			placeOfBirth = null,
			nationality = null,
			address = null,
			additionalInfo = null
		} = req.body;
		if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
		const created = await createStudent({ 
			fullName: name, 
			gradeLevel, 
			sectionId, 
			parentId, 
			createdBy: req.user.userId,
			dateOfBirth,
			gender,
			placeOfBirth,
			nationality,
			address
		});
		if (parentContact && created?.StudentID) {
			await updateParentContactByStudentId(created.StudentID, parentContact).catch(() => {});
		}
		await createAuditTrail({ userId: req.user.userId, action: 'Create student', tableAffected: 'studentrecord', recordId: created?.StudentID ?? null }).catch(() => {});
		return res.status(201).json({ success: true, data: created });
	} catch (error) {
		console.error('Create student error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Students - update
router.put('/students/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, gradeLevel, sectionId, parentId, parentContact, dateOfBirth, gender, placeOfBirth, nationality, address, additionalInfo } = req.body;
		const updated = await updateStudent(Number(id), { fullName: name, gradeLevel, sectionId, parentId, dateOfBirth, gender, placeOfBirth, nationality, address, additionalInfo });
		if (!updated) return res.status(404).json({ success: false, message: 'Student not found' });
		if (parentContact) {
			await updateParentContactByStudentId(Number(id), parentContact).catch(() => {});
		}
		await createAuditTrail({ userId: req.user.userId, action: 'Update student', tableAffected: 'studentrecord', recordId: Number(id) }).catch(() => {});
		return res.json({ success: true, data: updated });
	} catch (error) {
		console.error('Update student error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Students - delete
router.delete('/students/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const ok = await deleteStudent(Number(id));
		if (!ok) return res.status(404).json({ success: false, message: 'Student not found' });
		await createAuditTrail({ userId: req.user.userId, action: 'Delete student', tableAffected: 'studentrecord', recordId: Number(id) }).catch(() => {});
		return res.json({ success: true, message: 'Student deleted' });
	} catch (error) {
		console.error('Delete student error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Students - set status (archive/restore)
router.put('/students/:id/status', async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;
		
		if (!status || !['Active', 'Archived'].includes(status)) {
			return res.status(400).json({ success: false, message: 'Invalid status. Must be Active or Archived' });
		}
		
		const ok = await setStudentStatus(Number(id), status);
		if (!ok) return res.status(404).json({ success: false, message: 'Student not found' });
		
		const action = status === 'Active' ? 'Restore student' : 'Archive student';
		await createAuditTrail({ userId: req.user.userId, action, tableAffected: 'studentrecord', recordId: Number(id) }).catch(() => {});
		
		return res.json({ success: true, message: `Student ${status.toLowerCase()} successfully` });
	} catch (error) {
		console.error('Set student status error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Parents - search
router.get('/parents', async (req, res) => {
	try {
		const q = (req.query.q || '').toString();
		if (!q) return res.json({ success: true, data: [] });
		const rows = await searchParents(q);
		return res.json({ success: true, data: rows });
	} catch (error) {
		console.error('Search parents error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Parents - create profile
router.post('/parents', async (req, res) => {
	try {
		const { fullName, contactInfo, userId } = req.body;
		if (!fullName || !userId) return res.status(400).json({ success: false, message: 'fullName and userId are required' });
		const row = await createParentProfile({ fullName, contactInfo, userId });
		return res.status(201).json({ success: true, data: row });
	} catch (error) {
		console.error('Create parent profile error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Parents - create user + profile
router.post('/parents/full', async (req, res) => {
	try {
		const { fullName, contactInfo, email, password } = req.body;
		if (!fullName || !email || !password) return res.status(400).json({ success: false, message: 'fullName, email, password are required' });
		const info = await createParentUserAndProfile({ fullName, contactInfo, email, password });
		return res.status(201).json({ success: true, data: info });
	} catch (error) {
		console.error('Create parent user/profile error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Subjects - typeahead search or list all
router.get('/subjects', async (req, res) => {
    try {
        const q = (req.query.q || '').toString();
        if (!q) {
            // Return all subjects when no query provided
            const [rows] = await pool.execute('SELECT SubjectID, SubjectName, Description FROM subject ORDER BY SubjectName');
            return res.json({ success: true, data: rows.map(r => ({ id: r.SubjectID, name: r.SubjectName, description: r.Description })) });
        }
        const like = `%${q}%`;
        const [rows] = await pool.execute('SELECT SubjectID, SubjectName, Description FROM subject WHERE SubjectName LIKE ? ORDER BY SubjectName LIMIT 20', [like]);
        return res.json({ success: true, data: rows.map(r => ({ id: r.SubjectID, name: r.SubjectName, description: r.Description })) });
    } catch (error) {
        console.error('Search subjects error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Teachers - list all teachers with full details
router.get('/teachers', async (req, res) => {
    try {
        const q = (req.query.q || '').toString();
        if (!q) {
            // Return all teachers when no query provided
            const [rows] = await pool.execute(`
                SELECT tr.TeacherID, tr.FullName, tr.ContactInfo, tr.HireDate, tr.Status, 
                       ua.Username, ua.UserID
                FROM teacherrecord tr
                LEFT JOIN useraccount ua ON ua.UserID = tr.UserID
                ORDER BY tr.FullName
            `);
            return res.json({ 
                success: true, 
                data: rows.map(r => ({ 
                    id: r.TeacherID, 
                    name: r.FullName,
                    contactInfo: r.ContactInfo,
                    hireDate: r.HireDate,
                    status: r.Status,
                    username: r.Username,
                    userId: r.UserID
                })) 
            });
        }
        
        // Search functionality
        const like = `%${q}%`;
        const isNumeric = /^\d+$/.test(q);
        let rows;
        if (isNumeric) {
            const [r] = await pool.execute(
                `SELECT tr.TeacherID, tr.FullName, tr.ContactInfo, tr.HireDate, tr.Status, ua.Username, ua.UserID
                 FROM teacherrecord tr
                 LEFT JOIN useraccount ua ON ua.UserID = tr.UserID
                 WHERE tr.TeacherID = ? OR CAST(tr.TeacherID AS CHAR) LIKE ?
                 ORDER BY tr.TeacherID
                 LIMIT 20`, [Number(q), like]
            );
            rows = r;
        } else {
            const [r] = await pool.execute(
                `SELECT tr.TeacherID, tr.FullName, tr.ContactInfo, tr.HireDate, tr.Status, ua.Username, ua.UserID
                 FROM teacherrecord tr
                 LEFT JOIN useraccount ua ON ua.UserID = tr.UserID
                 WHERE (tr.FullName LIKE ? OR ua.Username LIKE ?)
                 ORDER BY tr.FullName IS NULL, tr.FullName, ua.Username
                 LIMIT 20`, [like, like]
            );
            rows = r;
        }
        const data = rows.map(r => ({ 
            id: r.TeacherID, 
            name: r.FullName || (r.Username || '').split('@')[0],
            contactInfo: r.ContactInfo,
            hireDate: r.HireDate,
            status: r.Status,
            username: r.Username,
            userId: r.UserID
        }));
        return res.json({ success: true, data });
    } catch (error) {
        console.error('Search teachers error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Teacher CRUD operations
// Update teacher
router.put('/teachers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, contactInfo, hireDate, status } = req.body;
        
        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ success: false, message: 'Full name is required' });
        }

        const [result] = await pool.execute(
            'UPDATE teacherrecord SET FullName = ?, ContactInfo = ?, HireDate = ?, Status = ? WHERE TeacherID = ?',
            [fullName.trim(), contactInfo?.trim() || null, hireDate || null, status || 'Active', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        await createAuditTrail({ 
            userId: req.user.userId, 
            action: 'Update teacher', 
            tableAffected: 'teacherrecord', 
            recordId: Number(id) 
        }).catch(() => {});

        return res.json({ 
            success: true, 
            data: { 
                id: Number(id), 
                name: fullName.trim(), 
                contactInfo: contactInfo?.trim() || null,
                hireDate: hireDate || null,
                status: status || 'Active'
            },
            message: 'Teacher updated successfully' 
        });
    } catch (error) {
        console.error('Update teacher error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Sections - typeahead search (distinct from schedules and students)
router.get('/sections/search', async (req, res) => {
    try {
        const q = (req.query.q || '').toString();
        if (!q) return res.json({ success: true, data: [] });
        const like = `%${q}%`;
        const [rows] = await pool.execute(
            `SELECT DISTINCT SectionName as Section FROM section
            WHERE SectionName IS NOT NULL AND SectionName <> '' AND SectionName LIKE ?
            ORDER BY SectionName
            LIMIT 20`, [like]
        );
        return res.json({ success: true, data: rows.map(r => r.Section) });
    } catch (error) {
        console.error('Search sections error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Subject CRUD operations
// Create subject
router.post('/subjects', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Subject name is required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO subject (SubjectName, Description) VALUES (?, ?)',
            [name.trim(), description?.trim() || null]
        );

        await createAuditTrail({ 
            userId: req.user.userId, 
            action: 'Create subject', 
            tableAffected: 'subject', 
            recordId: result.insertId 
        }).catch(() => {});

        return res.json({ 
            success: true, 
            data: { id: result.insertId, name: name.trim(), description: description?.trim() || null },
            message: 'Subject created successfully' 
        });
    } catch (error) {
        console.error('Create subject error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Subject name already exists' });
        }
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Update subject
router.put('/subjects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Subject name is required' });
        }

        const [result] = await pool.execute(
            'UPDATE subject SET SubjectName = ?, Description = ? WHERE SubjectID = ?',
            [name.trim(), description?.trim() || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        await createAuditTrail({ 
            userId: req.user.userId, 
            action: 'Update subject', 
            tableAffected: 'subject', 
            recordId: Number(id) 
        }).catch(() => {});

        return res.json({ 
            success: true, 
            data: { id: Number(id), name: name.trim(), description: description?.trim() || null },
            message: 'Subject updated successfully' 
        });
    } catch (error) {
        console.error('Update subject error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Subject name already exists' });
        }
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Delete subject
router.delete('/subjects/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if subject is being used in schedules
        const [scheduleCheck] = await pool.execute(
            'SELECT COUNT(*) as count FROM teacherschedule WHERE SubjectID = ?',
            [id]
        );

        if (scheduleCheck[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete subject that is assigned to schedules' 
            });
        }

        // Check if subject is being used in student subjects
        const [studentSubjectCheck] = await pool.execute(
            'SELECT COUNT(*) as count FROM studentsubject WHERE SubjectID = ?',
            [id]
        );

        if (studentSubjectCheck[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete subject that is assigned to students' 
            });
        }

        const [result] = await pool.execute('DELETE FROM subject WHERE SubjectID = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        await createAuditTrail({ 
            userId: req.user.userId, 
            action: 'Delete subject', 
            tableAffected: 'subject', 
            recordId: Number(id) 
        }).catch(() => {});

        return res.json({ success: true, message: 'Subject deleted successfully' });
    } catch (error) {
        console.error('Delete subject error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ===== ENROLLMENT MANAGEMENT ENDPOINTS =====

// Get all pending enrollments
router.get('/enrollments', async (req, res) => {
    try {
        const { status = 'all', page = 1, limit = 10 } = req.query;
        const pageNum = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
        const limitNumEnroll = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
        const offsetNumEnroll = (pageNum - 1) * limitNumEnroll;

        let whereClause = '';
        let params = [];

        if (status !== 'all') {
            whereClause = 'WHERE sr.EnrollmentStatus = ?';
            params.push(status);
        }

        let query = `
            SELECT 
                sr.StudentID as id,
                sr.FullName as name,
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
                up.Username as parentEmail,
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
            LEFT JOIN useraccount up ON p.UserID = up.UserID
            LEFT JOIN enrollment_review er ON sr.StudentID = er.StudentID
            LEFT JOIN useraccount ua ON er.ReviewedByUserID = ua.UserID
            LEFT JOIN enrollment_documents ed ON sr.StudentID = ed.StudentID
            LEFT JOIN section sec ON sr.SectionID = sec.SectionID
            ${whereClause}
            ORDER BY sr.CreatedBy DESC
        `;

        // Inline sanitized numeric LIMIT/OFFSET to avoid MySQL parameter issues
        query += `\n            LIMIT ${limitNumEnroll} OFFSET ${offsetNumEnroll}`;

        // Do not push LIMIT/OFFSET as bound params since they are inlined

        const [enrollments] = await pool.execute(query, params);

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM studentrecord sr
            ${whereClause}
        `;
        const [countResult] = await pool.execute(countQuery, status !== 'all' ? [status] : []);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: enrollments,
            pagination: {
                page: pageNum,
                limit: limitNumEnroll,
                total,
                pages: Math.ceil(total / limitNumEnroll)
            }
        });
    } catch (error) {
        console.error('Get enrollments error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get enrollment statistics
router.get('/enrollments/stats', async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN EnrollmentStatus = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN EnrollmentStatus = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN EnrollmentStatus = 'declined' THEN 1 ELSE 0 END) as declined
            FROM studentrecord
        `);

        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Get enrollment stats error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get single enrollment details
router.get('/enrollments/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                sr.StudentID as id,
                sr.FullName as name,
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
                up.Username as parentEmail,
                p.ParentID as parentId,
                er.ReviewID as reviewId,
                er.Status as reviewStatus,
                er.ReviewDate as reviewDate,
                er.DeclineReason as declineReason,
                er.Notes as reviewNotes,
                er.ReviewedByUserID as reviewedBy,
                ua.Username as reviewedByUsername,
                ed.Documents as documents,
                ed.AdditionalInfo as additionalInfo,
                ed.SubmittedByUserID as submittedBy,
                ed.DocumentType as documentType,
                ed.FileName as fileName,
                ed.FileSize as fileSize,
                ed.MimeType as mimeType
            FROM studentrecord sr
            LEFT JOIN parent p ON sr.ParentID = p.ParentID
            LEFT JOIN useraccount up ON p.UserID = up.UserID
            LEFT JOIN enrollment_review er ON sr.StudentID = er.StudentID
            LEFT JOIN useraccount ua ON er.ReviewedByUserID = ua.UserID
            LEFT JOIN enrollment_documents ed ON sr.StudentID = ed.StudentID
            LEFT JOIN section sec ON sr.SectionID = sec.SectionID
            WHERE sr.StudentID = ?
        `;

        const [enrollments] = await pool.execute(query, [id]);

        if (enrollments.length === 0) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        res.json({
            success: true,
            data: enrollments[0]
        });
    } catch (error) {
        console.error('Get enrollment error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Approve enrollment
router.post('/enrollments/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { notes = null, scheduleAssignments = [], sectionId = null } = req.body;

        // Get connection for transaction
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // If sectionId provided, assign section to the student first
            if (sectionId) {
                // validate section exists
                const [sec] = await connection.execute('SELECT SectionID FROM section WHERE SectionID = ? LIMIT 1', [sectionId]);
                if (!Array.isArray(sec) || sec.length === 0) {
                    throw new Error('Selected section not found');
                }
                await connection.execute('UPDATE studentrecord SET SectionID = ? WHERE StudentID = ?', [sectionId, id]);
            }

            // Update student enrollment status and set status to Active
            await connection.execute(
                'UPDATE studentrecord SET EnrollmentStatus = ?, Status = ?, EnrollmentDate = NOW() WHERE StudentID = ?',
                ['approved', 'Active', id]
            );

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

            // Assign schedules if provided
            if (scheduleAssignments && scheduleAssignments.length > 0) {
                for (const assignment of scheduleAssignments) {
                    const { scheduleId } = assignment;
                    
                    // Validate schedule exists
                    const [schedule] = await connection.execute(`
                        SELECT ts.ScheduleID, ts.TeacherID, ts.SubjectID, ts.SectionID, sec.GradeLevel, sec.SectionName as Section,
                               s.SubjectName, tr.FullName as TeacherName
                        FROM teacherschedule ts
                        LEFT JOIN subject s ON s.SubjectID = ts.SubjectID
                        LEFT JOIN teacherrecord tr ON tr.UserID = ts.TeacherID
                        LEFT JOIN section sec ON sec.SectionID = ts.SectionID
                        WHERE ts.ScheduleID = ?
                    `, [scheduleId]);
                    
                    if (schedule.length === 0) {
                        throw new Error(`Schedule with ID ${scheduleId} not found`);
                    }
                    
                    const scheduleData = schedule[0];

                    // If sectionId was provided, ensure the schedule belongs to the same section
                    if (sectionId && scheduleData.SectionID && scheduleData.SectionID !== Number(sectionId)) {
                        throw new Error('Selected schedule does not belong to the chosen section');
                    }
                    
                    // Validate teacher exists and is active
                    const [teacher] = await connection.execute(
                        'SELECT UserID, Username, Status FROM useraccount WHERE UserID = ? AND Role = ?',
                        [scheduleData.TeacherID, 'Teacher']
                    );
                    
                    if (teacher.length === 0) {
                        throw new Error(`Teacher with ID ${scheduleData.TeacherID} not found`);
                    }
                    
                    if (teacher[0].Status !== 'Active') {
                        throw new Error(`Teacher ${teacher[0].Username} is not active`);
                    }
                    
                    // Check if assignment already exists
                    const [existing] = await connection.execute(
                        'SELECT StudentScheduleID FROM studentschedule WHERE StudentID = ? AND ScheduleID = ?',
                        [id, scheduleId]
                    );
                    
                    if (existing.length === 0) {
                        // Create the assignment
                        await connection.execute(
                            'INSERT INTO studentschedule (StudentID, ScheduleID, CreatedBy) VALUES (?, ?, ?)',
                            [id, scheduleId, req.user.userId]
                        );
                        
                        // Create audit trail for schedule assignment
                        await createAuditTrail({
                            userId: req.user.userId,
                            action: 'Assign schedule to student',
                            tableAffected: 'studentschedule',
                            recordId: null,
                            details: `Assigned schedule ${scheduleData.SubjectName} (${scheduleData.TeacherName}) to student during enrollment approval`
                        });
                    }
                }
            }

            // Create audit trail
            await createAuditTrail({
                userId: req.user.userId,
                action: 'Approve enrollment',
                tableAffected: 'studentrecord',
                recordId: parseInt(id)
            });

            await connection.commit();

            res.json({
                success: true,
                message: 'Enrollment approved successfully'
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
router.post('/enrollments/:id/decline', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, notes = null } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Decline reason is required' 
            });
        }

        // Get connection for transaction
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
                    ['declined', reason.trim(), notes, req.user.userId, id]
                );
            } else {
                // Get the student's created by user ID
                const [student] = await connection.execute(
                    'SELECT CreatedBy FROM studentrecord WHERE StudentID = ?',
                    [id]
                );
                
                await connection.execute(
                    'INSERT INTO enrollment_review (StudentID, SubmittedByUserID, Status, ReviewDate, DeclineReason, Notes, ReviewedByUserID) VALUES (?, ?, ?, NOW(), ?, ?, ?)',
                    [id, student[0].CreatedBy, 'declined', reason.trim(), notes, req.user.userId]
                );
            }

            // Create audit trail
            await createAuditTrail({
                userId: req.user.userId,
                action: 'Decline enrollment',
                tableAffected: 'studentrecord',
                recordId: parseInt(id)
            });

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

// ===== SUBJECT ASSIGNMENT ENDPOINTS =====

// Get all student-subject assignments
router.get('/student-subjects', async (req, res) => {
    try {
        const { studentId, subjectId, teacherId, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let params = [];

        if (studentId) {
            whereConditions.push('ss.StudentID = ?');
            params.push(Number(studentId));
        }
        if (subjectId) {
            whereConditions.push('ss.SubjectID = ?');
            params.push(Number(subjectId));
        }
        if (teacherId) {
            whereConditions.push('ss.TeacherID = ?');
            params.push(Number(teacherId));
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const query = `
            SELECT 
                ss.StudentSubjectID as id,
                ss.StudentID as studentId,
                ss.SubjectID as subjectId,
                ss.TeacherID as teacherId,
                sr.FullName as studentName,
                sr.GradeLevel as gradeLevel,
                sec.SectionName as section,
                s.SubjectName as subjectName,
                s.Description as subjectDescription,
                tr.FullName as teacherName,
                ua.Username as teacherUsername
            FROM studentsubject ss
            LEFT JOIN studentrecord sr ON sr.StudentID = ss.StudentID
            LEFT JOIN section sec ON sec.SectionID = sr.SectionID
            LEFT JOIN subject s ON s.SubjectID = ss.SubjectID
            LEFT JOIN teacherrecord tr ON tr.UserID = ss.TeacherID
            LEFT JOIN useraccount ua ON ua.UserID = ss.TeacherID
            ${whereClause}
            ORDER BY sr.FullName, s.SubjectName
            LIMIT ? OFFSET ?
        `;

        params.push(Number(limit), offset);

        const [rows] = await pool.execute(query, params);

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM studentsubject ss
            LEFT JOIN studentrecord sr ON sr.StudentID = ss.StudentID
            LEFT JOIN subject s ON s.SubjectID = ss.SubjectID
            LEFT JOIN teacherrecord tr ON tr.UserID = ss.TeacherID
            LEFT JOIN useraccount ua ON ua.UserID = ss.TeacherID
            ${whereClause}
        `;

        const [countResult] = await pool.execute(countQuery, params.slice(0, -2));
        const total = countResult[0].total;

        res.json({
            success: true,
            data: rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get student subjects error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get students without subject assignments
router.get('/students-without-subjects', async (req, res) => {
    try {
        const { gradeLevel, section } = req.query;

        let whereConditions = ['sr.EnrollmentStatus = ?'];
        let params = ['approved'];

        if (gradeLevel) {
            whereConditions.push('sr.GradeLevel = ?');
            params.push(gradeLevel);
        }
        if (section) {
            whereConditions.push('sec.SectionName = ?');
            params.push(section);
        }

        const whereClause = 'WHERE ' + whereConditions.join(' AND ');

        const query = `
            SELECT 
                sr.StudentID as id,
                sr.FullName as name,
                sr.GradeLevel as gradeLevel,
                sec.SectionName as section,
                sr.DateOfBirth as dateOfBirth,
                sr.Gender as gender,
                p.FullName as parentName,
                p.ContactInfo as parentContact
            FROM studentrecord sr
            LEFT JOIN section sec ON sec.SectionID = sr.SectionID
            LEFT JOIN parent p ON p.ParentID = sr.ParentID
            LEFT JOIN studentsubject ss ON ss.StudentID = sr.StudentID
            ${whereClause}
            AND ss.StudentID IS NULL
            ORDER BY sr.FullName
        `;

        const [rows] = await pool.execute(query, params);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Get students without subjects error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Assign subject to student
router.post('/student-subjects', async (req, res) => {
    try {
        const { studentId, subjectId, teacherId } = req.body;

        if (!studentId || !subjectId || !teacherId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Student ID, Subject ID, and Teacher ID are required' 
            });
        }

        // Check if assignment already exists
        const [existing] = await pool.execute(
            'SELECT StudentSubjectID FROM studentsubject WHERE StudentID = ? AND SubjectID = ? AND TeacherID = ?',
            [studentId, subjectId, teacherId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'This subject assignment already exists' 
            });
        }

        // Verify student exists and is approved
        const [student] = await pool.execute(
            'SELECT StudentID, FullName, EnrollmentStatus FROM studentrecord WHERE StudentID = ?',
            [studentId]
        );

        if (student.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        if (student[0].EnrollmentStatus !== 'approved') {
            return res.status(400).json({ 
                success: false, 
                message: 'Can only assign subjects to approved students' 
            });
        }

        // Verify subject exists
        const [subject] = await pool.execute(
            'SELECT SubjectID, SubjectName FROM subject WHERE SubjectID = ?',
            [subjectId]
        );

        if (subject.length === 0) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        // Verify teacher exists and is active
        const [teacher] = await pool.execute(
            'SELECT UserID, Username, Status FROM useraccount WHERE UserID = ? AND Role = ?',
            [teacherId, 'Teacher']
        );

        if (teacher.length === 0) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        if (teacher[0].Status !== 'Active') {
            return res.status(400).json({ 
                success: false, 
                message: 'Can only assign subjects to active teachers' 
            });
        }

        // Create the assignment
        const [result] = await pool.execute(
            'INSERT INTO studentsubject (StudentID, SubjectID, TeacherID) VALUES (?, ?, ?)',
            [studentId, subjectId, teacherId]
        );

        // Create audit trail
        await createAuditTrail({
            userId: req.user.userId,
            action: 'Assign subject to student',
            tableAffected: 'studentsubject',
            recordId: result.insertId,
            details: `Assigned ${subject[0].SubjectName} to ${student[0].FullName}`
        });

        res.json({
            success: true,
            message: 'Subject assigned successfully',
            data: {
                id: result.insertId,
                studentId,
                subjectId,
                teacherId
            }
        });
    } catch (error) {
        console.error('Assign subject error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Remove subject assignment
router.delete('/student-subjects/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get assignment details for audit trail
        const [assignment] = await pool.execute(`
            SELECT ss.StudentSubjectID, ss.StudentID, ss.SubjectID, ss.TeacherID,
                   sr.FullName as studentName, s.SubjectName as subjectName
            FROM studentsubject ss
            LEFT JOIN studentrecord sr ON sr.StudentID = ss.StudentID
            LEFT JOIN subject s ON s.SubjectID = ss.SubjectID
            WHERE ss.StudentSubjectID = ?
        `, [id]);

        if (assignment.length === 0) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        // Delete the assignment
        const [result] = await pool.execute(
            'DELETE FROM studentsubject WHERE StudentSubjectID = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        // Create audit trail
        await createAuditTrail({
            userId: req.user.userId,
            action: 'Remove subject assignment',
            tableAffected: 'studentsubject',
            recordId: parseInt(id),
            details: `Removed ${assignment[0].subjectName} from ${assignment[0].studentName}`
        });

        res.json({
            success: true,
            message: 'Subject assignment removed successfully'
        });
    } catch (error) {
        console.error('Remove subject assignment error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get subject assignment statistics
router.get('/student-subjects/stats', async (req, res) => {
    try {
        // Total assignments
        const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM studentsubject');
        const total = totalResult[0].total;

        // Students with subjects
        const [studentsWithSubjectsResult] = await pool.execute(`
            SELECT COUNT(DISTINCT StudentID) as count 
            FROM studentsubject
        `);
        const studentsWithSubjects = studentsWithSubjectsResult[0].count;

        // Students without subjects
        const [studentsWithoutSubjectsResult] = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM studentrecord 
            WHERE EnrollmentStatus = 'approved' 
            AND StudentID NOT IN (SELECT DISTINCT StudentID FROM studentsubject)
        `);
        const studentsWithoutSubjects = studentsWithoutSubjectsResult[0].count;

        // Subjects with assignments
        const [subjectsWithAssignmentsResult] = await pool.execute(`
            SELECT COUNT(DISTINCT SubjectID) as count 
            FROM studentsubject
        `);
        const subjectsWithAssignments = subjectsWithAssignmentsResult[0].count;

        // Teachers with assignments
        const [teachersWithAssignmentsResult] = await pool.execute(`
            SELECT COUNT(DISTINCT TeacherID) as count 
            FROM studentsubject
        `);
        const teachersWithAssignments = teachersWithAssignmentsResult[0].count;

        res.json({
            success: true,
            data: {
                totalAssignments: total,
                studentsWithSubjects,
                studentsWithoutSubjects,
                subjectsWithAssignments,
                teachersWithAssignments
            }
        });
    } catch (error) {
        console.error('Get subject assignment stats error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ===== STUDENT SCHEDULE ASSIGNMENT ENDPOINTS =====

// Get all student schedule assignments
router.get('/student-schedules', async (req, res) => {
    try {
        const { studentId, scheduleId } = req.query;
        // Sanitize pagination inputs as integers
        const pageNum = Math.max(1, parseInt(req.query.page ?? '1', 10) || 1);
        const limitNum = Math.max(1, parseInt(req.query.limit ?? '50', 10) || 50);
        const offsetNum = (pageNum - 1) * limitNum;

        let whereConditions = [];
        let params = [];

        if (studentId) {
            whereConditions.push('ss.StudentID = ?');
            params.push(Number(studentId));
        }
        if (scheduleId) {
            whereConditions.push('ss.ScheduleID = ?');
            params.push(Number(scheduleId));
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        let query = `
            SELECT 
                ss.StudentScheduleID as id,
                ss.StudentID as studentId,
                ss.ScheduleID as scheduleId,
                sr.FullName as studentName,
                sr.GradeLevel as gradeLevel,
                sec.SectionName as section,
                s.SubjectName as subjectName,
                s.SubjectID as subjectId,
                tr.FullName as teacherName,
                tr.UserID as teacherId,
                ts.TimeIn as startTime,
                ts.TimeOut as endTime,
                ts.DayOfWeek as days
            FROM studentschedule ss
            LEFT JOIN studentrecord sr ON sr.StudentID = ss.StudentID
            LEFT JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
            LEFT JOIN subject s ON s.SubjectID = ts.SubjectID
            LEFT JOIN teacherrecord tr ON tr.UserID = ts.TeacherID
            LEFT JOIN section sec ON sec.SectionID = ts.SectionID
            ${whereClause}
            ORDER BY sr.FullName, s.SubjectName
        `;

        // Inline sanitized numeric LIMIT/OFFSET to avoid MySQL prepared stmt quirks
        query += `\n            LIMIT ${limitNum} OFFSET ${offsetNum}`;

        const [rows] = await pool.execute(query, params);

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM studentschedule ss
            LEFT JOIN studentrecord sr ON sr.StudentID = ss.StudentID
            LEFT JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
            LEFT JOIN subject s ON s.SubjectID = ts.SubjectID
            LEFT JOIN teacherrecord tr ON tr.UserID = ts.TeacherID
            LEFT JOIN section sec ON sec.SectionID = ts.SectionID
            ${whereClause}
        `;

        // Pass only WHERE params to count (params currently contains only WHERE params)
        const [countResult] = await pool.execute(countQuery, params);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: rows,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Get student schedules error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Assign schedule to student
router.post('/student-schedules', async (req, res) => {
    try {
        const { studentId, scheduleId } = req.body;

        if (!studentId || !scheduleId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Student ID and Schedule ID are required' 
            });
        }

        // Check if assignment already exists
        const [existing] = await pool.execute(
            'SELECT StudentScheduleID FROM studentschedule WHERE StudentID = ? AND ScheduleID = ?',
            [studentId, scheduleId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'This schedule assignment already exists' 
            });
        }

        // Verify student exists and is approved
        const [student] = await pool.execute(
            'SELECT StudentID, FullName, EnrollmentStatus FROM studentrecord WHERE StudentID = ?',
            [studentId]
        );

        if (student.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        if (student[0].EnrollmentStatus !== 'approved') {
            return res.status(400).json({ 
                success: false, 
                message: 'Can only assign schedules to approved students' 
            });
        }

        // Verify schedule exists
        const [schedule] = await pool.execute(
            'SELECT ScheduleID, TeacherID, SubjectID FROM teacherschedule WHERE ScheduleID = ?',
            [scheduleId]
        );

        if (schedule.length === 0) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }

        // Create the assignment
        const [result] = await pool.execute(
            'INSERT INTO studentschedule (StudentID, ScheduleID, CreatedBy) VALUES (?, ?, ?)',
            [studentId, scheduleId, req.user?.userId || null]
        );

        // Create audit trail
        await createAuditTrail({
            userId: req.user?.userId, 
            action: 'Assign schedule to student', 
            tableAffected: 'studentschedule', 
            recordId: result.insertId 
        }).catch(() => {});

        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                studentId,
                scheduleId
            }
        });
    } catch (error) {
        console.error('Assign schedule error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Assign multiple schedules to student (bulk)
router.post('/student-schedules/bulk', async (req, res) => {
    try {
        const { assignments } = req.body;

        if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Assignments array is required and must not be empty' 
            });
        }

        // Validate all assignments
        for (const assignment of assignments) {
            if (!assignment.studentId || !assignment.scheduleId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Each assignment must have studentId and scheduleId' 
                });
            }
        }

        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const results = [];
            const errors = [];

            for (const assignment of assignments) {
                const { studentId, scheduleId } = assignment;

                try {
                    // Check if assignment already exists
                    const [existing] = await connection.execute(
                        'SELECT StudentScheduleID FROM studentschedule WHERE StudentID = ? AND ScheduleID = ?',
                        [studentId, scheduleId]
                    );

                    if (existing.length > 0) {
                        errors.push(`Schedule ${scheduleId} already assigned to student ${studentId}`);
                        continue;
                    }

                    // Verify student exists and is approved
                    const [student] = await connection.execute(
                        'SELECT StudentID, FullName, EnrollmentStatus FROM studentrecord WHERE StudentID = ?',
                        [studentId]
                    );

                    if (student.length === 0) {
                        errors.push(`Student ${studentId} not found`);
                        continue;
                    }

                    if (student[0].EnrollmentStatus !== 'approved') {
                        errors.push(`Student ${studentId} is not approved`);
                        continue;
                    }

                    // Verify schedule exists
                    const [schedule] = await connection.execute(
                        'SELECT ScheduleID, TeacherID, SubjectID FROM teacherschedule WHERE ScheduleID = ?',
                        [scheduleId]
                    );

                    if (schedule.length === 0) {
                        errors.push(`Schedule ${scheduleId} not found`);
                        continue;
                    }

                    // Create the assignment
                    const [result] = await connection.execute(
                        'INSERT INTO studentschedule (StudentID, ScheduleID, CreatedBy) VALUES (?, ?, ?)',
                        [studentId, scheduleId, req.user?.userId || null]
                    );

                    results.push({
                        id: result.insertId,
                        studentId,
                        scheduleId
                    });

                    // Create audit trail
                    await createAuditTrail({
                        userId: req.user?.userId, 
                        action: 'Assign schedule to student', 
                        tableAffected: 'studentschedule', 
                        recordId: result.insertId 
                    }).catch(() => {});

                } catch (error) {
                    console.error(`Error assigning schedule ${scheduleId} to student ${studentId}:`, error);
                    errors.push(`Failed to assign schedule ${scheduleId} to student ${studentId}: ${error.message}`);
                }
            }

            await connection.commit();

            res.status(201).json({
                success: true,
                data: {
                    created: results,
                    errors: errors,
                    total: assignments.length,
                    successful: results.length,
                    failed: errors.length
                }
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Bulk assign schedules error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Remove schedule assignment
router.delete('/student-schedules/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get assignment details for audit trail
        const [assignment] = await pool.execute(`
            SELECT ss.StudentScheduleID, ss.StudentID, ss.ScheduleID,
                   sr.FullName as studentName, s.SubjectName as subjectName
            FROM studentschedule ss
            LEFT JOIN studentrecord sr ON sr.StudentID = ss.StudentID
            LEFT JOIN teacherschedule ts ON ts.ScheduleID = ss.ScheduleID
            LEFT JOIN subject s ON s.SubjectID = ts.SubjectID
            WHERE ss.StudentScheduleID = ?
        `, [id]);

        if (assignment.length === 0) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        // Delete the assignment
        await pool.execute('DELETE FROM studentschedule WHERE StudentScheduleID = ?', [id]);

        // Create audit trail
        await createAuditTrail({ 
            userId: req.user?.userId, 
            action: 'Remove schedule assignment', 
            tableAffected: 'studentschedule', 
            recordId: id 
        }).catch(() => {});

        res.json({ success: true, message: 'Schedule assignment removed successfully' });
    } catch (error) {
        console.error('Remove schedule assignment error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router; 