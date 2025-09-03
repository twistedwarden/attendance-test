export interface AdminUser {
	id: number;
	email: string;
	role: 'admin' | 'teacher' | 'parent' | 'registrar' | 'superadmin' | '';
	status: 'active' | 'pending' | 'disabled' | '';
	name?: string;
}

export interface Registration {
	RegistrationID: number;
	UserType: 'Parent' | 'Teacher';
	FullName: string;
	ContactInfo?: string;
	Username: string;
	Status: 'Pending' | 'Approved' | 'Denied';
	ReviewedBy?: number | null;
	ReviewedDate?: string | null;
}

const API_BASE_URL = 'http://localhost:5000/api';

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

	async createUser(payload: { email: string; password: string; role: 'admin'|'teacher'|'parent'|'registrar'|'superadmin'; status?: 'Active'|'Pending'|'Disabled'; }): Promise<AdminUser> {
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

	async updateUser(id: number, payload: { email?: string; role?: 'admin'|'teacher'|'parent'|'registrar'|'superadmin'; password?: string; status?: 'Active'|'Pending'|'Disabled'; }): Promise<AdminUser> {
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

	async createStudent(payload: { name: string; gradeLevel?: string | null; section?: string | null; parentId?: number | null; parentContact?: string | null; }) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/students`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to create student');
		return data.data;
	},

	async updateStudent(id: number, payload: { name?: string; gradeLevel?: string | null; section?: string | null; parentId?: number | null; parentContact?: string | null; }) {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/students/${id}`, {
			method: 'PUT',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
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

	async listRegistrations(status: 'Pending' | 'Approved' | 'Denied' = 'Pending'): Promise<Registration[]> {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/registrations?status=${encodeURIComponent(status)}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to fetch registrations');
		return (data.data || []) as Registration[];
	},

	async reviewRegistration(id: number, decision: 'Approved' | 'Denied') {
		const token = getToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${API_BASE_URL}/admin/registrations/${id}/review`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ decision })
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || 'Failed to review registration');
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

	async createParentFull(payload: { fullName: string; contactInfo?: string | null; email: string; password: string; }) {
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
	}
}; 