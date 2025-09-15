// Parent service for fetching real data from the database

const API_BASE_URL = 'http://localhost:5000/api';

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
  status: 'Present' | 'Late' | 'Excused';
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

export const ParentService = {
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
  }
};

