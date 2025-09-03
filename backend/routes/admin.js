import express from 'express';
import {
	getAllUsers,
	findUserById,
	updateUser,
	deleteUser,
	updateUserStatus,
	getAuditTrail,
	createAuditTrail,
	getRegistrations,
	reviewRegistration,
	getAttendanceReports,
	createAttendanceReport,
	getStudents,
	createStudent,
	updateStudent,
	deleteStudent,
	updateParentContactByStudentId,
	searchParents,
	createParentProfile,
	createParentUserAndProfile,
	findUserByEmail,
	createUser as dbCreateUser,
	pool,
	getAttendanceLog
} from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Ensure admin for all routes in this file
router.use(authenticateToken, requireAdmin);

// Users - list with status and name (parent FullName; teacher from email)
router.get('/users', async (req, res) => {
	try {
		try {
			const [rows] = await pool.execute(
				`SELECT ua.UserID, ua.Username, ua.Role, ua.Status, p.FullName AS ParentName
				 FROM useraccount ua
				 LEFT JOIN parent p ON p.UserID = ua.UserID
				 ORDER BY ua.UserID`
			);
			const formatted = rows.map((u) => {
				const role = (u.Role || '').toLowerCase();
				const status = (u.Status || '').toLowerCase();
				let name = '';
				if (role === 'parent') name = u.ParentName || (u.Username || '').split('@')[0];
				else if (role === 'teacher') name = (u.Username || '').split('@')[0];
				return { id: u.UserID, email: u.Username, role, status, name };
			});
			return res.json({ success: true, data: formatted });
		} catch (e) {
			// Fallback if join fails (e.g., parent table missing)
			const users = await getAllUsers();
			const formatted = users.map(u => {
				const role = (u.Role || '').toLowerCase();
				const status = (u.Status || '').toLowerCase();
				let name = '';
				if (role === 'teacher' || role === 'parent') name = (u.Username || '').split('@')[0];
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
router.post('/users', async (req, res) => {
	try {
		const { email, password, role, status = 'Active' } = req.body;
		if (!email || !password || !role) {
			return res.status(400).json({ success: false, message: 'email, password, and role are required' });
		}

		// Check duplicate email
		const existing = await findUserByEmail(email);
		if (existing) {
			return res.status(409).json({ success: false, message: 'Email already exists' });
		}

		const passwordHash = await bcrypt.hash(password, 10);
		const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
		const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

		// db create (without Status column in helper) → set status afterward if needed
		const created = await dbCreateUser({ username: email, passwordHash, role: normalizedRole });
		if (!created) {
			return res.status(500).json({ success: false, message: 'Failed to create user' });
		}

		if (normalizedStatus) {
			await updateUserStatus(created.UserID, normalizedStatus).catch(() => {});
		}

		await createAuditTrail({ userId: req.user.userId, action: 'Create user', tableAffected: 'useraccount', recordId: created.UserID }).catch(() => {});

		return res.status(201).json({
			success: true,
			data: { id: created.UserID, email: created.Username, role: normalizedRole.toLowerCase(), status: normalizedStatus.toLowerCase(), name: normalizedRole.toLowerCase() === 'teacher' ? (created.Username || '').split('@')[0] : '' }
		});
	} catch (error) {
		console.error('Create user error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Users - get by id (include name)
router.get('/users/:id', async (req, res) => {
	try {
		const { id } = req.params;
		try {
			const [rows] = await pool.execute(
				`SELECT ua.UserID, ua.Username, ua.Role, ua.Status, p.FullName AS ParentName
				 FROM useraccount ua
				 LEFT JOIN parent p ON p.UserID = ua.UserID
				 WHERE ua.UserID = ? LIMIT 1`,
				[id]
			);
			const u = rows[0];
			if (!u) return res.status(404).json({ success: false, message: 'User not found' });
			const role = (u.Role || '').toLowerCase();
			const status = (u.Status || '').toLowerCase();
			let name = '';
			if (role === 'parent') name = u.ParentName || (u.Username || '').split('@')[0];
			else if (role === 'teacher') name = (u.Username || '').split('@')[0];
			return res.json({ success: true, data: { id: u.UserID, email: u.Username, role, status, name } });
		} catch (e) {
			const user = await findUserById(id);
			if (!user) return res.status(404).json({ success: false, message: 'User not found' });
			const role = (user.Role || '').toLowerCase();
			const status = (user.Status || '').toLowerCase();
			const name = role === 'teacher' ? (user.Username || '').split('@')[0] : '';
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
		const { email, role, password, status } = req.body;

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

		await createAuditTrail({ userId: req.user.userId, action: 'Update user', tableAffected: 'useraccount', recordId: Number(id) }).catch(() => {});

		const [rows] = await pool.execute(
			`SELECT ua.UserID, ua.Username, ua.Role, ua.Status, p.FullName AS ParentName
			 FROM useraccount ua
			 LEFT JOIN parent p ON p.UserID = ua.UserID
			 WHERE ua.UserID = ? LIMIT 1`,
			[id]
		);
		const u = rows[0];
		const roleLower = (u.Role || '').toLowerCase();
		const statusLower = (u.Status || '').toLowerCase();
		let name = '';
		if (roleLower === 'parent' && u.ParentName) name = u.ParentName;
		else if (roleLower === 'teacher') name = (u.Username || '').split('@')[0];
		return res.json({ success: true, data: { id: u.UserID, email: u.Username, role: roleLower, status: statusLower, name } });
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
		const { status } = req.body; // 'Active' | 'Pending' | 'Disabled'
		const validStatuses = ['Active', 'Pending', 'Disabled'];
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

// Registrations - list by status
router.get('/registrations', async (req, res) => {
	try {
		const { status = 'Pending' } = req.query; // Pending | Approved | Denied
		const regs = await getRegistrations({ status });
		return res.json({ success: true, data: regs });
	} catch (error) {
		console.error('Get registrations error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

// Registrations - review
router.post('/registrations/:id/review', async (req, res) => {
	try {
		const { id } = req.params;
		const { decision } = req.body; // 'Approved' | 'Denied'
		if (!['Approved', 'Denied'].includes(decision)) {
			return res.status(400).json({ success: false, message: 'Invalid decision' });
		}
		const result = await reviewRegistration({ registrationId: id, reviewerUserId: req.user.userId, decision });
		if (!result.updated) {
			return res.status(404).json({ success: false, message: 'Registration not found' });
		}
		await createAuditTrail({ userId: req.user.userId, action: `Review registration: ${decision}`, tableAffected: 'registration', recordId: Number(id) }).catch(() => {});
		return res.json({ success: true, message: `Registration ${decision.toLowerCase()}`, data: { createdUserId: result.createdUserId } });
	} catch (error) {
		console.error('Review registration error:', error);
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

// Students - list
router.get('/students', async (req, res) => {
	try {
		const rows = await getStudents();
		const data = rows.map(r => ({
			id: r.StudentID,
			name: r.FullName,
			gradeLevel: r.GradeLevel,
			section: r.Section,
			parentContact: r.ParentContact || '',
			parentName: r.ParentName || '',
			hasFingerprint: !!r.HasFingerprint
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
		const { name, gradeLevel = null, section = null, parentId = null, parentContact = null } = req.body;
		if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
		const created = await createStudent({ fullName: name, gradeLevel, section, parentId, createdBy: req.user.userId });
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
		const { name, gradeLevel, section, parentId, parentContact } = req.body;
		const updated = await updateStudent(Number(id), { fullName: name, gradeLevel, section, parentId });
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

export default router; 