export interface User {
  id: string;
  name: string;
  role: 'admin' | 'teacher' | 'parent';
  email: string;
  section?: string;
  gradeLevel?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  isLoading: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
} 