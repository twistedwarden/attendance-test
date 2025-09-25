// Parent service for fetching real data from the database

import { ExcuseLetter, ExcuseLetterFormData } from '../../../types';

const API_BASE_URL = 'https://attendance-test-production.up.railway.app/api';

const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export interface Parent {
  parentId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  relationship?: string;
  contactInfo?: string;
}

export interface Student {
  studentId: number;
  fullName: string;
  gradeLevel: string;
  section: string;
  parentId: number;
  enrollmentStatus?: 'pending' | 'declined' | 'approved';
}

export interface AttendanceRecord {
  attendanceId: number;
  studentId: number;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  status: 'Present' | 'Late' | 'Excused' | 'Absent';
}

export interface AttendanceStats {
  todayStatus: 'Present' | 'Late' | 'Excused' | 'Absent' | 'No Record';
  weeklyPercentage: number;
}

export interface Notification {
  id: number;
  studentId: number;
  studentName: string;
  gradeLevel: string;
  section: string;
  status: 'approved' | 'declined';
  reviewDate: string;
  notes?: string;
  declineReason?: string;
  reviewedBy?: string;
  message: string;
  isRead: boolean;
}

export interface ParentMessageItem {
  id: number;
  dateSent: string;
  status: 'unread' | 'read';
  type: 'attendance' | 'behavior' | 'academic' | 'general' | string;
  teacherName?: string | null;
  studentName?: string | null;
  message: string;
}

export interface ParentMessageRecipient {
  teacherUserId: number;
  teacherName: string;
  students: Array<{ studentId: number; studentName: string }>;
}

export interface SubjectAttendanceRecord {
  attendanceId: number;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  status: 'Present' | 'Late' | 'Excused' | 'Absent';
  createdAt: string;
}

export interface SubjectAttendanceData {
  subjectId: number;
  subjectName: string;
  teacherName: string;
  scheduleTimeIn: string;
  scheduleTimeOut: string;
  dayOfWeek: string;
  gracePeriod: number;
  attendanceRecords: SubjectAttendanceRecord[];
  stats: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    attendanceRate: number;
  };
}

export const ParentService = {
  // Read enrollment_enabled setting
  async getEnrollmentEnabled(): Promise<boolean> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE_URL}/parent/settings/enrollment`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch enrollment setting');
    return Boolean(data?.data?.enabled);
  },
  // Get parent profile data
  async getParentProfile(): Promise<Parent> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch parent profile');
    
    // Get additional parent details
    const parentRes = await fetch(`${API_BASE_URL}/parent/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const parentData = await parentRes.json();
    
    return {
      parentId: parentData.data?.ParentID || 0,
      fullName: parentData.data?.FullName || data.data?.name || '',
      email: data.data?.email || '',
      phoneNumber: parentData.data?.ContactInfo || '',
      contactInfo: parentData.data?.ContactInfo || '',
      relationship: 'Parent'
    };
  },

  // ===== ENROLLMENT FOLLOW-UP DOCUMENTS =====

  async getEnrollmentDocuments(studentId?: number): Promise<Array<{ documentId: number; studentId: number; studentName: string; documents: string[]; additionalInfo?: string; createdAt: string }>> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const params = new URLSearchParams();
    if (studentId) params.set('studentId', String(studentId));

    const res = await fetch(`${API_BASE_URL}/parent/enrollment-documents?${params.toString()}`.replace(/\?$/, params.toString() ? `?${params.toString()}` : ''), {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch enrollment documents');
    return data.data || [];
  },

  async submitEnrollmentDocuments(payload: { studentId: number; documents: string[]; additionalInfo?: string }): Promise<{ documentId: number }>{
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE_URL}/parent/enrollment-documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit enrollment documents');
    return data.data;
  },

  // Get students linked to parent
  async getParentStudents(): Promise<Student[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/parent/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch students');
    
    // Map database field names to frontend interface
    const students = (data.data || []).map((student: any) => ({
      studentId: student.studentId,
      fullName: student.fullName,
      gradeLevel: student.gradeLevel,
      section: student.section,
      parentId: student.parentId,
      enrollmentStatus: student.enrollmentStatus?.toLowerCase() || 'pending'
    }));
    
    return students;
  },

  // Get attendance records for a specific student
  async getStudentAttendance(studentId: number, limit: number = 30): Promise<AttendanceRecord[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/parent/attendance/${studentId}?limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch attendance records');
    
    return data.data || [];
  },

  // Get attendance statistics for a student
  async getStudentAttendanceStats(studentId: number): Promise<AttendanceStats> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/parent/attendance-stats/${studentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch attendance stats');
    
    return data.data || { todayStatus: 'No Record', weeklyPercentage: 0 };
  },

  // Get enrollment review notifications
  async getNotifications(): Promise<Notification[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/parent/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch notifications');
    
    return data.data || [];
  },

  // ===== TEACHER MESSAGES =====
  async getMessages(limit: number = 100): Promise<ParentMessageItem[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const params = new URLSearchParams({ limit: String(limit) });
    const res = await fetch(`${API_BASE_URL}/parent/messages?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch messages');
    return data.data || [];
  },

  async markMessageAsRead(notificationId: number): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE_URL}/parent/messages/${notificationId}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to mark message as read');
  },

  async getMessageRecipients(): Promise<ParentMessageRecipient[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE_URL}/parent/messages/recipients`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch recipients');
    return data.data || [];
  },

  async sendMessage(payload: { teacherUserId: number; studentId?: number; type?: 'attendance'|'behavior'|'academic'|'general'; message: string }): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE_URL}/parent/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send message');
  },

  // Mark notification as read
  async markNotificationAsRead(reviewId: number): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/parent/notifications/${reviewId}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to mark notification as read');
  },

  // Mark all notifications as read
  async markAllNotificationsAsRead(): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/parent/notifications/mark-all-read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to mark all notifications as read');
  },
  // Get subject-based attendance for a student
  async getStudentSubjectAttendance(studentId: number, limit: number = 30): Promise<SubjectAttendanceData[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/parent/subject-attendance/${studentId}?limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch subject attendance');
    
    return data.data || [];
  },

  calculateAttendanceStats(attendanceRecords: AttendanceRecord[]): AttendanceStats {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = attendanceRecords.find(record => record.date === today);
    
    // Calculate weekly attendance (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= oneWeekAgo;
    });
    
    const presentDays = weeklyRecords.filter(record => 
      record.status === 'Present' || record.status === 'Late'
    ).length;
    
    const weeklyPercentage = weeklyRecords.length > 0 
      ? Math.round((presentDays / weeklyRecords.length) * 100)
      : 0;

    return {
      todayStatus: todayRecord ? todayRecord.status : 'No Record',
      weeklyPercentage
    };
  },

  // ===== EXCUSE LETTER METHODS =====

  // Get excuse letters for parent's students
  async getExcuseLetters(studentId?: number, status?: string, limit: number = 50): Promise<ExcuseLetter[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const params = new URLSearchParams();
    if (studentId) params.set('studentId', studentId.toString());
    if (status) params.set('status', status);
    params.set('limit', limit.toString());
    
    const res = await fetch(`${API_BASE_URL}/parent/excuse-letters?${params.toString()}`, {
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
    
    const res = await fetch(`${API_BASE_URL}/parent/excuse-letters/${excuseLetterId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch excuse letter details');
    
    return data.data;
  },

  // Submit excuse letter
  async submitExcuseLetter(formData: ExcuseLetterFormData): Promise<{ excuseLetterId: number }> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/parent/excuse-letters`, {
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
  }
};

