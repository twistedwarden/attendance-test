import { User } from '../../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    role: 'admin',
    email: 'admin@foothills.edu',
  },
  {
    id: '2',
    name: 'Mrs. Sarah Johnson',
    role: 'teacher',
    email: 'sarah.johnson@foothills.edu',
    section: 'A',
    gradeLevel: 'Grade 1'
  },
  {
    id: '3',
    name: 'Mr. Michael Chen',
    role: 'teacher',
    email: 'michael.chen@foothills.edu',
    section: 'B',
    gradeLevel: 'Grade 2'
  },
  {
    id: '4',
    name: 'Ms. Emily Davis',
    role: 'teacher',
    email: 'emily.davis@foothills.edu',
    section: 'A',
    gradeLevel: 'Grade 3'
  }
];

// Internal storage for passwords (in real app, this would be hashed and stored securely)
export const mockPasswords: Record<string, string> = {
  'admin@foothills.edu': 'admin123',
  'sarah.johnson@foothills.edu': 'teacher123',
  'michael.chen@foothills.edu': 'teacher123',
  'emily.davis@foothills.edu': 'teacher123'
}; 