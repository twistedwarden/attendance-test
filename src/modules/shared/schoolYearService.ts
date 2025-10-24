// Universal service for school year operations
import { SchoolYear } from '../../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const SchoolYearService = {
  // Get active school year (accessible by all authenticated users)
  async getActiveSchoolYear(): Promise<SchoolYear> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE_URL}/auth/active-school-year`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch active school year');
    return data.data;
  }
};
