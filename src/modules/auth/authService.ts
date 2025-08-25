import { User, LoginFormData } from '../../types';
import { mockUsers, mockPasswords } from './mockData';

export class AuthService {
  static async login(credentials: LoginFormData): Promise<User | null> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { email, password } = credentials;
    const storedPassword = mockPasswords[email];
    
    if (storedPassword && storedPassword === password) {
      const user = mockUsers.find(u => u.email === email);
      return user || null;
    }
    
    return null;
  }

  static async validateToken(token: string): Promise<User | null> {
    // In a real app, this would validate JWT tokens
    // For now, we'll just return null to force re-login
    return null;
  }

  static logout(): void {
    // Clear any stored tokens/session data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }
} 