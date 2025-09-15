export interface User {
  id: string;
  name: string;
  role: 'admin' | 'teacher' | 'parent' | 'registrar' | 'superadmin';
  email: string;
  section?: string;
  gradeLevel?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  isLoading: boolean;
  startOtpLogin?: (email: string, password: string) => Promise<number | null>;
  verifyOtp?: (userId: number, otp: string) => Promise<User | null>;
  otpPhase?: boolean;
  otpUserId?: number | null;
  resetOtpPhase?: () => void;
}

export interface LoginFormData {
  email: string;
  password: string;
}

// New interfaces for admin functionality
export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'parent' | 'admin' | 'registrar' | 'superadmin';
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  createdAt: string;
  permissions: string[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Section-related interfaces
export interface Section {
  id: number;
  sectionName: string;
  gradeLevel: string;
  description?: string;
  capacity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  fullName: string;
  gradeLevel: string;
  section: string;
  sectionId?: number;
  sectionName?: string;
  sectionDescription?: string;
  sectionCapacity?: number;
  parentId?: number;
  parentName?: string;
  parentContact?: string;
  status: string;
  hasFingerprint: boolean;
  dateOfBirth?: string;
  gender?: string;
  placeOfBirth?: string;
  nationality?: string;
  address?: string;
}

export interface TeacherSchedule {
  id: number;
  teacherId: number;
  teacherName: string;
  subjectId: number;
  subjectName: string;
  gradeLevel: string;
  section: string;
  sectionId?: number;
  sectionName?: string;
  timeIn: string;
  timeOut: string;
  dayOfWeek: string;
  gracePeriod: number;
  isActive: boolean;
}