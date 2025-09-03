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

export interface RegistrationRequest {
  id: string;
  applicantName: string;
  email: string;
  requestedRole: 'teacher' | 'parent';
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedDate?: string;
  documents: string[];
  notes?: string;
  priority: 'normal' | 'high' | 'urgent';
} 