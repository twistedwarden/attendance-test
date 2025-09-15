const API_BASE_URL = 'http://localhost:5000/api';

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
  }
};

export default TeacherService;


