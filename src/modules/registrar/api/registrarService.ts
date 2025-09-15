const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class RegistrarService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Overview and Stats
  static async getOverviewStats() {
    const response = await fetch(`${API_BASE_URL}/registrar/overview`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch overview stats: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // Enrollment Management
  static async getEnrollments(params: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}/registrar/enrollments?${queryParams}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch enrollments');
    }
    
    return response.json();
  }

  static async getEnrollmentStats() {
    const response = await fetch(`${API_BASE_URL}/registrar/enrollments/stats`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch enrollment stats');
    }
    
    return response.json();
  }

  static async approveEnrollment(enrollmentId: string, data: { notes?: string; sectionId?: number | string | null; scheduleIds?: Array<number | string> }) {
    const response = await fetch(`${API_BASE_URL}/registrar/enrollments/${enrollmentId}/approve`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to approve enrollment');
    }
    
    return response.json();
  }

  static async getRegistrarSchedules() {
    const response = await fetch(`${API_BASE_URL}/registrar/schedules`, {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch schedules');
    }
    return response.json();
  }

  static async declineEnrollment(enrollmentId: string, data: { reason: string; notes?: string }) {
    const response = await fetch(`${API_BASE_URL}/registrar/enrollments/${enrollmentId}/decline`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to decline enrollment');
    }
    
    return response.json();
  }

  // Student Management
  static async getStudents(params: {
    search?: string;
    gradeLevel?: string;
    status?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.gradeLevel) queryParams.append('gradeLevel', params.gradeLevel);
    if (params.status) queryParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/registrar/students?${queryParams}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }
    
    return response.json();
  }

  static async updateStudent(studentId: string, data: Partial<{
    studentName: string;
    dateOfBirth: string;
    gender: string;
    placeOfBirth: string;
    nationality: string;
    address: string;
    gradeLevel: string;
    section: string;
    parentName: string;
    parentContact: string;
  }>) {
    const response = await fetch(`${API_BASE_URL}/registrar/students/${studentId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update student');
    }
    
    return response.json();
  }

  static async getSections() {
    const response = await fetch(`${API_BASE_URL}/registrar/sections`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch sections');
    }
    
    return response.json();
  }

  // Reports
  static async getReports(filters: {
    dateRange: string;
    gradeLevel: string;
    reportType: string;
  }) {
    const queryParams = new URLSearchParams();
    queryParams.append('dateRange', filters.dateRange);
    queryParams.append('gradeLevel', filters.gradeLevel);
    queryParams.append('reportType', filters.reportType);

    const response = await fetch(`${API_BASE_URL}/registrar/reports?${queryParams}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }
    
    return response.json();
  }

  static async exportReport(type: string, filters: {
    dateRange: string;
    gradeLevel: string;
    reportType: string;
  }) {
    const queryParams = new URLSearchParams();
    queryParams.append('type', type);
    queryParams.append('dateRange', filters.dateRange);
    queryParams.append('gradeLevel', filters.gradeLevel);
    queryParams.append('reportType', filters.reportType);

    const response = await fetch(`${API_BASE_URL}/registrar/reports/export?${queryParams}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to export report');
    }
    
    // Handle file download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Attendance Management
  static async getAttendanceStats(params: {
    dateRange?: string;
    gradeLevel?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.dateRange) queryParams.append('dateRange', params.dateRange);
    if (params.gradeLevel) queryParams.append('gradeLevel', params.gradeLevel);

    const response = await fetch(`${API_BASE_URL}/registrar/attendance/stats?${queryParams}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch attendance stats');
    }
    
    return response.json();
  }

  static async getAttendanceLogs(params: {
    date?: string;
    gradeLevel?: string;
    section?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.date) queryParams.append('date', params.date);
    if (params.gradeLevel) queryParams.append('gradeLevel', params.gradeLevel);
    if (params.section) queryParams.append('section', params.section);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/registrar/attendance/logs?${queryParams}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch attendance logs');
    }
    
    return response.json();
  }

  // Notifications
  static async getNotifications() {
    const response = await fetch(`${API_BASE_URL}/registrar/notifications`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    
    return response.json();
  }

  static async markNotificationAsRead(notificationId: string) {
    const response = await fetch(`${API_BASE_URL}/registrar/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
    
    return response.json();
  }
}

export { RegistrarService };
