import { ExcuseLetter, ExcuseLetterFormData, ExcuseLetterReviewData } from '../../../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const getToken = (): string | null => localStorage.getItem('auth_token');

export interface TeacherSchedule {
  id: number;
  subjectId: number;
  subjectName: string;
  sectionId: number | null;
  sectionName: string | null;
  gradeLevel: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  gracePeriod: number;
}

export interface TeacherStudent {
  id: number;
  studentId: number;
  studentName: string;
  gradeLevel?: string | null;
  sectionName?: string | null;
}

export const TeacherService = {
  async getSchedules(): Promise<TeacherSchedule[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE_URL}/teacher/schedules`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch teacher schedules');
    return data.data || [];
  },

  async getStudents(scheduleId: number): Promise<TeacherStudent[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE_URL}/teacher/students?scheduleId=${scheduleId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch students');
    return data.data || [];
  },

  async getSubjectAttendance(scheduleId: number, date: string): Promise<Array<{ studentId: number; studentName: string; sectionName: string | null; subjectAttendanceId: number | null; status: string | null; subjectId: number; date: string }>> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const params = new URLSearchParams({ scheduleId: String(scheduleId), date });
    const res = await fetch(`${API_BASE_URL}/teacher/subject-attendance?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch subject attendance');
    return data.data || [];
  },

  async setSubjectAttendance(payload: { scheduleId: number; studentId: number; date: string; status: 'Present'|'Late'|'Excused'|'Absent'; }): Promise<{ subjectAttendanceId: number; status: string }> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE_URL}/teacher/subject-attendance`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update subject attendance');
    return data.data;
  }
  ,
  // ===== MESSAGES METHODS =====
  async getMessageRecipients(): Promise<Array<{ parentId: number; parentUserId: number; parentName: string; studentNames: string[] }>> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE_URL}/teacher/messages/recipients`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch recipients');
    return data.data || [];
  },

  async getMessages(limit: number = 50): Promise<Array<{ id: number; dateSent: string; status: 'sent'|'read'; type: string; parentName?: string | null; studentName?: string | null; message: string }>> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const params = new URLSearchParams({ limit: String(limit) });
    const res = await fetch(`${API_BASE_URL}/teacher/messages?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch messages');
    return data.data || [];
  },

  async sendMessage(payload: { parentId?: number; parentUserId?: number; studentId?: number; type?: 'attendance'|'behavior'|'academic'|'general'; message: string }): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE_URL}/teacher/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send message');
  },

  async getStudentDetails(scheduleId: number, studentId: number, opts: { dateFrom?: string; dateTo?: string } = {}) {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const params = new URLSearchParams({ scheduleId: String(scheduleId), studentId: String(studentId) });
    if (opts.dateFrom) params.set('dateFrom', opts.dateFrom);
    if (opts.dateTo) params.set('dateTo', opts.dateTo);
    const res = await fetch(`${API_BASE_URL}/teacher/student-details?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch student details');
    return data.data;
  },

  // ===== EXCUSE LETTER METHODS =====

  // Get excuse letters for teacher's students
  async getExcuseLetters(studentId?: number, status?: string, subjectId?: number, limit: number = 50): Promise<ExcuseLetter[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const params = new URLSearchParams();
    if (studentId) params.set('studentId', studentId.toString());
    if (status) params.set('status', status);
    if (subjectId) params.set('subjectId', subjectId.toString());
    params.set('limit', limit.toString());
    
    const res = await fetch(`${API_BASE_URL}/teacher/excuse-letters?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch excuse letters');
    
    return data.data || [];
  },

  // Get excuse letter details
  async getExcuseLetterDetails(excuseLetterId: number): Promise<ExcuseLetter> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/teacher/excuse-letters/${excuseLetterId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch excuse letter details');
    
    return data.data;
  },

  // Submit excuse letter (for teachers)
  async submitExcuseLetter(formData: ExcuseLetterFormData): Promise<{ excuseLetterId: number }> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/teacher/excuse-letters`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit excuse letter');
    
    return data.data;
  },

  // Review excuse letter (approve/decline)
  async reviewExcuseLetter(excuseLetterId: number, reviewData: ExcuseLetterReviewData): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/teacher/excuse-letters/${excuseLetterId}/review`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to review excuse letter');
  },

  // ===== REPORTS METHODS =====
  async getReports(params: { period: 'day'|'today'|'week'|'month'|'quarter'|'year'; scheduleId?: number; gradeLevel?: string }): Promise<{ totalStudents: number; averageAttendance: number; perfectAttendance: number; chronicAbsent: number; trend: number; }> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const search = new URLSearchParams();
    search.set('period', params.period);
    if (params.scheduleId) search.set('scheduleId', String(params.scheduleId));
    if (params.gradeLevel) search.set('gradeLevel', params.gradeLevel);
    const res = await fetch(`${API_BASE_URL}/teacher/reports?${search.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch reports');
    return data.data;
  },

  async exportReport(label: 'attendance'|'student-list', params: { period: 'day'|'today'|'week'|'month'|'quarter'|'year'; scheduleId?: number; gradeLevel?: string }): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const search = new URLSearchParams();
    search.set('label', label);
    search.set('period', params.period);
    if (params.scheduleId) search.set('scheduleId', String(params.scheduleId));
    if (params.gradeLevel) search.set('gradeLevel', params.gradeLevel);
    const res = await fetch(`${API_BASE_URL}/teacher/reports/export?${search.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.text();
      throw new Error(`Failed to export report: ${res.status} ${res.statusText} ${data}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher-${label}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      a.remove();
    }, 0);
  }
};

export default TeacherService;


