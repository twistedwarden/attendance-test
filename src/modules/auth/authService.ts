import { User, LoginFormData } from '../../types';

const API_BASE_URL = 'https://attendance-test-oj4f.onrender.com/api';

export class AuthService {
  static async login(credentials: LoginFormData): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success && data.data) {
        // Store token in localStorage
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user_data', JSON.stringify(data.data.user));
        return data.data.user;
      }

      return null;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async validateToken(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Token is invalid, clear storage
        this.logout();
        return null;
      }

      if (data.success && data.data) {
        // Update stored user data
        localStorage.setItem('user_data', JSON.stringify(data.data));
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('Token validation error:', error);
      this.logout();
      return null;
    }
  }

  static async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Call logout endpoint
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }

  static getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  static getStoredUser(): User | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  static async updateProfile(updates: Partial<User>): Promise<User | null> {
    try {
      const token = this.getStoredToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }

      if (data.success && data.data) {
        // Update stored user data
        localStorage.setItem('user_data', JSON.stringify(data.data));
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const token = this.getStoredToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password change failed');
      }

      return data.success;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  // New method to get user's students (for parents)
  static async getUserStudents(): Promise<any[]> {
    try {
      const token = this.getStoredToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/users/students`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch students');
      }

      return data.success ? data.data : [];
    } catch (error) {
      console.error('Get students error:', error);
      throw error;
    }
  }

  // New method to get user's notifications
  static async getNotifications(): Promise<any[]> {
    try {
      const token = this.getStoredToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/users/notifications`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch notifications');
      }

      return data.success ? data.data : [];
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  }
} 