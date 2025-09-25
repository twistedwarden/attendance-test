export interface AdminUser {
	id: number;
	email: string;
	role: 'admin' | 'teacher' | 'parent' | 'registrar' | 'superadmin' | '';
	status: 'active' | 'pending' | 'archived' | '';
	name?: string;
	firstName?: string;
	middleName?: string;
	lastName?: string;
	contactInfo?: string;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const getToken = (): string | null => {
	return localStorage.getItem('auth_token');
};

export const AdminService = {
	async listUsers(): Promise<AdminUser[]> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/users`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
		return (data.data || []) as AdminUser[];
	},

	async createUser(payload: { email: string; password: string; role: 'admin'|'teacher'|'parent'|'registrar'|'superadmin'; status?: 'Active'|'Pending'|'Disabled'; firstName?: string; middleName?: string; lastName?: string; contactInfo?: string; }): Promise<AdminUser> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/users`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to create user');
		return data.data as AdminUser;
	},

	async getUser(id: number): Promise<AdminUser> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch user');
		return data.data as AdminUser;
	},

	async updateUser(id: number, payload: { email?: string; role?: 'admin'|'teacher'|'parent'|'registrar'|'superadmin'; password?: string; status?: 'Active'|'Pending'|'Disabled'; firstName?: string; middleName?: string; lastName?: string; contactInfo?: string; }): Promise<AdminUser> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
			method: 'PUT',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to update user');
		return data.data as AdminUser;
	},

	async deleteUser(id: number): Promise<boolean> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
			method: 'DELETE',
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to delete user');
		return true;
	},

	// Students
	async listStudents() {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/students`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch students');
		return data.data || [];
	},

	async createStudent(payload: { name: string; gradeLevel?: string | null; sectionId?: number | null; parentId?: number | null; dateOfBirth?: string | null; gender?: string | null; placeOfBirth?: string | null; nationality?: string | null; address?: string | null; additionalInfo?: string | null; }) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const body = Object.fromEntries(Object.entries(payload as any).map(([k, v]) => [k, v === undefined ? null : v]));
		const res = await fetch(`${API_BASE_URL}/admin/students`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to create student');
		return data.data;
	},

	async updateStudent(id: number, payload: { name?: string; gradeLevel?: string | null; sectionId?: number | null; parentId?: number | null; dateOfBirth?: string | null; gender?: string | null; placeOfBirth?: string | null; nationality?: string | null; address?: string | null; additionalInfo?: string | null; }) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const body = Object.fromEntries(Object.entries(payload as any).map(([k, v]) => [k, v === undefined ? null : v]));
		const res = await fetch(`${API_BASE_URL}/admin/students/${id}`, {
			method: 'PUT',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to update student');
		return data.data;
	},

	async deleteStudent(id: number) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/students/${id}`, {
			method: 'DELETE',
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to delete student');
		return true;
	},

	async setStudentStatus(studentId: number, status: 'Active' | 'Archived') {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/students/${studentId}/status`, {
			method: 'PUT',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ status })
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to update student status');
		return data.data;
	},

	async setUserStatus(userId: number, status: 'Active' | 'Pending' | 'Disabled') {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
			method: 'PUT',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ status })
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to update status');
		return data.data;
	},


	async listAuditTrail(limit = 50, offset = 0) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/audittrail?limit=${limit}&offset=${offset}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch audit trail');
		return data.data || [];
	},

	async purgeAuditTrail(beforeDays = 90) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/audittrail/purge`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ beforeDays })
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to purge audit trail');
		return data.data;
	},

	async listReports(limit = 50, offset = 0) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/reports?limit=${limit}&offset=${offset}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch reports');
		return data.data || [];
	},

	async listAttendanceLog(limit = 50, offset = 0, date?: string) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const qs = new URLSearchParams();
		qs.set('limit', String(limit));
		qs.set('offset', String(offset));
		if (date) qs.set('date', date);
		const res = await fetch(`${API_BASE_URL}/admin/attendancelog?${qs.toString()}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch attendance log');
		return data.data || [];
	},

	async createManualAttendance(payload: { studentId: number; date?: string | null; timeIn?: string | null; timeOut?: string | null; status?: 'Present'|'Excused'; }) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/attendancelog`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to create attendance');
		return data.data;
	},

	// System settings - enrollment enabled flag
	async getEnrollmentEnabled() {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/settings/enrollment`, { headers: { 'Authorization': `Bearer ${token}` } });
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch setting');
		return Boolean(data?.data?.enabled);
	},

	async setEnrollmentEnabled(enabled: boolean) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/settings/enrollment`, {
			method: 'PUT',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ enabled })
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to update setting');
		return Boolean(data?.data?.enabled);
	},

	// Parents
	async searchParents(q: string) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/parents?q=${encodeURIComponent(q)}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to search parents');
		return data.data || [];
	},

	async createParentProfile(payload: { fullName: string; contactInfo?: string | null; userId: number; }) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/parents`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to create parent profile');
		return data.data;
	},

	async createParentFull(payload: { fullName: string; contactInfo?: string | null; relationship?: string | null; email: string; password: string; }) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/parents/full`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to create parent');
		return data.data;
	},

	async createReport(payload: { studentId?: number | null; scheduleId?: number | null; dateRangeStart: string; dateRangeEnd: string; reportType: 'Daily'|'Weekly'|'Monthly'|'Per Subject'|'Per Section'; }) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/reports`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to create report');
		return data.data;
	},

	async exportReport(type: 'attendance'|'subject-attendance'|'tardiness'|'absences'|'students', params: { dateFrom?: string; dateTo?: string; studentId?: number; scheduleId?: number; }) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const qs = new URLSearchParams();
		qs.set('type', type);
		if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
		if (params.dateTo) qs.set('dateTo', params.dateTo);
		if (params.studentId) qs.set('studentId', String(params.studentId));
		if (params.scheduleId) qs.set('scheduleId', String(params.scheduleId));
		const res = await fetch(`${API_BASE_URL}/admin/reports/export?${qs.toString()}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		if (!res.ok) throw new Error('Failed to export report');
		const blob = await res.blob();
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `admin-${type}-${new Date().toISOString().split('T')[0]}.csv`;
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	},

	// Schedules
	async listSchedules() {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/schedules`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch schedules');
		return data.data || [];
	},

	async createSchedule(payload: { subject: string; teacher: string; sectionId?: number | null; gradeLevel?: string | null; days: string[]; startTime: string; endTime: string; }) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/schedules`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		if (!res.ok) {
			// Create a more detailed error with conflict information
			const error = new Error(data.message || 'Failed to create schedule');
			(error as any).conflicts = data.conflicts;
			(error as any).errors = data.errors;
			(error as any).status = res.status;
			throw error;
		}
		return data.data;
	},

	async updateSchedule(id: number, payload: { subject?: string; teacher?: string; sectionId?: number | null; gradeLevel?: string | null; startTime?: string; endTime?: string; days?: string[]; }) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/schedules/${id}`, {
			method: 'PUT',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const data = await res.json();
		if (!res.ok) {
			// Create a more detailed error with conflict information
			const error = new Error(data.message || 'Failed to update schedule');
			(error as any).conflicts = data.conflicts;
			(error as any).errors = data.errors;
			(error as any).status = res.status;
			throw error;
		}
		return data.data;
	},

	async deleteSchedule(id: number) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/schedules/${id}`, {
			method: 'DELETE',
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to delete schedule');
		return true;
	},

	async searchSubjects(q: string): Promise<string[]> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const params = q ? `?q=${encodeURIComponent(q)}` : '';
		const res = await fetch(`${API_BASE_URL}/admin/subjects${params}`, { headers: { 'Authorization': `Bearer ${token}` } });
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to search subjects');
		return (data.data || []).map((subject: any) => subject.name || subject.SubjectName || '');
	},

	async searchTeachers(q: string): Promise<{ id: number; name: string }[]> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const params = q ? `?q=${encodeURIComponent(q)}` : '';
		const res = await fetch(`${API_BASE_URL}/admin/teachers${params}`, { headers: { 'Authorization': `Bearer ${token}` } });
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to search teachers');
		return data.data || [];
	},

	async searchSections(q: string): Promise<string[]> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const params = q ? `?q=${encodeURIComponent(q)}` : '';
		const res = await fetch(`${API_BASE_URL}/admin/sections/search${params}`, { headers: { 'Authorization': `Bearer ${token}` } });
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to search sections');
		return data.data || [];
	},

	// Subject attendance
	async listSubjectAttendance(limit = 50, offset = 0, subjectId?: number, date?: string, studentId?: number) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const qs = new URLSearchParams();
		qs.set('limit', String(limit));
		qs.set('offset', String(offset));
		if (subjectId) qs.set('subjectId', String(subjectId));
		if (date) qs.set('date', date);
		if (studentId) qs.set('studentId', String(studentId));
		const res = await fetch(`${API_BASE_URL}/admin/subjectattendance?${qs.toString()}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch subject attendance');
		return data.data || [];
	},

	async getAllSubjects(): Promise<{ id: number; name: string; description?: string }[]> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/subjects`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch subjects');
		return data.data || [];
	},

	// Subject CRUD operations
	async createSubject(payload: { name: string; description?: string }): Promise<{ id: number; name: string; description?: string }> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/subjects`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to create subject');
		return data.data;
	},

	async updateSubject(id: number, payload: { name: string; description?: string }): Promise<{ id: number; name: string; description?: string }> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/subjects/${id}`, {
			method: 'PUT',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to update subject');
		return data.data;
	},

	async deleteSubject(id: number): Promise<boolean> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/subjects/${id}`, {
			method: 'DELETE',
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to delete subject');
		return true;
	},

	// Teacher management operations
	async getAllTeachers(): Promise<{ id: number; name: string; contactInfo?: string; hireDate?: string; status: string; username?: string; userId?: number }[]> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/teachers`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch teachers');
		return data.data || [];
	},

	async updateTeacher(id: number, payload: { fullName: string; contactInfo?: string; hireDate?: string; status?: string }): Promise<{ id: number; name: string; contactInfo?: string; hireDate?: string; status: string }> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/teachers/${id}`, {
			method: 'PUT',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to update teacher');
		return data.data;
	},

	// Enrollment management operations
	async getEnrollments(params: { status?: string; page?: number; limit?: number } = {}): Promise<{ data: any[]; pagination: any }> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		
		const queryParams = new URLSearchParams();
		if (params.status) queryParams.append('status', params.status);
		if (params.page) queryParams.append('page', params.page.toString());
		if (params.limit) queryParams.append('limit', params.limit.toString());
		
		const res = await fetch(`${API_BASE_URL}/admin/enrollments?${queryParams}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch enrollments');
		return data;
	},

	async getEnrollment(id: number): Promise<any> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/enrollments/${id}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch enrollment');
		return data.data;
	},

	// Alias useful for clarity when called from student view modal
	async getEnrollmentDetails(studentId: number): Promise<any> {
		return this.getEnrollment(studentId);
	},

    async approveEnrollment(id: number, notes?: string, scheduleAssignments?: Array<{scheduleId: number}>, sectionId?: number): Promise<boolean> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/enrollments/${id}/approve`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes, scheduleAssignments, sectionId })
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to approve enrollment');
		return true;
	},

	async declineEnrollment(id: number, reason: string, notes?: string): Promise<boolean> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/enrollments/${id}/decline`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ reason, notes })
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to decline enrollment');
		return true;
	},

	async getEnrollmentStats(): Promise<any> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/enrollments/stats`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch enrollment stats');
		return data.data;
	},

	// ===== SUBJECT ASSIGNMENT API =====

	// Get all student-subject assignments
	getStudentSubjects: async (filters: {
		studentId?: number;
		subjectId?: number;
		teacherId?: number;
		page?: number;
		limit?: number;
	} = {}) => {
		const token = localStorage.getItem('token');
		const params = new URLSearchParams();
		
		if (filters.studentId) params.append('studentId', filters.studentId.toString());
		if (filters.subjectId) params.append('subjectId', filters.subjectId.toString());
		if (filters.teacherId) params.append('teacherId', filters.teacherId.toString());
		if (filters.page) params.append('page', filters.page.toString());
		if (filters.limit) params.append('limit', filters.limit.toString());

		const res = await fetch(`${API_BASE_URL}/admin/student-subjects?${params}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch student subjects');
		return data;
	},

	// Get students without subject assignments
	getStudentsWithoutSubjects: async (filters: {
		gradeLevel?: string;
		section?: string;
	} = {}) => {
		const token = localStorage.getItem('token');
		const params = new URLSearchParams();
		
		if (filters.gradeLevel) params.append('gradeLevel', filters.gradeLevel);
		if (filters.section) params.append('section', filters.section);

		const res = await fetch(`${API_BASE_URL}/admin/students-without-subjects?${params}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch students without subjects');
		return data.data;
	},

	// Assign subject to student
	assignSubject: async (assignment: {
		studentId: number;
		subjectId: number;
		teacherId: number;
	}) => {
		const token = localStorage.getItem('token');
		const res = await fetch(`${API_BASE_URL}/admin/student-subjects`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify(assignment)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to assign subject');
		return data;
	},

	// Remove subject assignment
	removeSubjectAssignment: async (assignmentId: number) => {
		const token = localStorage.getItem('token');
		const res = await fetch(`${API_BASE_URL}/admin/student-subjects/${assignmentId}`, {
			method: 'DELETE',
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to remove subject assignment');
		return data;
	},

	// Get subject assignment statistics
	getSubjectAssignmentStats: async () => {
		const token = localStorage.getItem('token');
		const res = await fetch(`${API_BASE_URL}/admin/student-subjects/stats`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch subject assignment stats');
		return data.data;
	},

	// Get all subjects
	getSubjects: async () => {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/subjects`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch subjects');
		return data.data;
	},

	// Get all teachers
	getTeachers: async () => {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/teachers`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch teachers');
		return data.data;
	},

	// Get all schedules
	getSchedules: async () => {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/schedules`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch schedules');
		return data.data;
	},

	// Note: Section schedules have been removed. All scheduling now uses the teacherschedule table.

	// Sections
	async listSections(gradeLevel?: string, isActive?: boolean) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const qs = new URLSearchParams();
		if (gradeLevel) qs.set('gradeLevel', gradeLevel);
		if (isActive !== undefined) qs.set('isActive', String(isActive));
		const res = await fetch(`${API_BASE_URL}/admin/sections?${qs.toString()}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch sections');
		return data.data || [];
	},

	async createSection(payload: { sectionName: string; gradeLevel: string; description?: string; capacity?: number; isActive?: boolean }) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/sections`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to create section');
		return data.data;
	},

	async updateSection(id: number, payload: { sectionName: string; gradeLevel: string; description?: string; capacity?: number; isActive?: boolean }) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/sections/${id}`, {
			method: 'PUT',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to update section');
		return data.data;
	},

	async deleteSection(id: number) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/sections/${id}`, {
			method: 'DELETE',
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to delete section');
		return data.data;
	},

	// Student Schedule Assignment functions
	async getStudentSchedules(filters: {
		studentId?: number;
		scheduleId?: number;
		page?: number;
		limit?: number;
	} = {}) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		
		const params = new URLSearchParams();
		if (filters.studentId) params.append('studentId', filters.studentId.toString());
		if (filters.scheduleId) params.append('scheduleId', filters.scheduleId.toString());
		if (filters.page) params.append('page', filters.page.toString());
		if (filters.limit) params.append('limit', filters.limit.toString());

		const res = await fetch(`${API_BASE_URL}/admin/student-schedules?${params}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch student schedules');
		return data.data || [];
	},

	async assignScheduleToStudent(payload: { studentId: number; scheduleId: number }) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/student-schedules`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to assign schedule to student');
		return data.data;
	},

	// Alias for assignScheduleToStudent for backward compatibility
	async assignSchedule(payload: { studentId: number; scheduleId: number }) {
		return this.assignScheduleToStudent(payload);
	},

	async assignMultipleSchedules(assignments: { studentId: number; scheduleId: number }[]) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/student-schedules/bulk`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ assignments })
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to assign schedules to student');
		return data.data;
	},

	async removeScheduleAssignment(assignmentId: number) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/student-schedules/${assignmentId}`, {
			method: 'DELETE',
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to remove schedule assignment');
		return true;
	},

}; 